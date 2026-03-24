<?php

namespace App\Services\Student;

use App\Models\Application;
use App\Models\EncadrantTask;
use App\Models\EncadrantTaskComment;
use App\Models\User;
use App\Notifications\Encadrant\StudentCommentOnTaskNotification;
use App\Notifications\Encadrant\StudentUpdatedTaskStatusNotification;

class StudentTaskService
{
    public function __construct(
        protected StudentAccessService $access,
    ) {}

    public function updateStatus(User $user, int $applicationId, int $taskId, string $status): EncadrantTask
    {
        $this->access->ensureStudent($user);

        $allowed = ['todo', 'in_progress', 'done'];
        if (!in_array($status, $allowed, true)) {
            abort(422, 'Statut de tâche invalide');
        }

        $task = EncadrantTask::query()
            ->where('id', $taskId)
            ->where('application_id', $applicationId)
            ->whereHas('application', function ($q) use ($user): void {
                $q->where('student_id', $user->id);
            })
            ->first();

        if (!$task) {
            abort(404);
        }

        $task->update(['status' => $status]);
        $task = $task->fresh();

        $application = Application::with('encadrant')->find($applicationId);
        if ($application?->encadrant_id) {
            User::find($application->encadrant_id)?->notify(
                new StudentUpdatedTaskStatusNotification($task, $application, $user)
            );
        }

        return $task;
    }

    public function listTaskComments(User $user, int $applicationId, int $taskId, int $perPage = 30)
    {
        $this->access->ensureStudent($user);

        $this->findStudentTaskOrAbort($user, $applicationId, $taskId);

        return EncadrantTaskComment::query()
            ->where('encadrant_task_id', $taskId)
            ->with('user:id,name')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function storeTaskComment(User $user, int $applicationId, int $taskId, string $body): EncadrantTaskComment
    {
        $this->access->ensureStudent($user);

        $task = $this->findStudentTaskOrAbort($user, $applicationId, $taskId);

        $comment = EncadrantTaskComment::create([
            'encadrant_task_id' => $taskId,
            'user_id'           => $user->id,
            'body'              => $body,
        ]);

        $comment->load('user:id,name');

        $application = Application::with('encadrant')->find($applicationId);
        if ($application?->encadrant_id) {
            User::find($application->encadrant_id)?->notify(
                new StudentCommentOnTaskNotification($task->fresh(), $comment, $application)
            );
        }

        return $comment;
    }

    private function findStudentTaskOrAbort(User $user, int $applicationId, int $taskId): EncadrantTask
    {
        $task = EncadrantTask::query()
            ->where('id', $taskId)
            ->where('application_id', $applicationId)
            ->whereHas('application', function ($q) use ($user): void {
                $q->where('student_id', $user->id);
            })
            ->first();

        if (!$task) {
            abort(404);
        }

        return $task;
    }
}
