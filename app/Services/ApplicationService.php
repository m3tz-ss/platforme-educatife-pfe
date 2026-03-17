<?php

namespace App\Services;

use App\Repositories\ApplicationRepository;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;

class ApplicationService
{
    public function __construct(
        protected ApplicationRepository $repository
    ) {}

    /**
     * ✅ Étudiant postule — email envoyé à l'entreprise
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
        'cv'    => $cvPath,
        'status'     => 'nouveau'
    ]);

    // ✅ Définir $student AVANT de l'utiliser
    $student = \App\Models\User::findOrFail($studentId);
    $offer   = \App\Models\Offer::with('user')->findOrFail($offerId);

    // ✅ Trouver l'email de l'entreprise
    $enterpriseEmail = $this->getEnterpriseEmail($offer->user);

    // ✅ Envoyer email à l'entreprise
    if ($enterpriseEmail) {
        Mail::send([], [], function ($message) use ($offer, $student, $enterpriseEmail) {
            $message->to($enterpriseEmail)
                    ->subject("📩 Nouvelle candidature : {$offer->title}")
                    ->html("
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto;'>
                            <h2 style='color: #3b82f6;'>Nouvelle candidature reçue</h2>
                            <p><strong>Offre :</strong> {$offer->title}</p>
                            <p><strong>Candidat :</strong> {$student->name}</p>
                            <p><strong>Email candidat :</strong> {$student->email}</p>
                            <hr>
                            <p style='color: #6b7280;'>Connectez-vous sur MyStage pour consulter.</p>
                        </div>
                    ");
        });
    }

    return ['data' => $application, 'code' => 201];
}
    public function updateStatus(int $applicationId, string $status)
    {
        $application = $this->repository->findOrFail($applicationId);
        $updated     = $this->repository->updateStatus($application, $status);

        // ✅ Notifier l'étudiant
        $student = User::find($application->student_id);
        if ($student?->email) {
            $statusLabels = [
                'acceptee'       => '✅ Acceptée',
                'refusee'        => '❌ Refusée',
                'entretien'      => '📞 Entretien planifié',
                'preselectionnee'=> '👀 Présélectionnée',
                'nouveau'        => '⏳ En attente',
            ];
            $label = $statusLabels[$status] ?? $status;
            $offerTitle = $application->offer?->title ?? 'Offre';

            Mail::send([], [], function ($message) use ($student, $label, $offerTitle) {
                $message->to($student->email)
                        ->subject("📬 Mise à jour de votre candidature")
                        ->html("
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto;'>
                                <h2 style='color: #3b82f6;'>Statut de votre candidature</h2>
                                <p><strong>Offre :</strong> {$offerTitle}</p>
                                <p><strong>Nouveau statut :</strong> {$label}</p>
                                <hr>
                                <p style='color: #6b7280;'>Connectez-vous sur MyStage pour plus de détails.</p>
                            </div>
                        ");
            });
        }

        return $updated;
    }

    /**
     * ✅ Trouver le bon email de l'entreprise
     */
    private function getEnterpriseEmail(?User $enterpriseUser): ?string
    {
        if (!$enterpriseUser) return null;

        // Manager → son propre email
        if ($enterpriseUser->role === 'manager') {
            return $enterpriseUser->email;
        }

        // RH/Encadrant → email du manager
        if (in_array($enterpriseUser->role, ['rh', 'encadrant'])) {
            $manager = User::find($enterpriseUser->manager_id);
            return $manager?->email ?? $enterpriseUser->email;
        }

        // Fallback
        return $enterpriseUser->email;
    }

    /**
     * Candidatures d'un étudiant
     */
    public function getStudentApplications(int $studentId, ?int $perPage = null)
    {
        return $this->repository->getByStudent($studentId, $perPage);
    }

    /**
     * Candidatures reçues par une entreprise
     */
    public function getEnterpriseApplications(int $enterpriseId, ?int $perPage = null)
    {
        return $this->repository->getByEnterprise($enterpriseId, $perPage);
    }
}