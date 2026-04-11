<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\EncadrantTask;
use App\Models\Application;
use Illuminate\Http\Request;

class StudentTaskCreateController extends Controller
{
    /**
     * Créer une tâche (étudiant propose une tâche)
     * POST /api/student/applications/{applicationId}/tasks
     */
    public function store(Request $request, int $applicationId)
    {
        $user = $request->user();

        // Vérifier que c'est l'étudiant propriétaire de la candidature
        $application = Application::where('id', $applicationId)
            ->where('student_id', $user->id)
            ->firstOrFail();

        // Vérifier que l'étudiant a un encadrant assigné
        if (!$application->encadrant_id) {
            return response()->json([
                'message' => 'Vous devez avoir un encadrant assigné'
            ], 403);
        }

        // Valider les données
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date'    => 'nullable|date|after:today',
            'attachments' => 'nullable|array|max:1',
            'attachments.*' => 'file|max:10240',
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachments') && count($request->file('attachments')) > 0) {
            $attachmentPath = $request->file('attachments')[0]->store('tasks', 'public');
        }

        // Créer la tâche
        $task = EncadrantTask::create([
            'application_id' => $applicationId,
            'encadrant_id'   => $application->encadrant_id,
            'title'          => $data['title'],
            'description'    => $data['description'] ?? null,
            'status'         => 'todo',  // Les tâches de l'étudiant commencent en "todo"
            'due_date'       => $data['due_date'] ?? null,
            'attachment'     => $attachmentPath,
            'sort_order'     => 0,
        ]);

        return response()->json($task, 201);
    }
}