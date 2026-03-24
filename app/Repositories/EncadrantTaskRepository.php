<?php

namespace App\Repositories;

use App\Models\EncadrantTask;

class EncadrantTaskRepository
{
    public function paginateForApplication(int $applicationId, int $encadrantId, int $perPage = 15)
    {
        return EncadrantTask::query()
            ->where('application_id', $applicationId)
            ->where('encadrant_id', $encadrantId)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function findForEncadrant(int $id, int $encadrantId): ?EncadrantTask
    {
        return EncadrantTask::where('id', $id)->where('encadrant_id', $encadrantId)->first();
    }

    public function create(array $data): EncadrantTask
    {
        return EncadrantTask::create($data);
    }

    public function update(EncadrantTask $task, array $data): bool
    {
        return $task->update($data);
    }

    public function delete(EncadrantTask $task): bool
    {
        return $task->delete();
    }
}
