<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Application;
use App\Services\MessageService;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(private MessageService $service)
    {
    }

    /**
     * GET /api/messages/conversations
     */
    public function conversations(Request $request)
    {
        $conversations = $this->service->getUserConversations($request->user());
        return response()->json($conversations);
    }

    /**
     * GET /api/messages/conversations/{conversationId}
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
                'id' => $msg->id,
                'body' => $msg->body,
                'attachment' => $msg->attachment ? url('storage/' . $msg->attachment) : null,
                'attachment_name' => $msg->attachment_name,
                'is_edited' => $msg->is_edited,
                'is_deleted' => $msg->is_deleted,
                'sender' => $msg->sender,
                'is_mine' => $msg->sender_id === $user->id,
                'read_at' => $msg->read_at,
                'created_at' => $msg->created_at,
            ]);

        return response()->json($messages);
    }

    /**
     * POST /api/messages/send
     */
    public function send(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'body' => 'required|string|max:2000',
            'conversation_id' => 'nullable|exists:conversations,id',
            'attachment' => 'nullable|file|max:5120', // 5MB max
        ]);

        $sender = $request->user();
        $receiver = User::findOrFail($request->receiver_id);

        if (!$this->service->canSendTo($sender, $receiver)) {
            return response()->json([
                'message' => 'Non autorisé'
            ], 403);
        }

        if ($request->has('conversation_id')) {
            $conversation = \App\Models\Conversation::findOrFail($request->conversation_id);
        } else {
            $conversation = $this->service->findOrCreateConversation($sender, $receiver);
        }

        $attachmentPath = null;
        $attachmentName = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('messages', 'public');
        }

        $message = $this->service->sendMessage($conversation, $sender, $request->body, $attachmentPath, $attachmentName);

        return response()->json([
            'conversation_id' => $conversation->id,
            'message' => [
                'id' => $message->id,
                'body' => $message->body,
                'attachment' => $message->attachment ? url('storage/' . $message->attachment) : null,
                'attachment_name' => $message->attachment_name,
                'is_edited' => false,
                'is_deleted' => false,
                'is_mine' => true,
                'created_at' => $message->created_at,
            ],
        ], 201);
    }

    /**
     * PUT /api/messages/{messageId}
     */
    public function update(Request $request, int $messageId)
    {
        $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $message = \App\Models\Message::findOrFail($messageId);
        $updatedMessage = $this->service->updateMessage($message, $request->user(), $request->body);

        return response()->json([
            'id' => $updatedMessage->id,
            'body' => $updatedMessage->body,
            'is_edited' => $updatedMessage->is_edited,
            'is_deleted' => $updatedMessage->is_deleted,
        ]);
    }

    /**
     * DELETE /api/messages/{messageId}
     */
    public function destroy(Request $request, int $messageId)
    {
        $message = \App\Models\Message::findOrFail($messageId);
        $this->service->deleteMessage($message, $request->user());

        return response()->json(null, 204);
    }

    /**
     * GET /api/messages/contacts
     */
    public function contacts(Request $request)
    {
        $user = $request->user();
        $contacts = collect();

        // ✅ RH → tous les utilisateurs sauf RH (inclut admin, managers, encadrants, étudiants)
        if ($user->role === 'rh') {

            $contacts = User::where('id', '!=', $user->id)
                ->where(function ($query) {
                    $query->where('role', '!=', 'rh')
                        ->orWhereNull('role');
                })
                ->select('id', 'name', 'role', 'type')
                ->get();
        }

        // ✅ ENCadrant → ses étudiants via applications
        elseif ($user->role === 'encadrant') {

            $applications = Application::with('student')
                ->where('encadrant_id', $user->id)
                ->get();

            $contacts = $applications->map(function ($app) {
                return [
                    'id' => $app->student->id,
                    'name' => $app->student->name,
                    'role' => 'student',
                    'type' => 'student'
                ];
            });
        }

        // ✅ STUDENT → son encadrant + les RH qui lui ont envoyé des propositions
        elseif ($user->type === 'student') {

            $application = Application::with('encadrant')
                ->where('student_id', $user->id)
                ->whereNotNull('encadrant_id')
                ->latest()
                ->first();

            if ($application && $application->encadrant) {
                $contacts->push([
                    'id'   => $application->encadrant->id,
                    'name' => $application->encadrant->name,
                    'role' => 'encadrant',
                    'type' => 'enterprise',
                ]);
            }

            // Ajouter les RH avec qui il a une proposition (ou conversation)
            $rhIds = \App\Models\OfferProposal::where('student_id', $user->id)
                ->pluck('rh_id')
                ->unique();

            $rhs = User::whereIn('id', $rhIds)->get(['id', 'name', 'role', 'type']);
            foreach ($rhs as $rh) {
                $contacts->push([
                    'id'   => $rh->id,
                    'name' => $rh->name . ' (RH)',
                    'role' => $rh->role,
                    'type' => $rh->type,
                ]);
            }
        }

        return response()->json($contacts->values());
    }
}