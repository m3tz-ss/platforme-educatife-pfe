<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\Request;

class StudentSupervisionController extends Controller
{
    /**
     * Données d’encadrement liées à la candidature (étudiant = propriétaire).
     * Jointure logique : applications.student_id + applications.encadrant_id + encadrant_tasks.application_id
     */
    public function show(Request $request, int $applicationId)
    {
        $user = $request->user();
        $isStudent = ($user->type ?? '') === 'student' || ($user->role ?? '') === 'student';
        if (!$isStudent) {
            abort(403, 'Réservé aux étudiants');
        }

        $application = Application::query()
            ->where('id', $applicationId)
            ->where('student_id', $user->id)
            ->with([
                'encadrant:id,name,email',
                'encadrantTasks' => function ($q): void {
                    $q->orderBy('sort_order')->orderByDesc('id')
                        ->with(['taskComments' => function ($q2): void {
                            $q2->orderByDesc('created_at')->with('user:id,name');
                        }]);
                },
                'encadrantComments.encadrant:id,name',
                'encadrantEvaluation',
            ])
            ->firstOrFail();

        return response()->json([
            'application_id' => $application->id,
            'encadrant'      => $application->encadrant,
            'tasks'          => $application->encadrantTasks,
            'comments'       => $application->encadrantComments,
            'evaluation'     => $application->encadrantEvaluation,
        ]);
    }
}
