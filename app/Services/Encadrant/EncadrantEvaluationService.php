<?php

namespace App\Services\Encadrant;

use App\Models\Application;
use App\Notifications\Student\EvaluationPublishedNotification;
use App\Repositories\EncadrantEvaluationRepository;
use App\Repositories\EncadrantSupervisionRepository;
use App\Models\EncadrantEvaluation;

class EncadrantEvaluationService
{
    public function __construct(
        protected EncadrantEvaluationRepository $evaluations,
        protected EncadrantSupervisionRepository $supervision,
    ) {}

    public function show(int $encadrantId, int $applicationId): ?EncadrantEvaluation
    {
        if (!$this->supervision->applicationOwnedByEncadrant($applicationId, $encadrantId)) {
            abort(403, 'Accès refusé');
        }

        return $this->evaluations->findForApplication($applicationId, $encadrantId);
    }

    public function upsert(int $encadrantId, int $applicationId, array $data): EncadrantEvaluation
    {
        if (!$this->supervision->applicationOwnedByEncadrant($applicationId, $encadrantId)) {
            abort(403, 'Accès refusé');
        }

        $evaluation = $this->evaluations->updateOrCreate(
            [
                'application_id' => $applicationId,
                'encadrant_id'   => $encadrantId,
            ],
            [
                'score'          => $data['score'] ?? null,
                'final_decision' => $data['final_decision'],
                'notes'          => $data['notes'] ?? null,
            ]
        );

        $application = Application::with('student')->find($applicationId);
        $application?->student?->notify(new EvaluationPublishedNotification($evaluation, $application));

        return $evaluation;
    }
}
