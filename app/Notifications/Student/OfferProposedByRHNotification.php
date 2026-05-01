<?php

namespace App\Notifications\Student;

use App\Models\Offer;
use App\Models\User;
use Illuminate\Notifications\Notification;

class OfferProposedByRHNotification extends Notification
{
    public function __construct(
        public Offer  $offer,
        public User   $rh,
        public int    $proposalId,
        public string $personalMessage = ''
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'             => 'offer_proposed_by_rh',
            'proposal_id'      => $this->proposalId,
            'offer_id'         => $this->offer->id,
            'offer_title'      => $this->offer->title,
            'rh_id'            => $this->rh->id,
            'rh_name'          => $this->rh->name,
            'personal_message' => $this->personalMessage,
            'icon'             => '🎯',
            'requires_action'  => true,
            'message'          => sprintf(
                '🎯 %s vous propose l\'offre "%s". Cliquez pour accepter ou refuser.',
                $this->rh->name,
                $this->offer->title
            ),
        ];
    }
}
