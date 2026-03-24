<?php

namespace App\Services\Encadrant;

use App\Repositories\EncadrantSupervisionRepository;
use App\Models\User;
use App\Models\Application;

class EncadrantSupervisionService
{
    public function __construct(
        protected EncadrantSupervisionRepository $repository,
    ) {}

    public function ensureEncadrant(User $user): void
    {
        if ($user->role !== 'encadrant') {
            abort(403, 'Rôle encadrant requis');
        }
    }

    public function dashboard(int $encadrantId, int $perPage = 12)
    {
        return $this->repository->paginateApplicationsForEncadrant($encadrantId, $perPage);
    }

    public function applicationDetail(int $encadrantId, int $applicationId): Application
    {
        $app = $this->repository->getApplicationDetail($applicationId, $encadrantId);
        if (!$app) {
            abort(404);
        }

        return $app;
    }

    public function canAccessApplication(int $encadrantId, int $applicationId): bool
    {
        return $this->repository->applicationOwnedByEncadrant($applicationId, $encadrantId) !== null;
    }

    public function updateApplicationStatus(int $encadrantId, int $applicationId, string $status): Application
    {
        $app = $this->repository->applicationOwnedByEncadrant($applicationId, $encadrantId);
        if (!$app) {
            abort(404);
        }

        $allowed = ['nouveau', 'preselectionnee', 'entretien', 'acceptee', 'refusee'];
        if (!in_array($status, $allowed, true)) {
            abort(422, 'Statut invalide');
        }

        $app->update(['status' => $status]);

        return $app->fresh(['student', 'offer']);
    }
}
