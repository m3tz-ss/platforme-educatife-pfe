<?php

namespace App\Services;

use App\Repositories\ApplicationRepository;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use App\Notifications\RH\NewApplicationReceivedNotification;
use App\Notifications\Student\ApplicationStatusChangedNotification;
use App\Mail\NewApplicationReceivedRHMail;
use App\Mail\ApplicationStatusUpdatedMail;

class ApplicationService
{
    public function __construct(
        protected ApplicationRepository $repository
    ) {}

    /**
     * ✅ Étudiant postule — email + notification DB à l'entreprise
     */
    public function apply(int $studentId, int $offerId, ?UploadedFile $cv)
    {
        // Vérifier double candidature
        if ($this->repository->existsForStudent($studentId, $offerId)) {
            return ['error' => 'Vous avez déjà postulé à cette offre', 'code' => 409];
        }

        // Upload CV
        $cvPath = $cv ? $cv->store('cvs', 'public') : null;

        // Créer la candidature
        $application = $this->repository->create([
            'student_id' => $studentId,
            'offer_id'   => $offerId,
            'cv'         => $cvPath,
            'status'     => 'nouveau'
        ]);

        // Charger relations nécessaires
        $student = User::findOrFail($studentId);
        $offer   = Offer::with('user')->findOrFail($offerId);
        $application->load(['student:id,name,email', 'offer:id,title']);

        // ✅ Notification DB → RH/Manager (Queued bulk via Notification::send)
        $this->notifyEnterpriseUsers($application, $offer);

        // ✅ Invalidate caches
        Cache::forget("applications_student_{$studentId}");
        
        $enterpriseUser = $offer->user;
        if ($enterpriseUser) {
            $managedIds = User::where('manager_id', $enterpriseUser->id)->pluck('id')->toArray();
            $cacheIdsToClear = array_merge([$enterpriseUser->id], $managedIds);
            foreach ($cacheIdsToClear as $cid) {
                Cache::forget("applications_enterprise_{$cid}");
            }
        }

        // ✅ Email réel au(x) RH/Manager concerné(s)
        if ($enterpriseUser) {
            $usersToMail = $this->getEnterpriseUsersList($enterpriseUser);
            foreach ($usersToMail as $rhUser) {
                if ($rhUser->email) {
                    Mail::to($rhUser->email)
                        ->send(new NewApplicationReceivedRHMail($rhUser, $student, $offer));
                }
            }
        }

        return ['data' => $application, 'code' => 201];
    }

    /**
     * ✅ Changer le statut — notification DB + email à l'étudiant
     */
    public function updateStatus(int $applicationId, string $status)
    {
        $application = $this->repository->findOrFail($applicationId);
        $oldStatus   = $application->status;
        $updated     = $this->repository->updateStatus($application, $status);

        // Recharger avec la relation offer
        $fresh = $this->repository->findOrFail($applicationId);
        $fresh->load('offer:id,title');

        // ✅ Notification DB → Étudiant
        $student = User::find($application->student_id);
        if ($student) {
            $student->notify(new ApplicationStatusChangedNotification($fresh, $status, $oldStatus));
        }

        // ✅ Invalidate caches
        Cache::forget("applications_student_{$application->student_id}");
        
        if ($fresh->offer) {
            $enterpriseUser = $fresh->offer->user;
            if ($enterpriseUser) {
                $managedIds = User::where('manager_id', $enterpriseUser->id)->pluck('id')->toArray();
                $cacheIdsToClear = array_merge([$enterpriseUser->id], $managedIds);
                foreach ($cacheIdsToClear as $cid) {
                    Cache::forget("applications_enterprise_{$cid}");
                }
            }
        }

        // ✅ Email réel à l'étudiant
        if ($student?->email) {
            $statusLabels = [
                'acceptee'        => '✅ Acceptée',
                'refusee'         => '❌ Refusée',
                'entretien'       => '📞 Entretien planifié',
                'preselectionnee' => '👀 Présélectionnée',
                'nouveau'         => '⏳ En attente',
            ];
            $label      = $statusLabels[$status] ?? $status;
            $offerTitle = $fresh->offer?->title ?? 'Offre';

            Mail::to($student->email)
                ->send(new ApplicationStatusUpdatedMail($student, $label, $offerTitle, $status));
        }

        return $updated;
    }

