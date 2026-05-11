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

class NewOfferPublishedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Offer $offer,
        public User  $student
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🚀 Nouvelle offre de stage disponible — my_stage',
        );
    }

    public function content(): Content
    {
        $studentName  = $this->student->name;
        $offerTitle   = $this->offer->title;
        $offerDomain  = $this->offer->domain;
        $offerLocation= $this->offer->location;
        $offerDuration= $this->offer->duration;
        $offerDesc    = mb_strimwidth(strip_tags($this->offer->description ?? ''), 0, 200, '…');

        return new Content(
            htmlString: "
                <div style='font-family: Arial, sans-serif; max-width: 620px; margin: auto; background:#f9fafb; padding:0; border-radius:12px; overflow:hidden;'>
                    <div style='background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 32px; text-align:center;'>
                        <h1 style='color:#fff; margin:0; font-size:24px;'>🚀 Nouvelle offre disponible !</h1>
                        <p style='color:rgba(255,255,255,0.85); margin:8px 0 0;'>my_stage — Plateforme de gestion des stages</p>
                    </div>
                    <div style='padding: 32px; background:#fff;'>
                        <p style='font-size:16px; color:#374151;'>Bonjour <strong>{$studentName}</strong>,</p>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Une nouvelle offre de stage vient d'être publiée sur la plateforme <strong>my_stage</strong>.
                            Ne tardez pas à postuler !
                        </p>
                        <div style='background:#fffbeb; border-left:4px solid #f59e0b; border-radius:8px; padding:20px; margin:24px 0;'>
                            <h2 style='margin:0 0 12px; color:#1f2937; font-size:18px;'>📋 {$offerTitle}</h2>
                            <p style='margin:0 0 6px; color:#374151;'>🏷️ <strong>Domaine :</strong> {$offerDomain}</p>
                            <p style='margin:0 0 6px; color:#374151;'>📍 <strong>Lieu :</strong> {$offerLocation}</p>
                            <p style='margin:0 0 12px; color:#374151;'>⏱️ <strong>Durée :</strong> {$offerDuration}</p>
                            <p style='margin:0; color:#6b7280; font-size:14px; line-height:1.6;'>{$offerDesc}</p>
                        </div>
                        <p style='color:#6b7280; line-height:1.7;'>
                            Consultez les détails complets de l'offre et postulez directement sur la plateforme.
                        </p>
                        <div style='text-align:center; margin:32px 0;'>
                            <a href='http://localhost:5173' style='background: linear-gradient(135deg, #f59e0b, #ef4444); color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:bold; display:inline-block;'>
                                Voir l'offre et postuler
                            </a>
                        </div>
                    </div>
                    <div style='padding:16px 32px; background:#f9fafb; text-align:center; color:#9ca3af; font-size:12px;'>
                        © 2025 my_stage · tarresmoataz840@gmail.com
                        <br>Vous recevez cet email car vous êtes inscrit sur my_stage.
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
