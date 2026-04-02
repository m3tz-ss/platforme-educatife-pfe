<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
// ✅ NOUVEAU — Créer un manager (accessible par l'entreprise connectée)
    public function setupManager(Request $request)
    {
        // Vérifier que c'est bien une entreprise connectée
        if ($request->user()->type !== 'enterprise') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
 
        $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);
 
        // Créer le manager lié à l'entreprise connectée
        $manager = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'type'       => 'enterprise',
            'role'       => 'manager',
            'manager_id' => $request->user()->id, // 👈 lié à l'entreprise connectée
        ]);
 
        // Assigner le rôle Spatie
        if (!\Spatie\Permission\Models\Role::where('name', 'manager')->exists()) {
            \Spatie\Permission\Models\Role::create(['name' => 'manager']);
        }
        $manager->assignRole('manager');
 
        return response()->json([
            'message' => 'Manager créé avec succès',
            'manager' => [
                'id'    => $manager->id,
                'name'  => $manager->name,
                'email' => $manager->email,
                'role'  => 'manager',
            ]
        ], 201);
    }
    // Liste RH / Encadrants pour le manager connecté uniquement
    public function index(Request $request)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $users = User::where('type', 'enterprise')
                     ->whereIn('role', ['rh', 'encadrant'])
                     ->where('manager_id', $request->user()->id) // 👈 filtre par manager connecté
                     ->get();

        return response()->json($users);
    }

    // Ajouter RH / Encadrant (lié au manager connecté)
    public function store(Request $request)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'role' => 'required|in:rh,encadrant',
        ]);

        $user = User::create([
    'name'         => $request->name,
    'email'        => $request->email,
    'password'     => Hash::make($request->password),
    'type'         => 'enterprise',
    'role'         => $request->role,
    'manager_id'   => $request->user()->id,
    'enterprise_id' => $request->user()->enterprise_id, 
    'company_name' => $request->user()->company_name, // ✅ hérite du manager
]);

        return response()->json([
            'message' => 'Utilisateur ajouté avec succès',
            'user' => $user
        ]);
    }

    // Modifier RH / Encadrant (uniquement ceux du manager connecté)
    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $user = User::where('manager_id', $request->user()->id)->findOrFail($id); // 👈 sécurité

        $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|min:6',
            'role' => 'sometimes|in:rh,encadrant',
        ]);

        if ($request->has('name')) $user->name = $request->name;
        if ($request->has('email')) $user->email = $request->email;
        if ($request->has('password')) $user->password = Hash::make($request->password);
        if ($request->has('role')) $user->role = $request->role;

        $user->save();

        return response()->json([
            'message' => 'Utilisateur mis à jour',
            'user' => $user
        ]);
    }

    // Supprimer RH / Encadrant (uniquement ceux du manager connecté)
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $user = User::where('manager_id', $request->user()->id)->findOrFail($id); // 👈 sécurité
        $user->delete();

        return response()->json([
            'message' => 'Utilisateur supprimé'
        ]);
    }

   public function encadrants(Request $request)
{
    if ($request->user()->role !== 'rh') {
        return response()->json(['message' => 'Accès refusé'], 403);
    }

    return User::where('role', 'encadrant')
               ->where('manager_id', $request->user()->manager_id)
               ->get();
}
}