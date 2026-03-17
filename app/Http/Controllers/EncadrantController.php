<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;

class EncadrantController extends Controller
{
    public function assign(Request $request, $id)
    {
        $application = Application::findOrFail($id);

        $request->validate([
            'encadrant_id' => 'required|exists:users,id'
        ]);

        $application->encadrant_id = $request->encadrant_id;
        $application->save();

        return response()->json([
            'message' => 'Encadrant affecté avec succès'
        ]);
    }
    public function students(Request $request)
{
    $encadrantId = $request->user()->id;

    $applications = Application::with(['student', 'offer'])
        ->where('encadrant_id', $encadrantId)
        ->get();

    return response()->json($applications);
}
}
