<?php

namespace App\Notifications\Student;

use App\Models\Application;
use App\Models\EncadrantEvaluation;
use Illuminate\Notifications\Notification;

class EvaluationPublishedNotification extends Notification
{
    public function __construct(
        public EncadrantEvaluation $evaluation,
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
            'type'            => 'evaluation_published',
            'application_id'  => $this->application->id,
            'offer_title'     => $this->application->offer?->title,
            'score'           => $this->evaluation->score,
            'final_decision'  => $this->evaluation->final_decision,
            'message'         => sprintf(
                'Votre évaluation de stage est disponible (%s).',
                $this->application->offer?->title ?? 'candidature'
            ),
        ];
    }
}
