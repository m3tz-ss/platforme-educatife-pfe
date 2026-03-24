<?php

namespace App\Repositories;

use App\Models\EncadrantEvaluation;

class EncadrantEvaluationRepository
{
    public function findForApplication(int $applicationId, int $encadrantId): ?EncadrantEvaluation
    {
        return EncadrantEvaluation::where('application_id', $applicationId)
            ->where('encadrant_id', $encadrantId)
            ->first();
    }

    public function updateOrCreate(array $keys, array $data): EncadrantEvaluation
    {
        return EncadrantEvaluation::updateOrCreate($keys, $data);
    }
}
