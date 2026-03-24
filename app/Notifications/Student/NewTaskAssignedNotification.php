<?php

namespace App\Notifications\Student;

use App\Models\EncadrantTask;
use Illuminate\Notifications\Notification;

class NewTaskAssignedNotification extends Notification
{
    public function __construct(
        public EncadrantTask $task,
    ) {
        $this->task->loadMissing(['application.offer:id,title']);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $offer = $this->task->application?->offer;

        return [
            'type'           => 'new_task',
            'task_id'        => $this->task->id,
            'application_id' => $this->task->application_id,
            'offer_title'    => $offer?->title,
            'message'        => sprintf(
                'Nouvelle tâche : %s',
                $this->task->title
            ),
        ];
    }
}
