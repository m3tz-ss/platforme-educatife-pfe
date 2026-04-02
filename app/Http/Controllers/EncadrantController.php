<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\User;
use App\Notifications\Encadrant\NewSupervisedStudentNotification;
use Illuminate\Http\Request;

class EncadrantController extends Controller
{
    // Affecter un encadrant à une application
    public function assign(Request $request, $id)
    {
        $application = Application::findOrFail($id);

        // Validation
        $request->validate([
            'encadrant_id' => 'required|exists:users,id'
        ]);

        // Assignation
        $application->encadrant_id = $request->encadrant_id;
        $application->save(); // ✅ Important !

        // Notification
        $encadrant = User::findOrFail($request->encadrant_id);
        $encadrant->notify(new NewSupervisedStudentNotification(
            $application->fresh(['student', 'offer', 'encadrant'])
        ));

        return response()->json([
            'message' => 'Encadrant affecté avec succès',
            'application' => $application->fresh(['student', 'offer', 'encadrant']) // renvoie l'objet complet
        ]);
    }

    // Lister les étudiants supervisés par l'encadrant connecté
    public function students(Request $request)
    {
        $encadrantId = $request->user()->id;

        $applications = Application::with(['student', 'offer', 'encadrant'])
            ->where('encadrant_id', $encadrantId)
            ->get();

        return response()->json($applications);
    }
}