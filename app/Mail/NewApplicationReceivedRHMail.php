<?php

namespace App\Mail;

use App\Models\Offer;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

use Illuminate\Contracts\Queue\ShouldQueue;

class NewApplicationReceivedRHMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User  $rh,
        public User  $student,
        public Offer $offer
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '📩 Nouvelle candidature reçue — ' . $this->offer->title,
        );
    }

    public function content(): Content
    {
        $rhName       = $this->rh->name;
        $studentName  = $this->student->name;
        $studentEmail = $this->student->email;
        $offerTitle   = $this->offer->title;
        $offerDomain  = $this->offer->domain;

        return new Content(
            htmlString: "
                <div style='font-family: Arial, sans-serif; max-width: 620px; margin: auto; background:#f9fafb; padding:0; border-radius:12px; overflow:hidden;'>
                    <div style='background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 32px; text-align:center;'>
                        <h1 style='color:#fff; margin:0; font-size:24px;'>📩 Nouvelle candidature</h1>
                        <p style='color:rgba(255,255,255,0.85); margin:8px 0 0;'>my_stage — Plateforme de gestion des stages</p>
                    </div>
                    <div style='padding: 32px; background:#fff;'>
                        <p style='font-size:16px; color:#374151;'>Bonjour <strong>{$rhName}</strong>,</p>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Un étudiant vient de postuler à l'une de vos offres de stage.
                        </p>
                        <div style='background:#eff6ff; border-left:4px solid #3b82f6; border-radius:8px; padding:20px; margin:24px 0;'>
                            <p style='margin:0 0 8px; color:#374151;'><strong>📋 Offre :</strong> {$offerTitle}</p>
                            <p style='margin:0 0 8px; color:#374151;'><strong>🏷️ Domaine :</strong> {$offerDomain}</p>
                            <hr style='border:none; border-top:1px solid #dbeafe; margin:12px 0;'>
                            <p style='margin:0 0 8px; color:#374151;'><strong>👤 Candidat :</strong> {$studentName}</p>
                            <p style='margin:0; color:#374151;'><strong>📧 Email :</strong> {$studentEmail}</p>
                        </div>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Connectez-vous sur <strong>my_stage</strong> pour consulter le CV du candidat et mettre à jour le statut de sa candidature.
                        </p>
                        <div style='text-align:center; margin:32px 0;'>
                            <a href='http://localhost:5173' style='background: linear-gradient(135deg, #3b82f6, #6366f1); color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:bold; display:inline-block;'>
                                Consulter la candidature
                            </a>
                        </div>
                    </div>
                    <div style='padding:16px 32px; background:#f9fafb; text-align:center; color:#9ca3af; font-size:12px;'>
                        © 2025 my_stage · tarresmoataz840@gmail.com
                    </div>
                </div>
            "
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
