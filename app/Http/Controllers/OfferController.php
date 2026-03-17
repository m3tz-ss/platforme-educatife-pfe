<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Resources\OfferResource;

class OfferController extends Controller
{
    // ✅ Offres publiques pour les étudiants
    public function publicIndex()
    {
        $perPage = request()->integer('per_page', 0);
        $query   = Offer::with(['user'])->latest();

        $offers = $perPage && $perPage > 0
            ? $query->paginate($perPage)
            : $query->get();

        return OfferResource::collection($offers);
    }

    // ✅ Offres du RH/Manager connecté
    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = $request->integer('per_page', 0);

        if ($user->role === 'manager') {
            $query = Offer::with('user')
                ->where(function ($q) use ($user) {
                    $q->where('enterprise_id', $user->id)
                      ->orWhereIn('enterprise_id', function ($q2) use ($user) {
                          $q2->select('id')
                             ->from('users')
                             ->where('manager_id', $user->id);
                      });
                })
                ->latest();
        } else {
            $query = Offer::where('enterprise_id', $user->id)->latest();
        }

        $offers = $perPage && $perPage > 0
            ? $query->paginate($perPage)
            : $query->get();

        return OfferResource::collection($offers);
    }

    // ✅ Créer une offre
    public function store(Request $request)
    {
        $request->validate([
            'title'           => 'required|string|max:255',
            'domain'          => 'required|string|max:255',
            'location'        => 'required|string|max:255',
            'duration'        => 'required|string',
            'startDate'       => 'nullable|date',
            'availablePlaces' => 'nullable|integer|min:1',
            'description'     => 'required|string',
            'requirements'    => 'nullable|string',
            'advantages'      => 'nullable|string',
        ]);

        $user = $request->user();

        // ✅ enterprise_id = id du user connecté (RH ou Manager)
        $offer = Offer::create([
            'enterprise_id'    => $user->id, // ✅ corrigé
            'title'            => $request->title,
            'domain'           => $request->domain,
            'location'         => $request->location,
            'duration'         => $request->duration,
            'start_date'       => $request->startDate,
            'available_places' => $request->availablePlaces,
            'description'      => $request->description,
            'requirements'     => $request->requirements,
            'advantages'       => $request->advantages,
        ]);

        return response()->json([
            'message' => 'Offre publiée avec succès',
            'offer'   => $offer,
        ], 201);
    }

    // ✅ Modifier une offre
    public function update(Request $request, Offer $offer)
    {
        $offer->update([
            'title'            => $request->title           ?? $offer->title,
            'domain'           => $request->domain          ?? $offer->domain,
            'location'         => $request->location        ?? $offer->location,
            'duration'         => $request->duration        ?? $offer->duration,
            'start_date'       => $request->startDate       ?? $offer->start_date,
            'available_places' => $request->availablePlaces ?? $offer->available_places,
            'description'      => $request->description     ?? $offer->description,
            'requirements'     => $request->requirements    ?? $offer->requirements,
            'advantages'       => $request->advantages      ?? $offer->advantages,
        ]);

        return response()->json([
            'message' => 'Offre mise à jour',
            'offer'   => $offer,
        ]);
    }

    // ✅ Supprimer une offre
    public function destroy(Offer $offer)
    {
        $offer->delete();
        return response()->json(['message' => 'Offre supprimée']);
    }
}