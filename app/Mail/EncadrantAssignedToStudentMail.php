<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EncadrantAssignedToStudentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $student,
        public User $encadrant,
        public string $offerTitle
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '👨‍🏫 Un encadrant vous a été affecté — my_stage',
        );
    }

    public function content(): Content
    {
        $studentName   = $this->student->name;
        $encadrantName = $this->encadrant->name;
        $offerTitle    = $this->offerTitle;

        return new Content(
            htmlString: "
                <div style='font-family: Arial, sans-serif; max-width: 620px; margin: auto; background:#f9fafb; padding:0; border-radius:12px; overflow:hidden;'>
                    <div style='background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align:center;'>
                        <h1 style='color:#fff; margin:0; font-size:24px;'>👨‍🏫 Encadrant affecté</h1>
                        <p style='color:rgba(255,255,255,0.85); margin:8px 0 0;'>my_stage — Plateforme de gestion des stages</p>
                    </div>
                    <div style='padding: 32px; background:#fff;'>
                        <p style='font-size:16px; color:#374151;'>Bonjour <strong>{$studentName}</strong>,</p>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Bonne nouvelle ! Un encadrant vient de vous être affecté pour votre stage.
                        </p>
                        <div style='background:#f3f4f6; border-left:4px solid #6366f1; border-radius:8px; padding:20px; margin:24px 0;'>
                            <p style='margin:0 0 8px; color:#374151;'><strong>🎓 Offre de stage :</strong> {$offerTitle}</p>
                            <p style='margin:0; color:#374151;'><strong>👨‍🏫 Votre encadrant :</strong> {$encadrantName}</p>
                        </div>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Connectez-vous sur la plateforme <strong>my_stage</strong> pour accéder à votre espace de suivi de stage,
                            consulter vos tâches et communiquer avec votre encadrant.
                        </p>
                        <div style='text-align:center; margin:32px 0;'>
                            <a href='http://localhost:5173' style='background: linear-gradient(135deg, #6366f1, #8b5cf6); color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:bold; display:inline-block;'>
                                Accéder à mon espace
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
