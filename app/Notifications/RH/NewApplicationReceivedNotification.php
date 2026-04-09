<?php

namespace App\Notifications\RH;

use App\Models\Application;
use Illuminate\Notifications\Notification;

class NewApplicationReceivedNotification extends Notification
{
    public function __construct(
        public Application $application,
    ) {
        $this->application->loadMissing([
            'student:id,name,email',
            'offer:id,title',
        ]);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $student = $this->application->student;
        $offer   = $this->application->offer;

        return [
            'type'           => 'new_application',
            'application_id' => $this->application->id,
            'offer_id'       => $offer?->id,
            'offer_title'    => $offer?->title,
            'student_id'     => $student?->id,
            'student_name'   => $student?->name,
            'student_email'  => $student?->email,
            'message'        => sprintf(
                '%s a postulé à l\'offre "%s"',
                $student?->name ?? 'Un étudiant',
                $offer?->title ?? 'votre offre'
            ),
        ];
    }
}
