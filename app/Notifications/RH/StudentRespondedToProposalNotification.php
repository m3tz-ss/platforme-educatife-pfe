<?php

namespace App\Notifications\RH;

use App\Models\User;
use App\Models\Offer;
use Illuminate\Notifications\Notification;

class StudentRespondedToProposalNotification extends Notification
{
    public function __construct(
        public User   $student,
        public Offer  $offer,
        public string $response  // 'accepted' | 'refused'
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $isAccepted = $this->response === 'accepted';
        return [
            'type'         => 'student_responded_to_proposal',
            'offer_id'     => $this->offer->id,
            'offer_title'  => $this->offer->title,
            'student_id'   => $this->student->id,
            'student_name' => $this->student->name,
            'response'     => $this->response,
            'icon'         => $isAccepted ? '✅' : '❌',
            'message'      => sprintf(
                '%s %s a %s votre proposition pour l\'offre "%s".',
                $isAccepted ? '✅' : '❌',
                $this->student->name,
                $isAccepted ? 'accepté' : 'refusé',
                $this->offer->title
            ),
        ];
    }
}
