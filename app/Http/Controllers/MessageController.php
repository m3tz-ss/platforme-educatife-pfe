<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\User;
use App\Models\Application;
use App\Models\Conversation;
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
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($request->has('conversation_id')) {
            $conversation = Conversation::findOrFail($request->conversation_id);
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
     * DELETE /api/messages/conversations/{conversationId}
     * Supprime (retire) une conversation pour l'utilisateur courant.
     */
    public function deleteConversation(Request $request, int $conversationId)
    {
        $user = $request->user();
        $conversation = $user->conversations()->findOrFail($conversationId);

        // Détacher l'utilisateur de la conversation (soft-leave)
        $conversation->participants()->detach($user->id);

        // Si plus aucun participant, on supprime la conversation entièrement
        if ($conversation->participants()->count() === 0) {
            $conversation->messages()->delete();
            $conversation->delete();
        }

        return response()->json(null, 204);
    }

    /**
     * GET /api/messages/contacts
     */
    public function contacts(Request $request)
    {
        $user = $request->user();
        $contacts = collect();

        // ✅ RH → l'encadrant et manager de la société ET les candidats acceptés
        if ($user->role === 'rh') {
            // 1. Trouver les collègues (manager et encadrants de la même entreprise)
            $colleaguesIds = User::where('id', '!=', $user->id)
                ->whereIn('role', ['manager', 'encadrant'])
                ->where(function ($query) use ($user) {
                    if ($user->enterprise_id) {
                        $query->where('enterprise_id', $user->enterprise_id);
                    } elseif ($user->manager_id) {
                        $query->where('id', $user->manager_id)
                              ->orWhere('manager_id', $user->manager_id);
                    }
                })
                ->pluck('id')
                ->toArray();

            // 2. Trouver les IDs de tous les créateurs d'offres de cette entreprise
            $offerCreatorIds = [$user->id];
            if ($user->enterprise_id) {
                $offerCreatorIds = User::where('enterprise_id', $user->enterprise_id)->pluck('id')->toArray();
            } elseif ($user->manager_id) {
                $offerCreatorIds = User::where('manager_id', $user->manager_id)
                                       ->orWhere('id', $user->manager_id)
                                       ->pluck('id')->toArray();
            }

            // 3. Trouver les étudiants acceptés
            $acceptedStudentIds = Application::whereHas('offer', function($q) use ($offerCreatorIds) {
                    $q->whereIn('enterprise_id', $offerCreatorIds);
                })
                ->whereIn('status', ['acceptee', 'termine'])
                ->pluck('student_id')
                ->toArray();

            // 4. Récupérer les utilisateurs
            $allContactIds = array_unique(array_merge($colleaguesIds, $acceptedStudentIds));

            $contacts = User::whereIn('id', $allContactIds)
                ->select('id', 'name', 'role', 'type')
                ->get();
        }
        
        // ✅ MANAGER → le rh et encadrant de cette sosciete seulment
        elseif ($user->role === 'manager') {
            $contacts = User::where('id', '!=', $user->id)
                ->whereIn('role', ['rh', 'encadrant'])
                ->where(function ($query) use ($user) {
                    if ($user->enterprise_id) {
                        $query->where('enterprise_id', $user->enterprise_id);
                    } else {
                        $query->where('manager_id', $user->id);
                    }
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
                    'type' => 'student',
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
                    'id' => $application->encadrant->id,
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
                    'id' => $rh->id,
                    'name' => $rh->name . ' (RH)',
                    'role' => $rh->role,
                    'type' => $rh->type,
                ]);
            }
        }

        // ✅ Fusionner avec les contacts manuellement ajoutés (table contacts)
        $savedContactIds = Contact::where('user_id', $user->id)
            ->pluck('contact_user_id');

        $savedUsers = User::whereIn('id', $savedContactIds)
            ->whereNotIn('id', $contacts->pluck('id')->filter())
            ->get(['id', 'name', 'role', 'type']);

        foreach ($savedUsers as $su) {
            $contacts->push([
                'id' => $su->id,
                'name' => $su->name,
                'role' => $su->role,
                'type' => $su->type,
                'is_saved' => true,
            ]);
        }

        // Marquer les contacts déjà sauvegardés
        $savedIds = $savedContactIds->toArray();
        $contacts = $contacts->map(function ($c) use ($savedIds) {
            $id = is_array($c) ? $c['id'] : $c->id;
            if (is_array($c)) {
                $c['is_saved'] = in_array($id, $savedIds);
                return $c;
            }
            return array_merge($c->toArray(), ['is_saved' => in_array($id, $savedIds)]);
        });

        return response()->json($contacts->values());
    }

    /**
     * POST /api/messages/contacts
     * Ajouter un utilisateur aux contacts.
     */
    public function addContact(Request $request)
    {
        $request->validate([
            'contact_user_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();

        if ((int) $request->contact_user_id === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas vous ajouter vous-même'], 422);
        }

        Contact::firstOrCreate([
            'user_id' => $user->id,
            'contact_user_id' => $request->contact_user_id,
        ]);

        $contactUser = User::findOrFail($request->contact_user_id);

        return response()->json([
            'id' => $contactUser->id,
            'name' => $contactUser->name,
            'role' => $contactUser->role,
            'type' => $contactUser->type,
            'is_saved' => true,
        ], 201);
    }

    /**
     * DELETE /api/messages/contacts/{contactUserId}
     * Supprimer un utilisateur des contacts.
     */
    public function removeContact(Request $request, int $contactUserId)
    {
        $user = $request->user();

        Contact::where('user_id', $user->id)
            ->where('contact_user_id', $contactUserId)
            ->delete();

        return response()->json(null, 204);
    }
}