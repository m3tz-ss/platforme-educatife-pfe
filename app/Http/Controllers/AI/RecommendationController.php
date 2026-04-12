<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class RecommendationController extends Controller
{
    /**
     * Clés API Gemini (fallback automatique si quota dépassé)
     */
    private array $apiKeys;
    private int $cacheTtl;

    // ✅ Modèles confirmés disponibles (listés via API /v1beta/models)
    // Tous utilisent v1beta — les modèles récents ne sont PAS dans v1
    private array $geminiModels = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-001:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    ];

    public function __construct()
    {
        $this->apiKeys = array_values(array_filter([
            env('GEMINI_API_KEY_1'),
            env('GEMINI_API_KEY_2'),
            env('GEMINI_API_KEY_3'),
        ]));
        $this->cacheTtl = (int) env('GEMINI_CACHE_TTL', 7200); // 2h par défaut
    }


    /**
     * GET /api/ai/recommendations
     * Retourne les meilleures offres recommandées pour l'étudiant connecté
     */
    public function recommend(Request $request)
    {
        $user = $request->user();

        // ✅ Vérification : profil complet ?
        $skills = $user->skills ?? [];
        if (empty($skills)) {
            return response()->json([
                'error' => 'profile_incomplete',
                'message' => 'Veuillez renseigner vos compétences pour recevoir des recommandations personnalisées.',
            ], 422);
        }

        // ✅ Vérification : informations de base minimales
        if (empty($user->bio) && empty($user->field)) {
            return response()->json([
                'error' => 'profile_incomplete',
                'message' => 'Veuillez compléter votre profil (bio et domaine d\'études) pour de meilleures recommandations.',
            ], 422);
        }

        // ✅ Cache : récupérer les recommandations si déjà calculées
        $cacheKey = 'ai_recommendations_' . $user->id;
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json([
                'recommendations' => $cached,
                'cached' => true,
            ]);
        }

        // ✅ Charger les offres disponibles
        $offers = Offer::with('enterprise')
            ->latest()
            ->take(30) // Limiter pour économiser les tokens
            ->get()
            ->map(fn($offer) => [
                'id'           => $offer->id,
                'title'        => $offer->title,
                'domain'       => $offer->domain,
                'description'  => substr($offer->description ?? '', 0, 300),
                'requirements' => substr($offer->requirements ?? '', 0, 200),
                'location'     => $offer->location,
                'duration'     => $offer->duration,
                'advantages'   => substr($offer->advantages ?? '', 0, 150),
                'enterprise'   => $offer->enterprise?->name ?? 'N/A',
            ]);

        if ($offers->isEmpty()) {
            return response()->json([
                'error' => 'no_offers',
                'message' => 'Aucune offre disponible pour le moment.',
            ], 404);
        }

        // ✅ Construire le prompt Gemini
        $skillsList = implode(', ', $skills);
        $offersJson = json_encode($offers->toArray(), JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Tu es un expert en recrutement et orientation professionnelle. Analyse le profil d'un étudiant et recommande les meilleures offres de stage.

PROFIL ÉTUDIANT :
- Nom: {$user->name}
- Domaine d'études: {$user->field}
- Établissement: {$user->school}
- Compétences: {$skillsList}
- Bio/Présentation: {$user->bio}

OFFRES DISPONIBLES (JSON):
{$offersJson}

INSTRUCTIONS :
1. Analyse la compatibilité entre le profil étudiant et chaque offre
2. Sélectionne les 5 meilleures offres (maximum)
3. Pour chaque offre, calcule un score de compatibilité de 0 à 100
4. Explique brièvement pourquoi cette offre correspond au profil (en français, max 80 mots)

RÉPONDS UNIQUEMENT avec un tableau JSON valide, sans markdown, sans texte avant ou après :
[{"offer_id": 1, "score": 85, "reason": "Explication..."},...]
PROMPT;

        // ✅ Appel API Gemini avec fallback entre clés
        $recommendations = $this->callGeminiWithFallback($prompt);

        if ($recommendations === null) {
            return response()->json([
                'error'   => 'api_quota_exceeded',
                'message' => 'Gemini API Failed — Le quota de l\'API est dépassé. Réessayez dans quelques heures.',
            ], 503);
        }

        // ✅ Enrichir les recommandations avec les données complètes des offres
        $offersById = $offers->keyBy('id');
        $allOffers  = Offer::with('enterprise')->get()->keyBy('id');

        $enriched = collect($recommendations)
            ->filter(fn($rec) => isset($rec['offer_id']) && $allOffers->has($rec['offer_id']))
            ->map(function ($rec) use ($allOffers) {
                $offer = $allOffers->get($rec['offer_id']);
                return [
                    'offer_id'    => $rec['offer_id'],
                    'score'       => min(100, max(0, (int) ($rec['score'] ?? 0))),
                    'reason'      => $rec['reason'] ?? '',
                    'offer'       => [
                        'id'              => $offer->id,
                        'title'           => $offer->title,
                        'domain'          => $offer->domain,
                        'location'        => $offer->location,
                        'duration'        => $offer->duration,
                        'description'     => $offer->description,
                        'requirements'    => $offer->requirements,
                        'advantages'      => $offer->advantages,
                        'available_places'=> $offer->available_places,
                        'start_date'      => $offer->start_date,
                        'enterprise'      => [
                            'id'   => $offer->enterprise?->id,
                            'name' => $offer->enterprise?->name,
                        ],
                    ],
                ];
            })
            ->sortByDesc('score')
            ->values()
            ->toArray();

        // ✅ Sauvegarder dans le cache (TTL configuré dans .env)
        Cache::put($cacheKey, $enriched, $this->cacheTtl);

        return response()->json([
            'recommendations' => $enriched,
            'cached'          => false,
        ]);
    }

    /**
     * Appel Gemini avec fallback automatique : essaie chaque modèle avec chaque clé API
     */
    private function callGeminiWithFallback(string $prompt): ?array
    {
        if (empty($this->apiKeys)) {
            Log::error('Gemini: aucune clé API configurée dans .env');
            return null;
        }

        foreach ($this->geminiModels as $modelUrl) {
            foreach ($this->apiKeys as $apiKey) {
                Log::info('Gemini: tentative avec ' . $modelUrl);
                $result = $this->callGemini($apiKey, $prompt, $modelUrl);

                if ($result === 'quota_exceeded') {
                    Log::warning("Gemini quota dépassé pour clé sur {$modelUrl}, essai clé suivante...");
                    continue; // clé suivante, même modèle
                }

                if ($result === 'model_not_found') {
                    Log::warning("Gemini: modèle non trouvé {$modelUrl}, passage au modèle suivant...");
                    break; // passer directement au modèle suivant
                }

                if ($result !== null) {
                    Log::info("Gemini: succès avec {$modelUrl}");
                    return $result; // ✅ Succès
                }

                // Autre erreur : essayer clé suivante
                Log::error("Gemini: erreur inconnue sur {$modelUrl}, clé suivante...");
            }
        }

        Log::error('Gemini: toutes les clés et modèles ont échoué');
        return null;
    }

    /**
     * Appel direct à l'API Gemini
     * Retourne 'quota_exceeded', 'model_not_found', null (erreur), ou array (résultat)
     */
    private function callGemini(string $apiKey, string $prompt, string $modelUrl): string|array|null
    {
        try {
            $response = Http::timeout(30)
                ->post("{$modelUrl}?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature'     => 0.3,
                        'maxOutputTokens' => 1024,
                    ],
                    'safetySettings' => [
                        ['category' => 'HARM_CATEGORY_HARASSMENT',        'threshold' => 'BLOCK_NONE'],
                        ['category' => 'HARM_CATEGORY_HATE_SPEECH',       'threshold' => 'BLOCK_NONE'],
                        ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_NONE'],
                        ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_NONE'],
                    ],
                ]);

            $statusCode = $response->status();
            $body       = $response->body();

            // ✅ Quota dépassé
            if ($statusCode === 429) {
                return 'quota_exceeded';
            }

            // ✅ Modèle introuvable (essayer un autre modèle)
            if ($statusCode === 404) {
                Log::warning('Gemini 404 NOT_FOUND: ' . $body);
                return 'model_not_found';
            }

            // ✅ Erreur de permission / clé invalide (essayer clé suivante)
            if ($statusCode === 400 || $statusCode === 401 || $statusCode === 403) {
                Log::error("Gemini {$statusCode}: " . $body);
                return null;
            }

            if (!$response->successful()) {
                Log::error('Gemini API error: ' . $statusCode . ' ' . $body);
                return null;
            }

            $data = $response->json();

            // ✅ Extraire le texte de la réponse Gemini
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$text) {
                // Vérifier si la réponse est bloquée par safety
                $finishReason = $data['candidates'][0]['finishReason'] ?? null;
                Log::error('Gemini: réponse vide ou bloquée', ['finishReason' => $finishReason, 'data' => $data]);
                return null;
            }

            // ✅ Nettoyer le JSON (Gemini ajoute parfois des backticks markdown)
            $text = trim($text);
            $text = preg_replace('/^```json\s*/i', '', $text);
            $text = preg_replace('/^```\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $text = trim($text);

            $parsed = json_decode($text, true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($parsed)) {
                Log::error('Gemini: impossible de parser le JSON', ['text' => $text, 'json_error' => json_last_error_msg()]);
                return null;
            }

            return $parsed;

        } catch (\Exception $e) {
            Log::error('Gemini API exception: ' . $e->getMessage());
            return null;
        }
    }
}
