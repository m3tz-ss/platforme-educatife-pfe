<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\Student\StudentTaskService;
use Illuminate\Http\Request;

class StudentTaskController extends Controller
{
    public function __construct(
        protected StudentTaskService $tasks,
    ) {}

    public function updateStatus(Request $request, int $applicationId, int $taskId)
    {
        $data = $request->validate([
            'status' => 'required|string|in:todo,in_progress,done',
        ]);

        return response()->json(
            $this->tasks->updateStatus($request->user(), $applicationId, $taskId, $data['status'])
        );
    }

    public function comments(Request $request, int $applicationId, int $taskId)
    {
        $perPage = min((int) $request->query('per_page', 30), 50);

        return response()->json(
            $this->tasks->listTaskComments($request->user(), $applicationId, $taskId, $perPage)
        );
    }

    public function storeComment(Request $request, int $applicationId, int $taskId)
    {
        $data = $request->validate([
            'body' => 'nullable|string|max:10000',
            'attachments' => 'nullable|array|max:5',
            'attachments.*' => 'file|max:10240',
        ]);

        $paths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $paths[] = $file->store('task_comments', 'public');
            }
        }

        // Must provide at least body or attachment
        if (empty($data['body']) && empty($paths)) {
            abort(422, 'Le commentaire ne peut pas être vide.');
        }

        return response()->json(
            $this->tasks->storeTaskComment($request->user(), $applicationId, $taskId, $data['body'] ?? null, $paths),
            201
        );
    }

    public function updateComment(Request $request, int $applicationId, int $taskId, int $commentId)
    {
        $data = $request->validate([
            'body' => 'required|string|max:10000',
        ]);

        return response()->json(
            $this->tasks->updateTaskComment($request->user(), $applicationId, $taskId, $commentId, $data['body'])
        );
    }

    public function destroyComment(Request $request, int $applicationId, int $taskId, int $commentId)
    {
        $this->tasks->destroyTaskComment($request->user(), $applicationId, $taskId, $commentId);
        return response()->json(null, 204);
    }
}
