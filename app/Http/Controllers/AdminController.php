<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Offer;
use App\Models\Application;
use App\Models\Interview;

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
    public function users() {
    return User::with('roles')->latest()->get();
}

public function updateRole(User $user, Request $request) {
    $user->type = $request->role;
    $user->save();

    return response()->json(['message' => 'Rôle mis à jour']);
}

public function deleteUser(User $user) {
    $user->delete();
    return response()->json(['message' => 'Supprimé']);
}
}