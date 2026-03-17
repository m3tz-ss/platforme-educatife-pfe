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
        'students' => \App\Models\User::where('type','student')->count(),
        'enterprises' => \App\Models\User::where('type','enterprise')->count(),
        'offers' => \App\Models\Offer::count(),
        'applications' => \App\Models\Application::count(),
        'interviews' => \App\Models\Interview::count(),

         "latest_students" => User::where('type','student')
                                ->latest()
                                ->take(5)
                                ->get(),

        "latest_enterprises" => User::where('type','enterprise')
                                ->latest()
                                ->take(5)
                                ->get(),

        "latest_applications" => Application::with(['student', 'offer'])
    ->latest()
    ->take(5)
    ->get(),

        
    ]);
}
}
