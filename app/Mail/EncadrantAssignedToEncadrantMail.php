<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EncadrantAssignedToEncadrantMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $encadrant,
        public User $student,
        public string $offerTitle
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎓 Nouveau stagiaire à encadrer — my_stage',
        );
    }

    public function content(): Content
    {
        $encadrantName = $this->encadrant->name;
        $studentName   = $this->student->name;
        $studentEmail  = $this->student->email;
        $offerTitle    = $this->offerTitle;

        return new Content(
            htmlString: "
                <div style='font-family: Arial, sans-serif; max-width: 620px; margin: auto; background:#f9fafb; padding:0; border-radius:12px; overflow:hidden;'>
                    <div style='background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align:center;'>
                        <h1 style='color:#fff; margin:0; font-size:24px;'>🎓 Nouveau stagiaire affecté</h1>
                        <p style='color:rgba(255,255,255,0.85); margin:8px 0 0;'>my_stage — Plateforme de gestion des stages</p>
                    </div>
                    <div style='padding: 32px; background:#fff;'>
                        <p style='font-size:16px; color:#374151;'>Bonjour <strong>{$encadrantName}</strong>,</p>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Un nouveau stagiaire vient de vous être affecté. Vous trouverez ci-dessous les informations de suivi.
                        </p>
                        <div style='background:#f0fdf4; border-left:4px solid #10b981; border-radius:8px; padding:20px; margin:24px 0;'>
                            <p style='margin:0 0 8px; color:#374151;'><strong>🎓 Offre de stage :</strong> {$offerTitle}</p>
                            <p style='margin:0 0 8px; color:#374151;'><strong>👤 Étudiant :</strong> {$studentName}</p>
                            <p style='margin:0; color:#374151;'><strong>📧 Email étudiant :</strong> {$studentEmail}</p>
                        </div>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Connectez-vous sur la plateforme <strong>my_stage</strong> pour accéder à votre tableau de bord encadrant
                            et commencer à suivre ce stagiaire.
                        </p>
                        <div style='text-align:center; margin:32px 0;'>
                            <a href='http://localhost:5173' style='background: linear-gradient(135deg, #059669, #10b981); color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:bold; display:inline-block;'>
                                Accéder à mon espace encadrant
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
