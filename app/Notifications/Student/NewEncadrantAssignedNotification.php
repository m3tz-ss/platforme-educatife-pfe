<?php

namespace App\Notifications\Student;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewEncadrantAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Application $application,
    ) {
        $this->application->loadMissing([
            'encadrant:id,name',
            'offer:id,title',
        ]);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $encadrant = $this->application->encadrant;
        $offer     = $this->application->offer;

        return [
            'type'           => 'new_encadrant_assigned',
            'application_id' => $this->application->id,
            'offer_id'       => $offer?->id,
            'offer_title'    => $offer?->title,
            'encadrant_id'   => $encadrant?->id,
            'encadrant_name' => $encadrant?->name,
            'icon'           => '👨‍🏫',
            'message'        => sprintf(
                '👨‍🏫 Un encadrant (%s) vous a été affecté pour votre stage "%s"',
                $encadrant?->name ?? 'Un tuteur',
                $offer?->title ?? 'votre stage'
            ),
        ];
    }
}
