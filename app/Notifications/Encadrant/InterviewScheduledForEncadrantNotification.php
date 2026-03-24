<?php

namespace App\Notifications\Encadrant;

use App\Models\Interview;
use Illuminate\Notifications\Notification;

class InterviewScheduledForEncadrantNotification extends Notification
{
    public function __construct(
        public Interview $interview,
    ) {
        $this->interview->loadMissing(['application.student:id,name']);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $app = $this->interview->application;

        return [
            'type'           => 'interview_scheduled',
            'interview_id'   => $this->interview->id,
            'application_id' => $app?->id,
            'date'           => $this->interview->date,
            'time'           => $this->interview->time,
            'student_name'   => $app?->student?->name,
            'message'        => sprintf(
                'Entretien planifié le %s à %s pour %s',
                $this->interview->date,
                $this->interview->time,
                $app?->student?->name ?? 'un candidat'
            ),
        ];
    }
}
