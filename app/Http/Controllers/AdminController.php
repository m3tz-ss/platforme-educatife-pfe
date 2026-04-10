<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Offer;
use App\Models\Application;
use App\Models\Interview;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'students'    => User::where('type', 'student')->count(),
            'enterprises' => User::where('type', 'enterprise')->count(),
            'offers'      => Offer::count(),
            'applications'=> Application::count(),
            'interviews'  => Interview::count(),

            // Statuts des candidatures pour le doughnut chart
            'applications_by_status' => Application::selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),

            'latest_students' => User::where('type', 'student')
                ->latest()
                ->take(5)
                ->get(['id', 'name', 'email', 'created_at']),

            'latest_enterprises' => User::where('type', 'enterprise')
                ->latest()
                ->take(5)
                ->get(['id', 'name', 'email', 'created_at']),

            'latest_applications' => Application::with([
                    'student:id,name,email',
                    'offer:id,title',
                ])
                ->latest()
                ->take(5)
                ->get(['id', 'status', 'student_id', 'offer_id', 'created_at']),
        ]);
    }
    // ── Liste des utilisateurs avec is_blocked ────────────────────────────────
    public function users()
    {
        return User::with('roles')->latest()->get()->map(function ($user) {
            $data = $user->toArray();
            $data['is_blocked'] = ($user->remember_token === 'BLOCKED');
            return $data;
        });
    }

    // ── Modifier le rôle ──────────────────────────────────────────────────────
    public function updateRole(User $user, Request $request)
    {
        $request->validate([
            'role' => 'required|in:admin,manager,rh,encadrant,student',
        ]);

        // Si student : type = student, role = null
        if ($request->role === 'student') {
            $user->type = 'student';
            $user->role = null;
        } else {
            $user->type = 'enterprise';
            $user->role = $request->role;
        }
        $user->save();

        return response()->json(['message' => 'Rôle mis à jour', 'user' => $user]);
    }

    // ── Supprimer un utilisateur ──────────────────────────────────────────────
    public function deleteUser(User $user)
    {
        $user->tokens()->delete();
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé']);
    }

    // ── Bloquer un utilisateur ────────────────────────────────────────────────
    public function blockUser(User $user)
    {
        $user->remember_token = 'BLOCKED';
        $user->save();
        // Révoquer tous les tokens actifs
        $user->tokens()->delete();

        return response()->json(['message' => 'Utilisateur bloqué']);
    }

    // ── Débloquer un utilisateur ──────────────────────────────────────────────
    public function unblockUser(User $user)
    {
        $user->remember_token = null;
        $user->save();

        return response()->json(['message' => 'Utilisateur débloqué']);
    }

    // ── Créer un utilisateur (par l'admin) ────────────────────────────────────
    public function createUser(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'type'     => 'required|in:student,enterprise',
            'role'     => 'nullable|in:manager,rh,encadrant',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'type'     => $request->type,
            'role'     => $request->type === 'enterprise' ? $request->role : null,
        ]);

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user'    => array_merge($user->toArray(), ['is_blocked' => false]),
        ], 201);
    }
}