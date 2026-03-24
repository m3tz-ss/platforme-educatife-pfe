<?php

namespace App\Services\Encadrant;

use App\Models\Application;
use App\Notifications\Student\NewTaskAssignedNotification;
use App\Repositories\EncadrantTaskRepository;
use App\Repositories\EncadrantSupervisionRepository;
use App\Models\EncadrantTask;

class EncadrantTaskService
{
    public function __construct(
        protected EncadrantTaskRepository $tasks,
        protected EncadrantSupervisionRepository $supervision,
    ) {}

    public function list(int $encadrantId, int $applicationId, int $perPage = 15)
    {
        if (!$this->supervision->applicationOwnedByEncadrant($applicationId, $encadrantId)) {
            abort(403, 'Accès refusé');
        }

        return $this->tasks->paginateForApplication($applicationId, $encadrantId, $perPage);
    }

    public function store(int $encadrantId, int $applicationId, array $data): EncadrantTask
    {
        if (!$this->supervision->applicationOwnedByEncadrant($applicationId, $encadrantId)) {
            abort(403, 'Accès refusé');
        }

        $task = $this->tasks->create([
            'application_id' => $applicationId,
            'encadrant_id'   => $encadrantId,
            'title'          => $data['title'],
            'description'    => $data['description'] ?? null,
            'status'         => $data['status'] ?? 'todo',
            'due_date'       => $data['due_date'] ?? null,
            'sort_order'     => $data['sort_order'] ?? 0,
        ]);

        $application = Application::with('student')->find($applicationId);
        $application?->student?->notify(new NewTaskAssignedNotification($task));

        return $task;
    }

    public function update(int $encadrantId, int $taskId, array $data): EncadrantTask
    {
        $task = $this->tasks->findForEncadrant($taskId, $encadrantId);
        if (!$task) {
            abort(404);
        }
        $allowed = ['title', 'description', 'status', 'due_date', 'sort_order'];
        $payload = [];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $data)) {
                $payload[$key] = $data[$key];
            }
        }
        if ($payload !== []) {
            $this->tasks->update($task, $payload);
        }

        return $task->fresh();
    }

    public function destroy(int $encadrantId, int $taskId): void
    {
        $task = $this->tasks->findForEncadrant($taskId, $encadrantId);
        if (!$task) {
            abort(404);
        }
        $this->tasks->delete($task);
    }
}
