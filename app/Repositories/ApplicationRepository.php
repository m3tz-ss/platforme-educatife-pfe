<?php

namespace App\Repositories;

use App\Models\Application;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

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

    public function getByStudent(int $studentId, ?int $perPage = null)
    {
        $query = Application::with(['offer.user.manager', 'encadrant:id,name,email'])
            ->where('student_id', $studentId)
            ->orderBy('created_at', 'desc');

        $results = $perPage && $perPage > 0
            ? $query->paginate($perPage)
            : $query->get();

        $transform = fn($app) => [
            'id' => $app->id,
            'status' => $app->status,
            'cv' => $app->cv,
            'cv_path' => $app->cv,
            'created_at' => $app->created_at,
            'offer_id' => $app->offer_id,
            'encadrant' => $app->encadrant,
            'offer' => $app->offer ? \App\Http\Resources\OfferResource::make($app->offer)->resolve() : null,
        ];

        if ($results instanceof \Illuminate\Contracts\Pagination\Paginator) {
            $results->getCollection()->transform($transform);
            return $results;
        }

        return $results->map($transform);
    }

    public function getByEnterprise(int $userId, ?int $perPage = null)
    {
        $user = User::find($userId);

        // Eager load only needed columns based on the transformer
        $query = Application::with([
            'student:id,name,email,phone,photo_path', // ✅ photo_path pour générer la photo_url
            'offer:id,title,domain,location,duration,start_date,available_places,enterprise_id',
            'encadrant:id,name,email'
        ]);

        if ($user?->role === 'manager') {
            // Flat IDs fetching is 100x faster than PostgreSQL orWhereIn subquery
            $managedIds = User::where('manager_id', $userId)->pluck('id')->toArray();
            $managedIds[] = $userId;
            
            $query->whereHas('offer', function ($q) use ($managedIds) {
                $q->whereIn('enterprise_id', $managedIds);
            });
        } else {
            $query->whereHas('offer', function ($q) use ($userId) {
                $q->where('enterprise_id', $userId);
            });
        }

        $query = $query->orderBy('created_at', 'desc');

        $results = ($perPage && $perPage > 0)
            ? $query->paginate($perPage)
            : $query->get();

        $transform = fn($app) => [
                         'id'         => $app->id,
                         'status'     => $app->status,
                         'cv'         => $app->cv,
                         'cv_path'    => $app->cv, // ✅ alias
                         'created_at' => $app->created_at,
                         'offer_id'   => $app->offer_id,
                         'student'    => $app->student ? array_merge($app->student->only(['id','name','email','phone']), [
                             // ✅ URL absolue de la photo étudiant
                             'photo_url' => $app->student->photo_path
                                 ? Storage::disk('public')->url($app->student->photo_path)
                                 : null,
                         ]) : null,
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
                     ];

        if ($results instanceof \Illuminate\Contracts\Pagination\Paginator) {
            $results->getCollection()->transform($transform);
            return $results;
        }

        return $results->map($transform);
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