<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'            => 'required|string',
            'email'           => 'required|email|unique:users',
            'password'        => 'required|min:6',
            'type'            => 'required|in:enterprise,student',
            'role'            => 'sometimes|nullable|in:manager,rh,encadrant',
            'enterprise_name' => 'sometimes|nullable|string',
        ]);

        $enterpriseId = null;

        // ✅ Créer Enterprise seulement si manager
        if ($request->role === 'manager' && $request->enterprise_name) {
            $enterprise = \App\Models\Enterprise::create([
                'name'  => $request->enterprise_name,
                'email' => $request->email, // ✅ email entreprise = email manager
            ]);
            $enterpriseId = $enterprise->id;
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'type'          => $request->type,
            'role'          => $request->role ?? null,
            'enterprise_id' => $enterpriseId,
            'company_name'  => $request->enterprise_name ?? null, // ✅
        ]);

        // ✅ Lier manager à enterprise
        if ($request->role === 'manager' && $enterpriseId) {
            \App\Models\Enterprise::find($enterpriseId)->update([
                'manager_id' => $user->id,
            ]);
        }

        return response()->json([
            'token' => $user->createToken('token')->plainTextToken,
            'user'  => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,
                'type'             => $user->role ?: $user->type,
                'role'             => $user->role,
                'company_name'     => $user->company_name,
                'enterprise_email' => $user->email, // ✅ manager = email entreprise
                'enterprise_id'    => $user->enterprise_id,
            ]
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email ou mot de passe incorrect'], 401);
        }

        $user->load('enterprise');

        // ✅ Récupérer company_name et enterprise_email
        if ($user->role === 'manager') {
            $companyName     = $user->company_name ?? $user->enterprise?->name;
            $enterpriseEmail = $user->email;
        } else if (in_array($user->role, ['rh', 'encadrant'])) {
            $manager         = User::find($user->manager_id);
            $companyName     = $user->company_name ?? $manager?->company_name;
            $enterpriseEmail = $manager?->email;
        } else {
            $companyName     = null;
            $enterpriseEmail = $user->email;
        }

        $typeForRedirect = $user->role ?: $user->type;

        return response()->json([
            'token' => $user->createToken('token')->plainTextToken,
            'user'  => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,
                'type'             => $typeForRedirect,
                'role'             => $user->role,
                'enterprise_id'    => $user->enterprise_id,
                'company_name'     => $companyName,      // ✅
                'enterprise_email' => $enterpriseEmail,  // ✅
            ]
        ]);
    }

    public function enterpriseLogin(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
            'role'     => 'required|in:manager,rh,encadrant',
        ]);

        $user = User::where('email', $request->email)
                    ->where('role', $request->role)
                    ->where('type', 'enterprise')
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email ou mot de passe incorrect'], 401);
        }

        // ✅ Récupérer company_name et enterprise_email
        if ($user->role === 'manager') {
            $companyName     = $user->company_name;
            $enterpriseEmail = $user->email;
        } else {
            $manager         = User::find($user->manager_id);
            $companyName     = $user->company_name ?? $manager?->company_name;
            $enterpriseEmail = $manager?->email;
        }

        return response()->json([
            'token' => $user->createToken('token')->plainTextToken,
            'user'  => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,          // ✅ email personnel
                'type'             => $user->role,
                'role'             => $user->role,
                'manager_id'       => $user->manager_id,
                'enterprise_id'    => $user->enterprise_id,
                'company_name'     => $companyName,          // ✅ nom entreprise
                'enterprise_email' => $enterpriseEmail,      // ✅ email manager/entreprise
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}