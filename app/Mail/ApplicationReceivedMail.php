<?php

namespace App\Mail;

use App\Models\Offer;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Address;

class ApplicationReceivedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Offer $offer,
        public User $student,
        public string $enterpriseEmail
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            to: [$this->enterpriseEmail],
            subject: '📩 Nouvelle candidature : ' . $this->offer->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto;'>
                    <h2 style='color: #3b82f6;'>Nouvelle candidature reçue</h2>
                    <p><strong>Offre :</strong> {$this->offer->title}</p>
                    <p><strong>Candidat :</strong> {$this->student->name}</p>
                    <p><strong>Email candidat :</strong> {$this->student->email}</p>
                    <hr>
                    <p style='color: #6b7280;'>Connectez-vous sur MyStage pour consulter.</p>
                </div>
            "
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
