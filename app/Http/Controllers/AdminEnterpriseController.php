<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Enterprise;

class AdminEnterpriseController extends Controller
{
    public function index()
    {
        try {
            // Récupère toutes les entreprises avec leur manager
            $enterprises = Enterprise::with('manager')->get();
            return response()->json($enterprises);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
            'sector' => 'nullable|string|max:255', // si tu veux gérer le secteur
        ]);

        $enterprise = Enterprise::create($request->all());
        return response()->json($enterprise, 201);
    }

    public function update(Request $request, Enterprise $enterprise)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
            'sector' => 'nullable|string|max:255',
        ]);

        $enterprise->update($request->all());
        return response()->json($enterprise);
    }

    public function destroy(Enterprise $enterprise)
    {
        $enterprise->delete();
        return response()->json(['message' => 'Entreprise supprimée']);
    }

    public function show(Enterprise $enterprise)
    {
        return response()->json($enterprise);
    }
}