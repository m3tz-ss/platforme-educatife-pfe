<?php

namespace App\Notifications\Encadrant;

use App\Models\Application;
use App\Models\EncadrantEvaluation;
use App\Models\User;
use Illuminate\Notifications\Notification;

class EvaluationSubmittedNotification extends Notification
{
    public function __construct(
        public EncadrantEvaluation $evaluation,
        public Application $application,
        public User $encadrant,
    ) {
        $this->application->loadMissing(['offer:id,title', 'student:id,name']);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'            => 'evaluation_submitted',
            'application_id'  => $this->application->id,
            'student_name'    => $this->application->student?->name,
            'offer_title'     => $this->application->offer?->title,
            'encadrant_name'  => $this->encadrant->name,
            'final_decision'  => $this->evaluation->final_decision,
            'message'         => sprintf(
                'L\'encadrant %s a évalué le stagiaire %s (%s).',
                $this->encadrant->name,
                $this->application->student?->name ?? 'inconnu',
                $this->application->offer?->title ?? 'candidature'
            ),
        ];
    }
}
