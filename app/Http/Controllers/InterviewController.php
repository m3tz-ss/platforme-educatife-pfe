<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Interview;  // ← IMPORTANT
use App\Models\Application;

class InterviewController extends Controller
{
    public function store(Request $request)
{
    $request->validate([
        'application_id' => 'required|exists:applications,id',
        'date' => 'required|date',
        'time' => 'required',
        'location' => 'nullable|string',
        'meeting_link' => 'nullable|url',
    ]);

    $interview = Interview::create([
        'application_id' => $request->application_id,
        'date' => $request->date,
        'time' => $request->time,
        'location' => $request->location,
        'meeting_link' => $request->meeting_link,
    ]);

    // 🔥 Mettre candidature en entretien
    $interview->application->update([
        'status' => 'entretien'
    ]);

    return response()->json($interview, 201);
}

public function updateResult(Request $request, $id)
{
    $request->validate([
        'result' => 'required|in:accepted,rejected,pending',
        'comment' => 'nullable|string'
    ]);

    $interview = Interview::findOrFail($id);

    $interview->update([
        'result' => $request->result,
        'comment' => $request->comment,
        'status' => 'done'
    ]);

    // 🔥 Synchroniser statut candidature
    $statusMap = [
        'accepted' => 'acceptee',
        'rejected' => 'refusee',
        'pending' => 'entretien'
    ];

    $interview->application->update([
        'status' => $statusMap[$request->result]
    ]);

    return response()->json(['message' => 'Résultat enregistré']);
}

public function history($applicationId)
{
    $interviews = Interview::where('application_id', $applicationId)
        ->orderBy('date', 'desc')
        ->get();

    return response()->json($interviews);
}

public function candidateInterviews($applicationId)
{
    $user = auth()->user();

    // Vérifie que l'application appartient au candidat
    $application = Application::where('id', $applicationId)
        ->where('student_id', $user->id)
        ->firstOrFail();

    // Récupère tous les entretiens
    $interviews = $application->interviews()->orderBy('date', 'desc')->get();

    return response()->json($interviews);
}

}
