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
    public function sendMessage(Conversation $conversation, User $sender, string $body, ?string $attachment = null, ?string $attachmentName = null): Message
    {
        $message = $conversation->messages()->create([
            'sender_id' => $sender->id,
            'body' => $body,
            'attachment' => $attachment,
            'attachment_name' => $attachmentName,
        ]);

        // ✅ Invalidate caches for all participants
        foreach ($conversation->participants as $participant) {
            Cache::forget("messages_user_{$participant->id}");
        }

        return $message;
    }

    public function updateMessage(Message $message, User $user, string $body): Message
    {
        if ($message->sender_id !== $user->id) {
            abort(403, 'Non autorisé à modifier ce message');
        }

        $message->update([
            'body' => $body,
            'is_edited' => true,
        ]);

        foreach ($message->conversation->participants as $participant) {
            Cache::forget("messages_user_{$participant->id}");
        }

        return $message;
    }

    public function deleteMessage(Message $message, User $user): void
    {
        if ($message->sender_id !== $user->id) {
            abort(403, 'Non autorisé à supprimer ce message');
        }

        $message->update([
            'body' => 'Ce message a été supprimé.',
            'attachment' => null,
            'attachment_name' => null,
            'is_deleted' => true,
        ]);

        foreach ($message->conversation->participants as $participant) {
            Cache::forget("messages_user_{$participant->id}");
        }
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
                    $unreadCount = $conv->messages()->where('sender_id', '!=', $user->id)->whereNull('read_at')->count();

                    return [
                        'id' => $conv->id,
                        'unread_count' => $unreadCount,
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