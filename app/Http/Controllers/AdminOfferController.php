<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Offer;
use Illuminate\Support\Facades\Validator;

class AdminOfferController extends Controller
{
    // ── Lister toutes les offres ───────────────────────────
    public function index()
    {
        $offers = Offer::with('enterprise')
                       ->withCount('applications')
                       ->get();

        return response()->json(
            $offers->map(function ($offer) {
                return [
                    'id'                 => $offer->id,
                    'title'              => $offer->title,
                    'domain'             => $offer->domain,
                    'location'           => $offer->location,
                    'duration'           => $offer->duration,
                    'description'        => $offer->description,
                    'company'            => $offer->enterprise ? $offer->enterprise->name : null,
                    'applications_count' => $offer->applications_count,
                ];
            })
        );
    }

    // ── Créer une nouvelle offre ─────────────────────────
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'required|string|max:255',
            'domain'      => 'nullable|string|max:255',
            'location'    => 'required|string|max:255',
            'duration'    => 'required|string|max:50',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $offer = Offer::create($request->only('title', 'domain', 'location', 'duration', 'description'));

        return response()->json(array_merge($offer->toArray(), [
            'company'            => null,
            'applications_count' => 0,
        ]), 201);
    }

    // ── Afficher une offre spécifique ────────────────────
    public function show($id)
    {
        $offer = Offer::find($id);
        if (!$offer) {
            return response()->json(['message' => 'Offre non trouvée'], 404);
        }
        return response()->json($offer);
    }

    // ── Mettre à jour une offre ──────────────────────────
    public function update(Request $request, $id)
    {
        $offer = Offer::find($id);
        if (!$offer) {
            return response()->json(['message' => 'Offre non trouvée'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title'       => 'sometimes|required|string|max:255',
            'domain'      => 'sometimes|nullable|string|max:255',
            'location'    => 'sometimes|required|string|max:255',
            'duration'    => 'sometimes|required|string|max:50',
            'description' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $offer->update($request->only('title', 'domain', 'location', 'duration', 'description'));

        return response()->json($offer);
    }

    // ── Supprimer une offre ──────────────────────────────
    public function destroy($id)
    {
        $offer = Offer::find($id);
        if (!$offer) {
            return response()->json(['message' => 'Offre non trouvée'], 404);
        }

        $offer->delete();

        return response()->json(['message' => 'Offre supprimée']);
    }
}