<?php

namespace App\Repositories;

use App\Models\Application;

class EncadrantSupervisionRepository
{
    public function applicationOwnedByEncadrant(int $applicationId, int $encadrantId): ?Application
    {
        return Application::query()
            ->where('id', $applicationId)
            ->where('encadrant_id', $encadrantId)
            ->first();
    }

    public function paginateApplicationsForEncadrant(int $encadrantId, int $perPage = 12)
    {
        return Application::query()
            ->with([
                'student:id,name,email,school,field,cv_path',
                'offer:id,title,domain,location,enterprise_id',
                'offer.user:id,company_name,name',
                'encadrantEvaluation:id,application_id,score,final_decision',
            ])
            ->withCount(['encadrantTasks', 'encadrantComments'])
            ->where('encadrant_id', $encadrantId)
            ->orderByDesc('updated_at')
            ->paginate($perPage);
    }

    public function getApplicationDetail(int $applicationId, int $encadrantId): ?Application
    {
        return Application::query()
            ->with([
                'student:id,name,email,phone,school,field,graduation_year,cv_path',
                'offer:id,title,domain,location,duration,start_date,description,enterprise_id',
                'offer.user:id,company_name,name,email',
                'encadrantEvaluation',
                'interviews' => function ($q): void {
                    $q->orderByDesc('date')->orderByDesc('id');
                },
            ])
            ->withCount(['encadrantTasks', 'encadrantComments'])
            ->where('id', $applicationId)
            ->where('encadrant_id', $encadrantId)
            ->first();
    }
}
