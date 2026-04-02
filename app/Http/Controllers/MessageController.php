<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\MessageService;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(private MessageService $service) {}

    /**
     * GET /api/messages/conversations
     * Liste toutes les conversations de l'utilisateur connecté.
     */
    public function conversations(Request $request)
    {
        $conversations = $this->service->getUserConversations($request->user());
        return response()->json($conversations);
    }

    /**
     * GET /api/messages/conversations/{conversationId}
     * Retourne les messages d'une conversation.
     */
    public function show(Request $request, int $conversationId)
    {
        $user = $request->user();

        $conversation = $user->conversations()->findOrFail($conversationId);

        $this->service->markAsRead($conversation, $user);

        $messages = $conversation->messages()
            ->with('sender:id,name,role,type')
            ->orderBy('created_at')
            ->get()
            ->map(fn($msg) => [
                'id'         => $msg->id,
                'body'       => $msg->body,
                'sender'     => $msg->sender,
                'is_mine'    => $msg->sender_id === $user->id,
                'read_at'    => $msg->read_at,
                'created_at' => $msg->created_at,
            ]);

        return response()->json($messages);
    }

    /**
     * POST /api/messages/send
     * Envoie un message à un utilisateur.
     */
    public function send(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'body'        => 'required|string|max:2000',
        ]);

        $sender   = $request->user();
        $receiver = User::findOrFail($request->receiver_id);

        if (!$this->service->canSendTo($sender, $receiver)) {
            return response()->json([
                'message' => 'Vous n\'êtes pas autorisé à envoyer un message à cet utilisateur.'
            ], 403);
        }

        $conversation = $this->service->findOrCreateConversation($sender, $receiver);
        $message      = $this->service->sendMessage($conversation, $sender, $request->body);

        return response()->json([
            'conversation_id' => $conversation->id,
            'message'         => [
                'id'         => $message->id,
                'body'       => $message->body,
                'is_mine'    => true,
                'created_at' => $message->created_at,
            ],
        ], 201);
    }

    /**
     * GET /api/messages/contacts
     * Retourne la liste des contacts avec qui l'utilisateur peut discuter.
     */
    public function contacts(Request $request)
{
    $user = $request->user();
    $contacts = collect();

    if ($user->role === 'rh') {
        $contacts = User::where('id', '!=', $user->id)
            ->where('role', '!=', 'rh')
            ->select('id', 'name', 'role', 'type')
            ->get();
    } elseif ($user->role === 'encadrant') {
        $contacts = $user->stagiaires()->select('id', 'name', 'type')->get()
            ->map(fn($u) => array_merge($u->toArray(), ['role' => 'student']));
    } elseif ($user->type === 'student') {
        $encadrant = $user->encadrant()->select('id', 'name', 'role')->first();
        if ($encadrant) {
            $contacts = collect([$encadrant]);
        }
    }

    return response()->json($contacts->values());
}
}