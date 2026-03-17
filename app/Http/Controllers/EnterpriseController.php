<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Enterprise;

class EnterpriseController extends Controller
{
    // Méthode pour créer un manager lié à une entreprise
    public function addManager(Request $request, $enterpriseId)
    {
        // 1️⃣ Vérifier que l'entreprise existe
        $enterprise = Enterprise::findOrFail($enterpriseId);

        // 2️⃣ Valider les champs
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        // 3️⃣ Créer l'utilisateur avec enterprise_id
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'type' => 'manager', // ou 'rh', 'encadrant'
            'enterprise_id' => $enterprise->id,
        ]);

        return response()->json([
            'message' => 'Manager créé avec succès',
            'user' => $user
        ], 201);
    }
}