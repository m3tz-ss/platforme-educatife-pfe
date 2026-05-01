<?php

namespace App\Mail;

use App\Models\Offer;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OfferProposedToStudentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User  $student,
        public Offer $offer,
        public User  $rh,
        public string $message = ''
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎯 Une offre de stage vous a été proposée — my_stage',
        );
    }

    public function content(): Content
    {
        $studentName  = $this->student->name;
        $offerTitle   = $this->offer->title;
        $offerDomain  = $this->offer->domain;
        $offerLocation= $this->offer->location;
        $offerDuration= $this->offer->duration;
        $rhName       = $this->rh->name;
        $personalMsg  = $this->message
            ? "<div style='background:#f0fdf4;border-left:4px solid #10b981;border-radius:8px;padding:16px;margin:16px 0;'><p style='margin:0;color:#374151;font-style:italic;'>\"" . htmlspecialchars($this->message) . "\"</p><p style='margin:8px 0 0;color:#6b7280;font-size:12px;'>— {$rhName}</p></div>"
            : '';

        return new Content(
            htmlString: "
                <div style='font-family: Arial, sans-serif; max-width: 620px; margin: auto; background:#f9fafb; padding:0; border-radius:12px; overflow:hidden;'>
                    <div style='background: linear-gradient(135deg, #7c3aed, #6366f1); padding: 32px; text-align:center;'>
                        <h1 style='color:#fff; margin:0; font-size:24px;'>🎯 Offre proposée par un recruteur</h1>
                        <p style='color:rgba(255,255,255,0.85); margin:8px 0 0;'>my_stage — Plateforme de gestion des stages</p>
                    </div>
                    <div style='padding: 32px; background:#fff;'>
                        <p style='font-size:16px; color:#374151;'>Bonjour <strong>{$studentName}</strong>,</p>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Le recruteur <strong>{$rhName}</strong> a analysé votre profil et souhaite vous proposer une offre de stage qui correspond à vos compétences.
                        </p>
                        {$personalMsg}
                        <div style='background:#faf5ff; border-left:4px solid #7c3aed; border-radius:8px; padding:20px; margin:24px 0;'>
                            <h2 style='margin:0 0 12px; color:#1f2937; font-size:18px;'>🎓 {$offerTitle}</h2>
                            <p style='margin:0 0 6px; color:#374151;'>🏷️ <strong>Domaine :</strong> {$offerDomain}</p>
                            <p style='margin:0 0 6px; color:#374151;'>📍 <strong>Lieu :</strong> {$offerLocation}</p>
                            <p style='margin:0; color:#374151;'>⏱️ <strong>Durée :</strong> {$offerDuration}</p>
                        </div>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Connectez-vous sur <strong>my_stage</strong> pour consulter les détails de cette offre et y répondre (accepter ou refuser).
                        </p>
                        <div style='text-align:center; margin:32px 0;'>
                            <a href='http://localhost:5173' style='background: linear-gradient(135deg,#7c3aed,#6366f1); color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:bold; display:inline-block;'>
                                Voir la proposition et répondre
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

    public function attachments(): array { return []; }
}
