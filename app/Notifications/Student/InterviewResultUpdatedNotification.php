<?php

namespace App\Notifications\Student;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Interview;

class InterviewResultUpdatedNotification extends Notification
{
    use Queueable;

    protected $interview;

    public function __construct(Interview $interview)
    {
        $this->interview = $interview;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        $status = $this->interview->result === 'accepted' ? 'accepté' : ($this->interview->result === 'rejected' ? 'refusé' : 'en attente');
        
        return (new MailMessage)
                    ->subject('Résultat de votre entretien - MyStage')
                    ->greeting('Bonjour ' . $notifiable->name . ',')
                    ->line('Le résultat de votre entretien pour l\'offre "' . $this->interview->application->offer->title . '" a été mis à jour.')
                    ->line('Nouveau statut : ' . strtoupper($status))
                    ->line('Commentaire : ' . ($this->interview->comment ?? 'Aucun commentaire'))
                    ->action('Voir ma candidature', url('/student/applications/' . $this->interview->application_id))
                    ->line('Merci de votre confiance.');
    }

    public function toArray($notifiable)
    {
        return [
            'interview_id' => $this->interview->id,
            'result' => $this->interview->result,
            'offer_title' => $this->interview->application->offer->title,
            'message' => 'Résultat d\'entretien mis à jour : ' . $this->interview->result,
            'type' => 'interview_result'
        ];
    }
}
