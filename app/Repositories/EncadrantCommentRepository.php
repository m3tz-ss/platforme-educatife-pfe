<?php

namespace App\Repositories;

use App\Models\EncadrantComment;

class EncadrantCommentRepository
{
    public function paginateForApplication(int $applicationId, int $encadrantId, int $perPage = 20)
    {
        return EncadrantComment::query()
            ->with('encadrant:id,name,email')
            ->where('application_id', $applicationId)
            ->where('encadrant_id', $encadrantId)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function create(array $data): EncadrantComment
    {
        return EncadrantComment::create($data);
    }

    public function findForEncadrant(int $id, int $encadrantId): ?EncadrantComment
    {
        return EncadrantComment::where('id', $id)->where('encadrant_id', $encadrantId)->first();
    }

    public function delete(EncadrantComment $comment): bool
    {
        return $comment->delete();
    }
}
