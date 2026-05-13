<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\SavedOffer;
use App\Http\Resources\OfferResource;
use Illuminate\Http\Request;

class SavedOfferController extends Controller
{
    /**
     * Liste des offres sauvegardées par l'étudiant connecté.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $offers = Offer::whereIn('id', function ($query) use ($user) {
            $query->select('offer_id')
                ->from('saved_offers')
                ->where('user_id', $user->id);
        })
        ->with(['user', 'user.manager'])
        ->latest()
        ->get();

        return OfferResource::collection($offers);
    }

    /**
     * Sauvegarder ou retirer une offre des favoris.
     */
    public function toggle(Request $request, int $offerId)
    {
        $user = $request->user();
        
        $exists = SavedOffer::where('user_id', $user->id)
            ->where('offer_id', $offerId)
            ->first();

        if ($exists) {
            $exists->delete();
            return response()->json([
                'message' => 'Offre retirée des favoris',
                'saved' => false
            ]);
        }

        SavedOffer::create([
            'user_id' => $user->id,
            'offer_id' => $offerId
        ]);

        return response()->json([
            'message' => 'Offre sauvegardée avec succès',
            'saved' => true
        ], 201);
    }

    /**
     * Vérifier si une offre est sauvegardée.
     */
    public function check(Request $request, int $offerId)
    {
        $saved = SavedOffer::where('user_id', $request->user()->id)
            ->where('offer_id', $offerId)
            ->exists();

        return response()->json(['saved' => $saved]);
    }
}
