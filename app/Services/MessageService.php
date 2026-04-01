<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MessageService
{
    /**
     * Vérifie si l'expéditeur peut envoyer un message au destinataire.
     */
    public function canSendTo(User $sender, User $receiver): bool
    {
        // Personne ne peut envoyer au RH
        if ($receiver->role === 'rh') {
            return false;
        }

        // RH peut envoyer à tout le monde
        if ($sender->role === 'rh') {
            return true;
        }

        // Étudiant → uniquement son encadrant assigné
        if ($sender->type === 'student') {
            return $sender->encadrant_id === $receiver->id;
        }

        // Encadrant → uniquement ses stagiaires
        if ($sender->role === 'encadrant') {
            return $receiver->encadrant_id === $sender->id;
        }

        return false;
    }

    /**
     * Trouve ou crée une conversation entre deux utilisateurs.
     */
    public function findOrCreateConversation(User $userA, User $userB): Conversation
    {
        // Cherche une conversation existante entre les deux
        $conversation = Conversation::whereHas('participants', function ($q) use ($userA) {
            $q->where('user_id', $userA->id);
        })->whereHas('participants', function ($q) use ($userB) {
            $q->where('user_id', $userB->id);
        })->first();

        if (!$conversation) {
            $conversation = DB::transaction(function () use ($userA, $userB) {
                $conv = Conversation::create();
                $conv->participants()->attach($userA->id);
$conv->participants()->attach($userB->id);
                return $conv;
            });
        }

        return $conversation;
    }

    /**
     * Envoie un message.
     */
    public function sendMessage(Conversation $conversation, User $sender, string $body): Message
    {
        return Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $sender->id,
            'body'            => $body,
        ]);
    }

    /**
     * Marque tous les messages non lus d'une conversation comme lus.
     */
    public function markAsRead(Conversation $conversation, User $user): void
    {
        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Retourne les conversations d'un utilisateur avec le dernier message.
     */
    public function getUserConversations(User $user): \Illuminate\Support\Collection
    {
        return $user->conversations()
            ->with([
                'participants',
                'latestMessage.sender',
            ])
            ->get()
            ->map(function ($conv) use ($user) {
                $other = $conv->participants->firstWhere('id', '!=', $user->id);
                $unread = Message::where('conversation_id', $conv->id)
                    ->where('sender_id', '!=', $user->id)
                    ->whereNull('read_at')
                    ->count();

                return [
                    'id'             => $conv->id,
                    'other_user'     => [
                        'id'   => $other?->id,
                        'name' => $other?->name,
                        'role' => $other?->role ?? $other?->type,
                    ],
                    'last_message'   => $conv->latestMessage?->body,
                    'last_message_at'=> $conv->latestMessage?->created_at,
                    'unread_count'   => $unread,
                ];
            })
            ->sortByDesc('last_message_at')
            ->values();
    }
}