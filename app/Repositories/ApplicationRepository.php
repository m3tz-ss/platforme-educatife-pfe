<?php

namespace App\Repositories;

use App\Models\Application;
use App\Models\User;

class ApplicationRepository
{
    public function existsForStudent(int $studentId, int $offerId): bool
    {
        return Application::where('student_id', $studentId)
            ->where('offer_id', $offerId)
            ->exists();
    }

    public function create(array $data): Application
    {
        return Application::create($data);
    }

    public function getByStudent(int $studentId)
    {
        return Application::with(['offer.user'])
            ->where('student_id', $studentId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getByEnterprise(int $userId)
    {
        $user = User::find($userId);

        $query = Application::with(['student', 'offer', 'encadrant']);

        if ($user?->role === 'manager') {
            $query->whereHas('offer', function ($q) use ($userId) {
                $q->where('enterprise_id', $userId)
                  ->orWhereIn('enterprise_id', function ($q2) use ($userId) {
                      $q2->select('id')
                         ->from('users')
                         ->where('manager_id', $userId);
                  });
            });
        } else {
            $query->whereHas('offer', function ($q) use ($userId) {
                $q->where('enterprise_id', $userId);
            });
        }

        return $query->orderBy('created_at', 'desc')
                     ->get()
                     ->map(fn($app) => [
                         'id'         => $app->id,
                         'status'     => $app->status,
                         'cv'         => $app->cv,
                         'cv_path'    => $app->cv, // ✅ alias
                         'created_at' => $app->created_at,
                         'offer_id'   => $app->offer_id,
                         'student'    => $app->student,
                         'encadrant'  => $app->encadrant,
                         'offer'      => $app->offer ? [
                             'id'               => $app->offer->id,
                             'title'            => $app->offer->title,
                             'domain'           => $app->offer->domain,
                             'location'         => $app->offer->location,
                             'duration'         => $app->offer->duration,
                             'start_date'       => $app->offer->start_date,
                             'available_places' => $app->offer->available_places,
                         ] : null,
                     ]);
    }

    // ✅ Méthode manquante ajoutée
    public function findOrFail(int $id): Application
    {
        return Application::with(['offer', 'student'])->findOrFail($id);
    }

    public function updateStatus(Application $application, string $status): Application
    {
        $application->status = $status;
        $application->save();
        return $application->fresh(['offer', 'student']);
    }
}