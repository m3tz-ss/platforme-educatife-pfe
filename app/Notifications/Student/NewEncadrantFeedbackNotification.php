<?php

namespace App\Notifications\Student;

use App\Models\Application;
use App\Models\EncadrantComment;
use Illuminate\Notifications\Notification;

class NewEncadrantFeedbackNotification extends Notification
{
    public function __construct(
        public EncadrantComment $comment,
        public Application $application,
    ) {
        $this->application->loadMissing(['offer:id,title']);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'           => 'encadrant_feedback',
            'application_id' => $this->application->id,
            'comment_id'     => $this->comment->id,
            'offer_title'    => $this->application->offer?->title,
            'message'        => sprintf(
                'Nouveau commentaire de votre encadrant concernant %s.',
                $this->application->offer?->title ?? 'votre candidature'
            ),
        ];
    }
}
