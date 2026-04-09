<?php

namespace App\Notifications\Student;

use App\Models\Application;
use Illuminate\Notifications\Notification;

class ApplicationStatusChangedNotification extends Notification
{
    private static array $STATUS_LABELS = [
        'nouveau'         => 'En attente de traitement',
        'preselectionnee' => 'Présélectionnée ✨',
        'entretien'       => 'Entretien planifié 📞',
        'acceptee'        => 'Candidature acceptée 🎉',
        'refusee'         => 'Candidature refusée',
    ];

    private static array $STATUS_ICONS = [
        'nouveau'         => '⏳',
        'preselectionnee' => '✨',
        'entretien'       => '📞',
        'acceptee'        => '🎉',
        'refusee'         => '❌',
    ];

    public function __construct(
        public Application $application,
        public string $newStatus,
        public string $oldStatus,
    ) {
        $this->application->loadMissing(['offer:id,title']);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $label = self::$STATUS_LABELS[$this->newStatus] ?? $this->newStatus;
        $icon  = self::$STATUS_ICONS[$this->newStatus]  ?? '📬';

        return [
            'type'           => 'application_status_changed',
            'application_id' => $this->application->id,
            'offer_id'       => $this->application->offer?->id,
            'offer_title'    => $this->application->offer?->title,
            'old_status'     => $this->oldStatus,
            'new_status'     => $this->newStatus,
            'status_label'   => $label,
            'icon'           => $icon,
            'message'        => sprintf(
                '%s Votre candidature pour "%s" est maintenant : %s',
                $icon,
                $this->application->offer?->title ?? 'cette offre',
                $label
            ),
        ];
    }
}