    /**
     * ✅ Notifier les utilisateurs RH/Manager liés à l'offre
     */
    private function notifyEnterpriseUsers(\App\Models\Application $application, Offer $offer): void
    {
        $enterpriseUser = $offer->user;
        if (!$enterpriseUser) return;

        $usersToNotify = collect();

        if ($enterpriseUser->role === 'manager') {
            // Manager + ses RH
            $usersToNotify->push($enterpriseUser);
            $rhs = User::where('manager_id', $enterpriseUser->id)
                       ->where('role', 'rh')
                       ->get();
            $usersToNotify = $usersToNotify->merge($rhs);
        } elseif ($enterpriseUser->role === 'rh') {
            // RH + son manager
            $usersToNotify->push($enterpriseUser);
            if ($enterpriseUser->manager_id) {
                $manager = User::find($enterpriseUser->manager_id);
                if ($manager) $usersToNotify->push($manager);
            }
        } else {
            $usersToNotify->push($enterpriseUser);
        }

        // Optimized multiple users notification triggering (bulk queue dispatch)
        Notification::send($usersToNotify->unique('id'), new NewApplicationReceivedNotification($application));
    }

    /**
     * ✅ Retourner la liste des RH/Manager liés à l'offre (pour les emails)
     */
    private function getEnterpriseUsersList(User $enterpriseUser): \Illuminate\Support\Collection
    {
        $users = collect();

        if ($enterpriseUser->role === 'manager') {
            $users->push($enterpriseUser);
            $rhs = User::where('manager_id', $enterpriseUser->id)->where('role', 'rh')->get();
            $users = $users->merge($rhs);
        } elseif ($enterpriseUser->role === 'rh') {
            $users->push($enterpriseUser);
            if ($enterpriseUser->manager_id) {
                $manager = User::find($enterpriseUser->manager_id);
                if ($manager) $users->push($manager);
            }
        } else {
            $users->push($enterpriseUser);
        }

        return $users->unique('id');
    }

    /**
     * ✅ Trouver le bon email de l'entreprise (conservé pour compatibilité)
     */
    private function getEnterpriseEmail(?User $enterpriseUser): ?string
    {
        if (!$enterpriseUser) return null;

        if ($enterpriseUser->role === 'manager') {
            return $enterpriseUser->email;
        }

        if (in_array($enterpriseUser->role, ['rh', 'encadrant'])) {
            $manager = User::find($enterpriseUser->manager_id);
            return $manager?->email ?? $enterpriseUser->email;
        }

        return $enterpriseUser->email;
    }

    /**
     * Candidatures d'un étudiant (Avec Cache)
     */
    public function getStudentApplications(int $studentId, ?int $perPage = null)
    {
        $cacheKey = "applications_student_{$studentId}_page_" . request('page', 1) . "_per_{$perPage}";
        $ttl = 60; // 60 seconds

        return Cache::remember($cacheKey, $ttl, function () use ($studentId, $perPage) {
            return $this->repository->getByStudent($studentId, $perPage);
        });
    }

    /**
     * Candidatures reçues par une entreprise (Avec Cache)
     */
    public function getEnterpriseApplications(int $enterpriseId, ?int $perPage = null)
    {
        $cacheKey = "applications_enterprise_{$enterpriseId}_page_" . request('page', 1) . "_per_{$perPage}";
        $ttl = 60; // 60 seconds

        return Cache::remember($cacheKey, $ttl, function () use ($enterpriseId, $perPage) {
            return $this->repository->getByEnterprise($enterpriseId, $perPage);
        });
    }

    /**
     * ✅ Annuler une candidature (si status == 'nouveau')
     */
    public function cancelApplication(int $studentId, int $applicationId)
    {
        $application = $this->repository->findOrFail($applicationId);

        if ($application->student_id !== $studentId) {
            return ['error' => 'Non autorisé', 'code' => 403];
        }

        if ($application->status !== 'nouveau') {
            return ['error' => 'Impossible d\'annuler une candidature qui n\'est plus en attente', 'code' => 400];
        }

        $application->load('offer.user');

        // Delete application
        $application->delete();

        // Invalidate caches
        Cache::forget("applications_student_{$studentId}");

        if ($application->offer && $application->offer->user) {
            $enterpriseUser = $application->offer->user;
            $managedIds = User::where('manager_id', $enterpriseUser->id)->pluck('id')->toArray();
            $cacheIdsToClear = array_merge([$enterpriseUser->id], $managedIds);
            foreach ($cacheIdsToClear as $cid) {
                Cache::forget("applications_enterprise_{$cid}");
            }
        }

        return ['data' => true, 'code' => 200];
    }
}