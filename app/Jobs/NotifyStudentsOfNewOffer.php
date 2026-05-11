<?php

namespace App\Jobs;

use App\Models\Offer;
use App\Models\User;
use App\Mail\NewOfferPublishedMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotifyStudentsOfNewOffer implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Offer $offer
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        User::where('type', 'student')
            ->whereNotNull('email')
            ->orderBy('id')
            ->chunk(50, function ($students) {
                foreach ($students as $student) {
                    try {
                        // Using queue instead of send even if mailable implements ShouldQueue for extra safety
                        Mail::to($student->email)
                            ->queue(new NewOfferPublishedMail($this->offer, $student));
                    } catch (\Throwable $e) {
                        Log::error("Mail new offer background queue failed for {$student->email}: " . $e->getMessage());
                    }
                }
            });
    }
}
