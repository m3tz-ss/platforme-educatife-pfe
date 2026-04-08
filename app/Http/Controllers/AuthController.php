<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\Enterprise;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /* ════════════════════════════════════════════════════════════════
     |  REGISTER
     |  POST /api/register
     ════════════════════════════════════════════════════════════════ */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|unique:users,email',
            'password'        => 'required|min:6',
            'type'            => 'required|in:enterprise,student',
            'role'            => 'sometimes|nullable|in:manager,rh,encadrant',
            'enterprise_name' => 'sometimes|nullable|string|max:255',
        ]);

        $enterpriseId = null;

        // ✅ Créer l'entreprise seulement si le rôle est manager
        if (($validated['role'] ?? null) === 'manager' && !empty($validated['enterprise_name'])) {
            $enterprise = Enterprise::create([
                'name'  => $validated['enterprise_name'],
                'email' => $validated['email'],
            ]);
            $enterpriseId = $enterprise->id;
        }

        $user = User::create([
            'name'          => $validated['name'],
            'email'         => $validated['email'],
            'password'      => Hash::make($validated['password']),
            'type'          => $validated['type'],
            'role'          => $validated['role'] ?? null,
            'enterprise_id' => $enterpriseId,
            'company_name'  => $validated['enterprise_name'] ?? null,
        ]);

        // ✅ Lier le manager à son entreprise en une seule requête
        if (($validated['role'] ?? null) === 'manager' && $enterpriseId) {
            Enterprise::where('id', $enterpriseId)->update(['manager_id' => $user->id]);
        }

        return response()->json([
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user'  => $this->formatUser($user),
        ], 201);
    }

    /* ════════════════════════════════════════════════════════════════
     |  LOGIN
     |  POST /api/login
     |  Optimisations :
     |   - Une seule requête SQL avec eager loading (with)
     |   - Index sur email (voir migration)
     |   - Anciens tokens supprimés avant d'en créer un nouveau
     |   - manager_id résolu conditionnellement avec select limité
     ════════════════════════════════════════════════════════════════ */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // ✅ Eager loading en UNE SEULE requête SQL (évite le N+1)
        $user = User::with('enterprise:id,name,email,manager_id')
                    ->where('email', $request->email)
                    ->first();

        // ✅ Vérification de l'existence et du mot de passe
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(
                ['message' => 'Email ou mot de passe incorrect'],
                401
            );
        }

        // ✅ Résolution du manager en une seule requête conditionnelle
        //    Uniquement pour rh/encadrant, et seulement si manager_id existe
        $manager = null;
        if (in_array($user->role, ['rh', 'encadrant'], true) && $user->manager_id) {
            $manager = User::select('id', 'email', 'company_name')
                           ->find($user->manager_id);
        }

        // ✅ Déterminer company_name et enterprise_email sans requêtes supplémentaires
        [$companyName, $enterpriseEmail] = $this->resolveEnterpriseInfo($user, $manager);

        // ✅ Supprimer les anciens tokens pour éviter la croissance de personal_access_tokens
       
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,
                'type'             => $user->role ?: $user->type,
                'role'             => $user->role,
                'enterprise_id'    => $user->enterprise_id,
                'company_name'     => $companyName,
                'enterprise_email' => $enterpriseEmail,
            ],
        ]);
    }

    /* ════════════════════════════════════════════════════════════════
     |  ENTERPRISE LOGIN (login avec sélection de rôle)
     |  POST /api/enterprise/login
     ════════════════════════════════════════════════════════════════ */
    public function enterpriseLogin(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
            'role'     => 'required|in:manager,rh,encadrant',
        ]);

        // ✅ Une seule requête avec toutes les conditions
        $user = User::with('enterprise:id,name,email')
                    ->where('email', $request->email)
                    ->where('role', $request->role)
                    ->where('type', 'enterprise')
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(
                ['message' => 'Email ou mot de passe incorrect'],
                401
            );
        }

        // ✅ Résolution du manager si nécessaire
        $manager = null;
        if (in_array($user->role, ['rh', 'encadrant'], true) && $user->manager_id) {
            $manager = User::select('id', 'email', 'company_name')
                           ->find($user->manager_id);
        }

        [$companyName, $enterpriseEmail] = $this->resolveEnterpriseInfo($user, $manager);

        // ✅ Rotation des tokens
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,
                'type'             => $user->role,
                'role'             => $user->role,
                'manager_id'       => $user->manager_id,
                'enterprise_id'    => $user->enterprise_id,
                'company_name'     => $companyName,
                'enterprise_email' => $enterpriseEmail,
            ],
        ]);
    }

    /* ════════════════════════════════════════════════════════════════
     |  LOGOUT
     |  POST /api/logout
     ════════════════════════════════════════════════════════════════ */
    public function logout(Request $request): JsonResponse
    {
        // ✅ Supprimer uniquement le token courant (pas tous les appareils)
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté avec succès']);
    }

    /* ════════════════════════════════════════════════════════════════
     |  LOGOUT ALL DEVICES
     |  POST /api/logout-all
     ════════════════════════════════════════════════════════════════ */
    public function logoutAllDevices(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Déconnecté de tous les appareils']);
    }

    /* ════════════════════════════════════════════════════════════════
     |  ME — retourner l'utilisateur courant
     |  GET /api/me
     ════════════════════════════════════════════════════════════════ */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('enterprise:id,name,email');

        return response()->json(['user' => $this->formatUser($user)]);
    }

    /* ════════════════════════════════════════════════════════════════
     |  MÉTHODES PRIVÉES
     ════════════════════════════════════════════════════════════════ */

    /**
     * Résoudre company_name et enterprise_email selon le rôle.
     * Retourne [string|null $companyName, string|null $enterpriseEmail]
     */
    private function resolveEnterpriseInfo(User $user, ?User $manager): array
    {
        return match ($user->role) {
            'manager' => [
                $user->company_name ?? $user->enterprise?->name,
                $user->email,
            ],
            'rh', 'encadrant' => [
                $user->company_name ?? $manager?->company_name,
                $manager?->email,
            ],
            default => [null, $user->email],
        };
    }

    /**
     * Formater la réponse utilisateur de façon cohérente.
     */
    private function formatUser(User $user): array
    {
        return [
            'id'               => $user->id,
            'name'             => $user->name,
            'email'            => $user->email,
            'type'             => $user->role ?: $user->type,
            'role'             => $user->role,
            'enterprise_id'    => $user->enterprise_id,
            'company_name'     => $user->company_name ?? $user->enterprise?->name,
            'enterprise_email' => $user->role === 'manager' ? $user->email : null,
        ];
    }
}