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
        'students' => User::where('type','student')->count(),
        'enterprises' => User::where('type','enterprise')->count(),
        'offers' => Offer::count(),
        'applications' => Application::count(),
        'interviews' => Interview::count(),

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
