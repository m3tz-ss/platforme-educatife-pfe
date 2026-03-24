<?php

namespace App\Notifications\Encadrant;

use App\Models\Application;
use Illuminate\Notifications\Notification;

class NewSupervisedStudentNotification extends Notification
{
    public function __construct(
        public Application $application,
    ) {
        $this->application->loadMissing(['student:id,name,email', 'offer:id,title']);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'           => 'new_supervised_student',
            'application_id' => $this->application->id,
            'student_name'   => $this->application->student?->name,
            'offer_title'    => $this->application->offer?->title,
            'message'        => sprintf(
                'Nouveau stagiaire à encadrer : %s (%s)',
                $this->application->student?->name ?? 'Étudiant',
                $this->application->offer?->title ?? 'Offre'
            ),
        ];
    }
}
