<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\User;
use App\Mail\NewOfferPublishedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Http\Resources\OfferResource;

class OfferController extends Controller
{
    // ✅ Détail d'une offre publique (étudiants)
    public function publicShow(Offer $offer)
    {
        $offer->load(['user', 'user.manager'])->loadCount(['applications as accepted_count' => function($q) {
            $q->where('status', 'acceptee');
        }]);
        return new OfferResource($offer);
    }

    // ✅ Offres publiques pour les étudiants
    public function publicIndex()
    {
        $perPage = request()->integer('per_page', 40);

        $query = Offer::with(['user', 'user.manager'])
            ->withCount(['applications as accepted_count' => function($q) {
                $q->where('status', 'acceptee');
            }])
            ->latest();
        $offers = $query->paginate($perPage);

        return OfferResource::collection($offers);
    }

    // ✅ Offres du RH/Manager connecté
    public function index(Request $request)
    {
        $user    = $request->user();
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

    // ✅ Créer une offre + ✉️ notifier tous les étudiants par email
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

        $offer = Offer::create([
            'enterprise_id'    => $user->id,
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

        // ✉️ Notifier les étudiants en arrière-plan (Job)
        \App\Jobs\NotifyStudentsOfNewOffer::dispatch($offer);

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
