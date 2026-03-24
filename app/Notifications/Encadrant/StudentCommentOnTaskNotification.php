<?php

namespace App\Notifications\Encadrant;

use App\Models\Application;
use App\Models\EncadrantTask;
use App\Models\EncadrantTaskComment;
use Illuminate\Notifications\Notification;

class StudentCommentOnTaskNotification extends Notification
{
    public function __construct(
        public EncadrantTask $task,
        public EncadrantTaskComment $comment,
        public Application $application,
    ) {
        $this->task->loadMissing(['application']);
        $this->comment->loadMissing('user:id,name');
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'           => 'student_task_comment',
            'task_id'        => $this->task->id,
            'application_id' => $this->application->id,
            'student_name'   => $this->comment->user?->name,
            'message'        => sprintf(
                '%s a commenté la tâche « %s ».',
                $this->comment->user?->name ?? 'L’étudiant',
                $this->task->title
            ),
        ];
    }
}
