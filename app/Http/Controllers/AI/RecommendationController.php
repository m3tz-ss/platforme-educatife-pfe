<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class RecommendationController extends Controller
{
    private string $groqApiKey;
    private int $cacheTtl;

    /**
     * Modèles Groq (ultra-rapides, gratuits)
     * Groq a 14,400 requêtes/jour gratuit
     */
    private array $groqModels = [
        'llama-3.3-70b-versatile',               // Meilleur: 70B ultra-rapide
        'meta-llama/llama-4-scout-17b-16e-instruct', // Llama 4 Scout
        'qwen/qwen3-32b',                        // Qwen 32B fallback
        'llama-3.1-8b-instant',                  // Petit mais rapide
    ];

    public function __construct()
    {
        $this->groqApiKey = config('services.groq.key', env('GROQ_API_KEY', ''));
        $this->cacheTtl = (int) env('GEMINI_CACHE_TTL', 7200);

        if (empty($this->groqApiKey)) {
            Log::error('GROQ_API_KEY manquante dans .env');
        }
    }

    /**
     * Appelle Groq avec fallback automatique sur plusieurs modèles.
     * Retourne le contenu texte de la réponse, ou null si tous les modèles échouent.
     */
    private function callAI(string $prompt, int $maxTokens = 300): ?string
    {
        foreach ($this->groqModels as $model) {
            try {
                Log::info("Groq - Essai modèle: {$model}");

                $response = Http::timeout(45)
                    ->withHeaders([
                        'Authorization' => "Bearer {$this->groqApiKey}",
                    ])
                    ->post('https://api.groq.com/openai/v1/chat/completions', [
                        'model' => $model,
                        'messages' => [['role' => 'user', 'content' => $prompt]],
                        'temperature' => 0.3,
                        'max_tokens' => $maxTokens,
                    ]);

                $status = $response->status();

                // 429 → quota dépassé → on essaie le modèle suivant
                if ($status === 429) {
                    Log::warning("Groq - Quota dépassé pour {$model}, essai du suivant...");
                    continue;
                }

                // Autre erreur → on logge et on essaie le suivant
                if (!$response->successful()) {
                    Log::warning("Groq - Erreur {$status} pour {$model}: " . $response->body());
                    continue;
                }

                $data = $response->json();
                $text = $data['choices'][0]['message']['content'] ?? null;

                if (empty($text)) {
                    Log::warning("Groq - Réponse vide pour {$model}, essai du suivant...");
                    continue;
                }

                Log::info("✅ Groq - Succès avec le modèle: {$model}");
                return $text;

            } catch (\Exception $e) {
                Log::warning("Groq - Exception pour {$model}: " . $e->getMessage());
                continue;
            }
        }

        // Tous les modèles ont échoué
        Log::error('❌ Groq - Tous les modèles IA ont échoué');
        return null;
    }

    /**
     * Nettoie le JSON renvoyé par l'IA (supprime les balises markdown).
     */
    private function cleanJson(string $text): string
    {
        $text = trim($text);
        // Supprimer les blocs ```json ... ``` ou ``` ... ```
        $text = preg_replace('/^```json\s*/i', '', $text);
        $text = preg_replace('/^```\s*/i', '', $text);
        $text = preg_replace('/\s*```$/i', '', $text);
        // Extraire uniquement le tableau JSON si du texte précède
        if (preg_match('/(\[.*\])/s', $text, $matches)) {
            $text = $matches[1];
        }
        return trim($text);
    }

    /**
     * Génère des recommandations simples sans IA (mode dégradé)
     */
    private function generateSimpleRecommendations($offers, User $user): array
    {
        Log::warning('Mode dégradé: génération de recommandations simples sans IA');

        $skills = is_array($user->skills) ? $user->skills : [];
        $skillsLower = array_map('strtolower', $skills);

        $scored = $offers->map(function ($offer) use ($skillsLower) {
            $reqLower = strtolower($offer['requirements'] ?? '');
            $matchCount = 0;

            foreach ($skillsLower as $skill) {
                if (stripos($reqLower, $skill) !== false) {
                    $matchCount++;
                }
            }

            return array_merge($offer, ['match_count' => $matchCount]);
        });

        return $scored
            ->sortByDesc('match_count')
            ->take(5)
            ->map(function ($offer, $index) {
                return [
                    'offer_id' => $offer['id'],
                    'score' => max(60, 100 - ($index * 8)),
                    'reason' => "Recommandation basée sur vos compétences (mode simplifié).",
                    'offer' => $offer,
                    'degraded' => true,
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * ─────────────────────────────────────────────────────
     * Recommander les 5 meilleures offres pour un étudiant.
     * ─────────────────────────────────────────────────────
     */
    public function recommend(Request $request)
    {
        $user = $request->user();

        // Vérifier les compétences
        $skills = is_array($user->skills) ? $user->skills : [];
        if (empty($skills)) {
            return response()->json([
                'error' => 'profile_incomplete',
                'message' => 'Veuillez renseigner vos compétences pour recevoir des recommandations personnalisées.',
            ], 422);
        }

        // Vérifier bio et field
        if (empty($user->bio) || empty($user->field)) {
            return response()->json([
                'error' => 'profile_incomplete',
                'message' => "Veuillez compléter votre profil (bio et domaine d'études).",
            ], 422);
        }

        // Cache
        $cacheKey = 'ai_recommendations_' . $user->id;
        if (!$request->has('refresh')) {
            $cached = Cache::get($cacheKey);
            if ($cached) {
                return response()->json(['recommendations' => $cached, 'cached' => true]);
            }
        }

        // Charger les offres
        $offers = Offer::with(['enterprise.manager'])
            ->latest()
            ->take(30)
            ->get()
            ->map(function ($offer) {
                $user = $offer->enterprise;
                $manager = $user?->manager;
                $companyName = 'N/A';
                $companyEmail = 'N/A';
                $companyLogoPath = null;
                
                if ($user) {
                    if (in_array($user->role, ['rh', 'encadrant'])) {
                        $companyName = $manager?->company_name ?? $user->company_name ?? 'N/A';
                        $companyEmail = $manager?->email ?? $user->email ?? 'N/A';
                        $companyLogoPath = $manager?->logo_path ?? $user->logo_path;
                    } else {
                        $companyName = $user->company_name ?? $user->name;
                        $companyEmail = $user->email ?? 'N/A';
                        $companyLogoPath = $user->logo_path;
                    }
                }

                $logoUrl = $companyLogoPath ? Storage::disk('public')->url($companyLogoPath) : null;

                return [
                    'id' => $offer->id,
                    'title' => $offer->title,
                    'domain' => $offer->domain,
                    'description' => substr($offer->description ?? '', 0, 300),
                    'requirements' => substr($offer->requirements ?? '', 0, 200),
                    'location' => $offer->location,
                    'duration' => $offer->duration,
                    'advantages' => substr($offer->advantages ?? '', 0, 150),
                    'enterprise' => [
                        'company_name' => $companyName,
                        'email' => $companyEmail,
                        'logo_url' => $logoUrl,
                    ],
                ];
            });

        if ($offers->isEmpty()) {
            return response()->json([
                'error' => 'no_offers',
                'message' => 'Aucune offre disponible.',
            ], 404);
        }

        $skillsList = implode(', ', $skills);
        $offersJson = json_encode($offers->toArray(), JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Tu es un expert en recrutement. Analyse le profil d'un étudiant et recommande les 5 meilleures offres de stage.

PROFIL ÉTUDIANT :
- Nom: {$user->name}
- Domaine d'études: {$user->field}
- Compétences: {$skillsList}
- Bio: {$user->bio}

OFFRES DISPONIBLES (JSON):
{$offersJson}

INSTRUCTIONS :
1. Analyse la compatibilité entre le profil et chaque offre
2. Sélectionne les 5 meilleures offres
3. Pour chaque offre, donne un score de 0 à 100
4. Explique brièvement pourquoi en français (max 80 mots)

RÉPONDS UNIQUEMENT AVEC UN TABLEAU JSON VALIDE, SANS MARKDOWN :
[{"offer_id": 1, "score": 85, "reason": "Explication..."},...]
PROMPT;

        $text = $this->callAI($prompt, 600);
        $enriched = null;

        // Parser la réponse IA
        if ($text !== null) {
            $text = $this->cleanJson($text);
            $parsed = json_decode($text, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($parsed)) {
                $allOffers = Offer::with(['enterprise.manager'])->get()->keyBy('id');

                $enriched = collect($parsed)
                    ->filter(fn($rec) => isset($rec['offer_id']) && $allOffers->has($rec['offer_id']))
                    ->map(function ($rec) use ($allOffers) {
                        $offer = $allOffers->get($rec['offer_id']);
                        $user = $offer->enterprise;
                        $manager = $user?->manager;

                        $companyName = null;
                        $companyEmail = null;
                        $companyPhone = null;
                        $companyLogoPath = null;

                        if ($user) {
                            if (in_array($user->role, ['rh', 'encadrant'])) {
                                $companyName = $manager?->company_name ?? $user->company_name;
                                $companyEmail = $manager?->email ?? $user->email;
                                $companyPhone = $manager?->phone ?? $user->phone;
                                $companyLogoPath = $manager?->logo_path ?? $user->logo_path;
                            } else {
                                $companyName = $user->company_name ?? $user->name;
                                $companyEmail = $user->email;
                                $companyPhone = $user->phone;
                                $companyLogoPath = $user->logo_path;
                            }
                        }

                        $logoUrl = $companyLogoPath ? Storage::disk('public')->url($companyLogoPath) : null;

                        return [
                            'offer_id' => $rec['offer_id'],
                            'score' => min(100, max(0, (int) ($rec['score'] ?? 0))),
                            'reason' => $rec['reason'] ?? '',
                            'offer' => [
                                'id' => $offer->id,
                                'title' => $offer->title,
                                'domain' => $offer->domain,
                                'location' => $offer->location,
                                'duration' => $offer->duration,
                                'description' => $offer->description,
                                'requirements' => $offer->requirements,
                                'advantages' => $offer->advantages,
                                'available_places' => $offer->available_places,
                                'start_date' => $offer->start_date,
                                'enterprise' => [
                                    'id' => $user?->id,
                                    'company_name' => $companyName ?? 'N/A',
                                    'email' => $companyEmail ?? 'N/A',
                                    'phone' => $companyPhone ?? 'N/A',
                                    'logo_url' => $logoUrl,
                                ],
                            ],
                        ];
                    })
                    ->sortByDesc('score')
                    ->values()
                    ->toArray();
            } else {
                Log::error('JSON parse error (recommend): ' . json_last_error_msg(), ['text' => substr($text, 0, 200)]);
            }
        }

        // Fallback: Mode dégradé si Groq échoue
        if ($enriched === null) {
            Log::info('Mode dégradé activé pour l\'utilisateur ' . $user->id);
            $enriched = $this->generateSimpleRecommendations($offers, $user);
        }

        Cache::put($cacheKey, $enriched, $this->cacheTtl);

        return response()->json([
            'recommendations' => $enriched,
            'cached' => false,
            'degraded' => isset($enriched[0]['degraded']) ? true : false,
        ]);
    }

    /**
     * ───────────────────────────────────────────────────────────
     * Recommander les 5 meilleurs étudiants pour une offre donnée.
     * ───────────────────────────────────────────────────────────
     */
    public function recommendStudentsForOffer(Request $request, $offerId)
    {
        $offer = Offer::with('enterprise')->find($offerId);
        if (!$offer) {
            return response()->json([
                'error' => 'not_found',
                'message' => 'Offre introuvable.',
            ], 404);
        }

        // Cache par offre
        $cacheKey = 'ai_student_recommendations_offer_' . $offerId;
        if (!$request->has('refresh')) {
            $cached = Cache::get($cacheKey);
            if ($cached) {
                return response()->json(['recommendations' => $cached, 'cached' => true]);
            }
        }

        // Charger les étudiants avec profil complet
        $students = User::where('type', 'student')
            ->whereNotNull('skills')
            ->whereNotNull('bio')
            ->whereNotNull('field')
            ->latest()
            ->take(50)
            ->get()
            ->map(fn($student) => [
                'id' => $student->id,
                'name' => $student->name,
                'field' => $student->field ?? '',
                'school' => $student->school ?? '',
                'bio' => substr($student->bio ?? '', 0, 300),
                'skills' => is_array($student->skills)
                    ? implode(', ', $student->skills)
                    : ($student->skills ?? ''),
                'graduation_year' => $student->graduation_year ?? '',
            ]);

        if ($students->isEmpty()) {
            return response()->json([
                'error' => 'no_students',
                'message' => 'Aucun étudiant avec un profil complet trouvé.',
            ], 404);
        }

        $studentsJson = json_encode($students->toArray(), JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Tu es un expert RH. Analyse les profils des étudiants et recommande les 5 meilleurs candidats pour cette offre.

OFFRE DE STAGE :
- Titre: {$offer->title}
- Domaine: {$offer->domain}
- Description: {$offer->description}
- Compétences requises: {$offer->requirements}
- Durée: {$offer->duration}
- Lieu: {$offer->location}

LISTE DES ÉTUDIANTS (JSON):
{$studentsJson}

INSTRUCTIONS :
1. Analyse la compatibilité entre chaque étudiant et l'offre
2. Sélectionne les 5 meilleurs étudiants
3. Pour chaque étudiant, donne un score de 0 à 100
4. Explique brièvement pourquoi en français (max 60 mots)

RÉPONDS UNIQUEMENT AVEC UN TABLEAU JSON VALIDE, SANS MARKDOWN :
[{"student_id": 1, "score": 85, "reason": "Explication..."},...]
PROMPT;

        $text = $this->callAI($prompt, 800);
        $enriched = null;

        if ($text !== null) {
            $text = $this->cleanJson($text);
            $parsed = json_decode($text, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($parsed)) {
                $allStudents = User::where('type', 'student')->get()->keyBy('id');

                $enriched = collect($parsed)
                    ->filter(fn($rec) => isset($rec['student_id']) && $allStudents->has($rec['student_id']))
                    ->map(function ($rec) use ($allStudents) {
                        $student = $allStudents->get($rec['student_id']);
                        return [
                            'student_id' => $rec['student_id'],
                            'score' => min(100, max(0, (int) ($rec['score'] ?? 0))),
                            'reason' => $rec['reason'] ?? '',
                            'student' => [
                                'id' => $student->id,
                                'name' => $student->name,
                                'email' => $student->email,
                                'field' => $student->field,
                                'school' => $student->school,
                                'bio' => $student->bio,
                                'skills' => is_array($student->skills) ? $student->skills : [],
                                'graduation_year' => $student->graduation_year,
                                'cv_path' => $student->cv_path,
                                'photo_path' => $student->photo_path,
                            ],
                        ];
                    })
                    ->sortByDesc('score')
                    ->values()
                    ->toArray();
            } else {
                Log::error('JSON parse error (student recs): ' . json_last_error_msg(), ['text' => substr($text, 0, 200)]);
            }
        }

        if ($enriched === null || empty($enriched)) {
            return response()->json([
                'error' => 'api_quota_exceeded',
                'message' => 'Le service IA est temporairement indisponible. Réessayez dans quelques minutes.',
            ], 503);
        }

        Cache::put($cacheKey, $enriched, $this->cacheTtl);

        return response()->json(['recommendations' => $enriched, 'cached' => false]);
    }
}