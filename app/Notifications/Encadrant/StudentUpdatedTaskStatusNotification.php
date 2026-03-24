<?php

namespace App\Notifications\Encadrant;

use App\Models\Application;
use App\Models\EncadrantTask;
use App\Models\User;
use Illuminate\Notifications\Notification;

class StudentUpdatedTaskStatusNotification extends Notification
{
    public function __construct(
        public EncadrantTask $task,
        public Application $application,
        public User $student,
    ) {
        $this->task->loadMissing(['application']);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'           => 'student_task_status',
            'task_id'        => $this->task->id,
            'application_id' => $this->application->id,
            'status'         => $this->task->status,
            'student_name'   => $this->student->name,
            'message'        => sprintf(
                '%s a mis à jour la tâche « %s » (%s).',
                $this->student->name,
                $this->task->title,
                $this->task->status
            ),
        ];
    }
}
