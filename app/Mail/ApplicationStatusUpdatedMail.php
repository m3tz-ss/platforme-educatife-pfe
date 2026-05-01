<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    private static array $STATUS_COLORS = [
        'acceptee'        => ['bg' => '#f0fdf4', 'border' => '#10b981', 'header' => 'linear-gradient(135deg,#059669,#10b981)'],
        'refusee'         => ['bg' => '#fef2f2', 'border' => '#ef4444', 'header' => 'linear-gradient(135deg,#dc2626,#ef4444)'],
        'entretien'       => ['bg' => '#eff6ff', 'border' => '#3b82f6', 'header' => 'linear-gradient(135deg,#2563eb,#3b82f6)'],
        'preselectionnee' => ['bg' => '#fdf4ff', 'border' => '#a855f7', 'header' => 'linear-gradient(135deg,#9333ea,#a855f7)'],
        'nouveau'         => ['bg' => '#f9fafb', 'border' => '#6b7280', 'header' => 'linear-gradient(135deg,#4b5563,#6b7280)'],
    ];

    public function __construct(
        public User   $student,
        public string $label,
        public string $offerTitle,
        public string $rawStatus = 'nouveau'
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '📬 Mise à jour de votre candidature — my_stage',
        );
    }

    public function content(): Content
    {
        $studentName = $this->student->name;
        $offerTitle  = $this->offerTitle;
        $label       = $this->label;
        $colors      = self::$STATUS_COLORS[$this->rawStatus] ?? self::$STATUS_COLORS['nouveau'];

        $bg     = $colors['bg'];
        $border = $colors['border'];
        $header = $colors['header'];

        return new Content(
            htmlString: "
                <div style='font-family: Arial, sans-serif; max-width: 620px; margin: auto; background:#f9fafb; padding:0; border-radius:12px; overflow:hidden;'>
                    <div style='background: {$header}; padding: 32px; text-align:center;'>
                        <h1 style='color:#fff; margin:0; font-size:24px;'>📬 Mise à jour de candidature</h1>
                        <p style='color:rgba(255,255,255,0.85); margin:8px 0 0;'>my_stage — Plateforme de gestion des stages</p>
                    </div>
                    <div style='padding: 32px; background:#fff;'>
                        <p style='font-size:16px; color:#374151;'>Bonjour <strong>{$studentName}</strong>,</p>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Le statut de votre candidature vient d'être mis à jour. Voici les détails :
                        </p>
                        <div style='background:{$bg}; border-left:4px solid {$border}; border-radius:8px; padding:20px; margin:24px 0;'>
                            <p style='margin:0 0 8px; color:#374151;'><strong>🎓 Offre de stage :</strong> {$offerTitle}</p>
                            <p style='margin:0; font-size:18px; color:#1f2937;'><strong>📌 Nouveau statut :</strong> {$label}</p>
                        </div>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Connectez-vous sur <strong>my_stage</strong> pour consulter tous les détails de votre candidature
                            et suivre votre dossier en temps réel.
                        </p>
                        <div style='text-align:center; margin:32px 0;'>
                            <a href='http://localhost:5173' style='background:{$header}; color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:bold; display:inline-block;'>
                                Voir ma candidature
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
