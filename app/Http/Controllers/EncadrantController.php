<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\User;
use App\Notifications\Encadrant\NewSupervisedStudentNotification;
use App\Notifications\Student\NewEncadrantAssignedNotification;
use App\Mail\EncadrantAssignedToStudentMail;
use App\Mail\EncadrantAssignedToEncadrantMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

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
        $application->save();

        $freshApp  = $application->fresh(['student', 'offer', 'encadrant']);
        $encadrant = User::findOrFail($request->encadrant_id);
        $student   = User::find($application->student_id);
        $offerTitle = $freshApp->offer?->title ?? 'Stage';

        // 1. Notification DB → Encadrant
        $encadrant->notify(new NewSupervisedStudentNotification($freshApp));

        // 2. Notification DB → Étudiant
        if ($student) {
            $student->notify(new NewEncadrantAssignedNotification($freshApp));
        }

        // 3. ✉️ Email réel → Étudiant
        if ($student?->email) {
            Mail::to($student->email)
                ->send(new EncadrantAssignedToStudentMail($student, $encadrant, $offerTitle));
        }

        // 4. ✉️ Email réel → Encadrant
        if ($encadrant->email) {
            Mail::to($encadrant->email)
                ->send(new EncadrantAssignedToEncadrantMail($encadrant, $student ?? $encadrant, $offerTitle));
        }

        return response()->json([
            'message'     => 'Encadrant affecté avec succès',
            'application' => $freshApp,
        ]);
    }

    // Supprimer l'affectation d'un encadrant
    public function unassign($id)
    {
        $application = Application::findOrFail($id);

        $application->encadrant_id = null;
        $application->save();

        return response()->json([
            'message'     => 'Affectation supprimée avec succès',
            'application' => $application->fresh(['student', 'offer', 'encadrant']),
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