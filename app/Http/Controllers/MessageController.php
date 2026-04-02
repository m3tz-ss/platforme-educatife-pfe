<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Application;
use App\Services\MessageService;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(private MessageService $service) {}

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
                'message' => 'Non autorisé'
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
     */
    public function contacts(Request $request)
    {
        $user = $request->user();
        $contacts = collect();

        // ✅ RH → tous les utilisateurs sauf RH
        if ($user->role === 'rh') {

            $contacts = User::where('id', '!=', $user->id)
                ->where('role', '!=', 'rh')
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
                    'id'   => $app->student->id,
                    'name' => $app->student->name,
                    'role' => 'student',
                    'type' => 'student'
                ];
            });
        }

        // ✅ STUDENT → son encadrant via applications
        elseif ($user->type === 'student') {

            $application = Application::with('encadrant')
                ->where('student_id', $user->id)
                ->whereNotNull('encadrant_id')
                ->latest()
                ->first();

            if ($application && $application->encadrant) {
                $contacts = collect([
                    [
                        'id'   => $application->encadrant->id,
                        'name' => $application->encadrant->name,
                        'role' => 'encadrant',
                        'type' => 'enterprise'
                    ]
                ]);
            }
        }

        return response()->json($contacts->values());
    }
}