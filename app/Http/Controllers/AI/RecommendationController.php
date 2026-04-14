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
    private string $openrouterApiKey;
    private int $cacheTtl;

    public function __construct()
    {
        $this->openrouterApiKey = env('OPENROUTER_API_KEY');
        $this->cacheTtl = (int) env('GEMINI_CACHE_TTL', 7200);
    }

    public function recommend(Request $request)
    {
        $user = $request->user();

        // ✅ Vérifier les compétences
        $skills = is_array($user->skills) ? $user->skills : [];
        
        if (empty($skills)) {
            return response()->json([
                'error' => 'profile_incomplete',
                'message' => 'Veuillez renseigner vos compétences pour recevoir des recommandations personnalisées.',
            ], 422);
        }

        // ✅ Vérifier bio et field
        if (empty($user->bio) || empty($user->field)) {
            return response()->json([
                'error' => 'profile_incomplete',
                'message' => 'Veuillez compléter votre profil (bio et domaine d\'études).',
            ], 422);
        }

        // ✅ Cache
        $cacheKey = 'ai_recommendations_' . $user->id;
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json([
                'recommendations' => $cached,
                'cached' => true,
            ]);
        }

        // ✅ Charger les offres
        $offers = Offer::with('enterprise')
            ->latest()
            ->take(30)
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
                'message' => 'Aucune offre disponible.',
            ], 404);
        }

        // ✅ Construire le prompt
        $skillsList = implode(', ', $skills);
        $offersJson = json_encode($offers->toArray(), JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Tu es un expert en recrutement et orientation professionnelle. Analyse le profil d'un étudiant et recommande les 5 meilleures offres de stage en fonction de sa compatibilité.

PROFIL ÉTUDIANT :
- Nom: {$user->name}
- Domaine d'études: {$user->field}
- Compétences: {$skillsList}
- Bio/Présentation: {$user->bio}

OFFRES DISPONIBLES (JSON):
{$offersJson}

INSTRUCTIONS :
1. Analyse la compatibilité entre le profil et chaque offre
2. Sélectionne les 5 meilleures offres (ou moins s'il y en a moins)
3. Pour chaque offre, donne un score de 0 à 100
4. Explique brièvement pourquoi en français (max 80 mots)

RÉPONDS UNIQUEMENT AVEC UN TABLEAU JSON VALIDE, PAS DE MARKDOWN :
[{"offer_id": 1, "score": 85, "reason": "Explication..."},...]
PROMPT;

        try {
            Log::info('Appel OpenRouter API pour recommandations');

            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => "Bearer {$this->openrouterApiKey}",
                    'HTTP-Referer' => url('/'),
                    'X-Title' => 'MyStage AI Recommendations',
                ])
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'gpt-3.5-turbo',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 1024,
                ]);

            // ✅ Vérifier la réponse
            if ($response->status() === 429) {
                Log::warning('OpenRouter quota dépassé');
                return response()->json([
                    'error' => 'api_quota_exceeded',
                    'message' => 'Le service IA a atteint sa limite. Réessayez dans quelques heures.',
                ], 503);
            }

            if (!$response->successful()) {
                Log::error('OpenRouter API error: ' . $response->status() . ' ' . $response->body());
                return response()->json([
                    'error' => 'generic',
                    'message' => 'Erreur du service IA.',
                ], 503);
            }

            $data = $response->json();
            $text = $data['choices'][0]['message']['content'] ?? null;

            if (!$text) {
                Log::error('OpenRouter: réponse vide');
                return response()->json([
                    'error' => 'generic',
                    'message' => 'Réponse vide du service IA.',
                ], 500);
            }

            // ✅ Nettoyer le JSON
            $text = trim($text);
            $text = preg_replace('/^```json\s*/i', '', $text);
            $text = preg_replace('/^```\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $text = trim($text);

            $parsed = json_decode($text, true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($parsed)) {
                Log::error('JSON parse error: ' . json_last_error_msg(), ['text' => $text]);
                return response()->json([
                    'error' => 'generic',
                    'message' => 'Erreur de parsing de la réponse IA.',
                ], 500);
            }

            // ✅ Enrichir les données
            $allOffers = Offer::with('enterprise')->get()->keyBy('id');

            $enriched = collect($parsed)
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

            // ✅ Mettre en cache
            Cache::put($cacheKey, $enriched, $this->cacheTtl);

            return response()->json([
                'recommendations' => $enriched,
                'cached'          => false,
            ]);

        } catch (\Exception $e) {
            Log::error('OpenRouter exception: ' . $e->getMessage());
            return response()->json([
                'error' => 'generic',
                'message' => 'Erreur du service IA: ' . $e->getMessage(),
            ], 503);
        }
    }
}