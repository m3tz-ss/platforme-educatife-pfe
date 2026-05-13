<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\OfferProposal;
use App\Models\User;
use App\Models\Application;
use App\Mail\OfferProposedToStudentMail;
use App\Notifications\Student\OfferProposedByRHNotification;
use App\Notifications\RH\StudentRespondedToProposalNotification;
use App\Services\MessageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OfferProposalController extends Controller
{
    public function __construct(private MessageService $messageService) {}

    /**
     * RH propose une offre à un étudiant
     * POST /rh/offer-proposals
     */
    public function propose(Request $request)
    {
        $request->validate([
            'offer_id'         => 'required|exists:offers,id',
            'student_id'       => 'required|exists:users,id',
            'personal_message' => 'nullable|string|max:1000',
        ]);

        $rh      = $request->user();
        $offer   = Offer::findOrFail($request->offer_id);
        $student = User::findOrFail($request->student_id);

        // Vérifier que l'étudiant n'a pas déjà une proposition pour cette offre
        $exists = OfferProposal::where('offer_id', $request->offer_id)
            ->where('student_id', $request->student_id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Une proposition a déjà été envoyée à cet étudiant pour cette offre.',
            ], 409);
        }

        // Créer la proposition
        $proposal = OfferProposal::create([
            'offer_id'         => $offer->id,
            'student_id'       => $student->id,
            'rh_id'            => $rh->id,
            'personal_message' => $request->personal_message ?? '',
            'status'           => 'pending',
        ]);

        // 1. Notification DB à l'étudiant
        $student->notify(new OfferProposedByRHNotification(
            $offer,
            $rh,
            $proposal->id,
            $request->personal_message ?? ''
        ));

        // 2. Email à l'étudiant
        if ($student->email) {
            Mail::to($student->email)
                ->send(new OfferProposedToStudentMail(
                    $student,
                    $offer,
                    $rh,
                    $request->personal_message ?? ''
                ));
        }

        // 3. Ouvrir / trouver la conversation RH ↔ Étudiant
        $conversation = $this->messageService->findOrCreateConversation($rh, $student);

        // 4. Envoyer un message d'amorce dans la conversation
        $msgBody = "Bonjour {$student->name}, je vous contacte concernant l'offre **\"{$offer->title}\"**."
            . ($request->personal_message ? "\n\n{$request->personal_message}" : '');

        $this->messageService->sendMessage($conversation, $rh, $msgBody);

        return response()->json([
            'message'         => 'Proposition envoyée avec succès.',
            'proposal'        => $proposal,
            'conversation_id' => $conversation->id,
        ], 201);
    }

    /**
     * Étudiant répond à une proposition (accepte ou refuse)
     * POST /student/offer-proposals/{id}/respond
     */
    public function respond(Request $request, int $id)
    {
        $request->validate([
            'response' => 'required|in:accepted,refused',
        ]);

        $student  = $request->user();
        $proposal = OfferProposal::where('id', $id)
            ->where('student_id', $student->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $proposal->status = $request->response;
        $proposal->save();

        $offer = Offer::findOrFail($proposal->offer_id);
        $rh    = User::findOrFail($proposal->rh_id);

        // 1. Si accepté → créer une candidature automatique
        if ($request->response === 'accepted') {
            $alreadyApplied = Application::where('student_id', $student->id)
                ->where('offer_id', $offer->id)
                ->exists();

            if (!$alreadyApplied) {
                Application::create([
                    'student_id' => $student->id,
                    'offer_id'   => $offer->id,
                    'status'     => 'acceptee',
                    'cv'         => $student->cv_path ?? null,
                ]);
            }
        }

        // 2. Notification DB au RH
        $rh->notify(new StudentRespondedToProposalNotification($student, $offer, $request->response));

        // 3. Message dans la conversation
        $conversation = $this->messageService->findOrCreateConversation($student, $rh);
        $responseText = $request->response === 'accepted'
            ? "✅ J'accepte votre proposition pour l'offre **\"{$offer->title}\"**. Merci !"
            : "❌ Je décline votre proposition pour l'offre **\"{$offer->title}\"**. Merci pour votre intérêt.";
        $this->messageService->sendMessage($conversation, $student, $responseText);

        return response()->json([
            'message'  => $request->response === 'accepted' ? 'Offre acceptée !' : 'Proposition refusée.',
            'proposal' => $proposal,
        ]);
    }

    /**
     * Liste des propositions de l'étudiant connecté
     * GET /student/offer-proposals
     */
    public function studentProposals(Request $request)
    {
        $proposals = OfferProposal::with(['offer.user.manager', 'rh:id,name,email'])
            ->where('student_id', $request->user()->id)
            ->latest()
            ->get();

        $data = $proposals->map(function ($proposal) {
            return [
                'id'               => $proposal->id,
                'offer_id'         => $proposal->offer_id,
                'student_id'       => $proposal->student_id,
                'rh_id'            => $proposal->rh_id,
                'personal_message' => $proposal->personal_message,
                'status'           => $proposal->status,
                'created_at'       => $proposal->created_at,
                'offer'            => new \App\Http\Resources\OfferResource($proposal->offer),
                'rh'               => $proposal->rh,
            ];
        });

        return response()->json($data);
    }

    /**
     * Liste des propositions envoyées par le RH connecté
     * GET /rh/offer-proposals
     */
    public function rhProposals(Request $request)
    {
        $proposals = OfferProposal::with(['offer', 'student:id,name,email,field,school,cv_path'])
            ->where('rh_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($proposals);
    }
}
