<?php

namespace App\Services;

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Application;
use Illuminate\Support\Facades\Cache;

class MessageService
{
    /**
     * 🔒 Vérifier si un utilisateur peut envoyer un message
     */
    public function canSendTo(User $sender, User $receiver): bool
    {
        // ✅ RH → tout le monde
        if ($sender->role === 'rh') {
            return true;
        }

        // ✅ STUDENT → son encadrant uniquement
        if ($sender->type === 'student') {
            return Application::where('student_id', $sender->id)
                ->where('encadrant_id', $receiver->id)
                ->exists();
        }

        // ✅ ENCADRANT → ses étudiants uniquement
        if ($sender->role === 'encadrant') {
            return Application::where('encadrant_id', $sender->id)
                ->where('student_id', $receiver->id)
                ->exists();
        }

        return false;
    }

    /**
     * 📩 Trouver ou créer conversation
     */
    public function findOrCreateConversation(User $user1, User $user2): Conversation
    {
        $conversation = Conversation::whereHas('participants', function ($q) use ($user1) {
            $q->where('user_id', $user1->id);
        })
            ->whereHas('participants', function ($q) use ($user2) {
                $q->where('user_id', $user2->id);
            })
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create();

            $conversation->participants()->attach([
                $user1->id,
                $user2->id
            ]);
        }

        return $conversation;
    }

    /**
     * ✉️ Envoyer message
     */
    public function sendMessage(Conversation $conversation, User $sender, string $body): Message
    {
        $message = $conversation->messages()->create([
            'sender_id' => $sender->id,
            'body' => $body,
        ]);

        // ✅ Invalidate caches for all participants
        foreach ($conversation->participants as $participant) {
            Cache::forget("messages_user_{$participant->id}");
        }

        return $message;
    }

    /**
     * 👁️ Marquer comme lu
     */
    public function markAsRead(Conversation $conversation, User $user): void
    {
        $updated = $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $user->id)
            ->update(['read_at' => now()]);

        if ($updated) {
            foreach ($conversation->participants as $participant) {
                Cache::forget("messages_user_{$participant->id}");
            }
        }
    }

    /**
     * 📥 Récupérer conversations utilisateur (Avec Cache)
     */
    public function getUserConversations(User $user)
    {
        $cacheKey = "messages_user_{$user->id}";
        $ttl = 120; // 120 seconds

        return Cache::remember($cacheKey, $ttl, function () use ($user) {
            return $user->conversations()
                ->with([
                    'participants:id,name',
                    'messages' => function ($q) {
                        $q->latest()->limit(1);
                    }
                ])
                ->get()
                ->map(function ($conv) use ($user) {
                    $other = $conv->participants->firstWhere('id', '!=', $user->id);

                    return [
                        'id' => $conv->id,
                        'user' => $other ? [
                            'id' => $other->id,
                            'name' => $other->name,
                        ] : null,
                        'last_message' => $conv->messages->first()
                    ];
                });
        });
    }
}