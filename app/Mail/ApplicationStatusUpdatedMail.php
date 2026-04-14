<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Address;

class ApplicationStatusUpdatedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $student,
        public string $label,
        public string $offerTitle
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            to: [$this->student->email],
            subject: '📬 Mise à jour de votre candidature',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto;'>
                    <h2 style='color: #3b82f6;'>Statut de votre candidature</h2>
                    <p><strong>Offre :</strong> {$this->offerTitle}</p>
                    <p><strong>Nouveau statut :</strong> {$this->label}</p>
                    <hr>
                    <p style='color: #6b7280;'>Connectez-vous sur MyStage pour plus de détails.</p>
                </div>
            "
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
