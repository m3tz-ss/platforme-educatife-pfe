<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    // ✅ GET /api/user/profile
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id'                  => $user->id,
            'name'                => $user->name,
            'email'               => $user->email,
            'phone'               => $user->phone,
            'address'             => $user->address,
            'bio'                 => $user->bio,
            'type'                => $user->type,
            'role'                => $user->role,

            // Étudiant
            'school'              => $user->school,
            'field'               => $user->field,
            'graduation_year'     => $user->graduation_year,
            'cv_name'             => $user->cv_path ? basename($user->cv_path) : null,
            'cv_url'              => $user->cv_path ? Storage::url($user->cv_path) : null,

            // Entreprise
            'position'            => $user->position,
            'department'          => $user->department,
            'company_name'        => $user->company_name,
            'company_description' => $user->company_description,
            'company_website'     => $user->company_website,

            // Photos
            'photo_url'           => $user->photo_path ? Storage::url($user->photo_path) : null,
            'logo_url'            => $user->logo_path  ? Storage::url($user->logo_path)  : null,
        ]);
    }

    // ✅ POST /api/user/profile
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'                => 'sometimes|string|max:255',
            'email'               => 'sometimes|email|unique:users,email,' . $user->id,
            'phone'               => 'sometimes|nullable|string|max:20',
            'address'             => 'sometimes|nullable|string|max:255',
            'bio'                 => 'sometimes|nullable|string|max:1000',

            // Étudiant
            'school'              => 'sometimes|nullable|string|max:255',
            'field'               => 'sometimes|nullable|string|max:255',
            'graduation_year'     => 'sometimes|nullable|integer|min:2000|max:2035',

            // Entreprise
            'position'            => 'sometimes|nullable|string|max:255',
            'department'          => 'sometimes|nullable|string|max:255',
            'company_name'        => 'sometimes|nullable|string|max:255',
            'company_description' => 'sometimes|nullable|string|max:2000',
            'company_website'     => 'sometimes|nullable|url|max:255',

            // Fichiers
            'photo'               => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'logo'                => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'cv'                  => 'sometimes|nullable|file|mimes:pdf|max:5120',
        ]);

        // ✅ Champs texte
        $fields = [
            'name', 'email', 'phone', 'address', 'bio',
            'school', 'field', 'graduation_year',
            'position', 'department', 'company_name',
            'company_description', 'company_website',
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                $user->$field = $request->$field;
            }
        }

        // ✅ Upload photo de profil
        if ($request->hasFile('photo')) {
            // Supprimer l'ancienne photo
            if ($user->photo_path) {
                Storage::disk('public')->delete($user->photo_path);
            }
            $user->photo_path = $request->file('photo')->store('photos', 'public');
        }

        // ✅ Upload logo entreprise
        if ($request->hasFile('logo')) {
            if ($user->logo_path) {
                Storage::disk('public')->delete($user->logo_path);
            }
            $user->logo_path = $request->file('logo')->store('logos', 'public');
        }

        // ✅ Upload CV
        if ($request->hasFile('cv')) {
            if ($user->cv_path) {
                Storage::disk('public')->delete($user->cv_path);
            }
            $user->cv_path = $request->file('cv')->store('cvs', 'public');
        }

        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user'    => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'photo_url'=> $user->photo_path ? Storage::url($user->photo_path) : null,
            ],
        ]);
    }

    // ✅ POST /api/user/change-password
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password'      => 'required|string',
            'new_password'          => 'required|string|min:8',
            'new_password_confirmation' => 'required|same:new_password',
        ]);

        $user = $request->user();

        // ✅ Vérifier le mot de passe actuel
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Mot de passe actuel incorrect',
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Mot de passe modifié avec succès',
        ]);
    }
}