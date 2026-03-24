<?php

namespace App\Services\Encadrant;

use App\Models\Application;
use App\Notifications\Student\NewEncadrantFeedbackNotification;
use App\Repositories\EncadrantCommentRepository;
use App\Repositories\EncadrantSupervisionRepository;
use App\Models\EncadrantComment;

class EncadrantCommentService
{
    public function __construct(
        protected EncadrantCommentRepository $comments,
        protected EncadrantSupervisionRepository $supervision,
    ) {}

    public function list(int $encadrantId, int $applicationId, int $perPage = 20)
    {
        if (!$this->supervision->applicationOwnedByEncadrant($applicationId, $encadrantId)) {
            abort(403, 'Accès refusé');
        }

        return $this->comments->paginateForApplication($applicationId, $encadrantId, $perPage);
    }

    public function store(int $encadrantId, int $applicationId, string $body): EncadrantComment
    {
        if (!$this->supervision->applicationOwnedByEncadrant($applicationId, $encadrantId)) {
            abort(403, 'Accès refusé');
        }

        $comment = $this->comments->create([
            'application_id' => $applicationId,
            'encadrant_id'   => $encadrantId,
            'body'           => $body,
        ]);

        $application = Application::with('student')->find($applicationId);
        $application?->student?->notify(new NewEncadrantFeedbackNotification($comment, $application));

        return $comment;
    }

    public function destroy(int $encadrantId, int $commentId): void
    {
        $comment = $this->comments->findForEncadrant($commentId, $encadrantId);
        if (!$comment) {
            abort(404);
        }
        $this->comments->delete($comment);
    }
}
