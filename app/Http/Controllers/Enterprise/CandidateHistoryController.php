<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\User;
use Illuminate\Http\Request;

class CandidateHistoryController extends Controller
{
    /**
     * 🔍 RH / Manager — Historique des stages d'un candidat
     * GET /rh/candidates/{studentId}/history
     */
    public function index(Request $request, int $studentId)
    {
        $user = $request->user();

        // Autorisation : manager, rh ou enterprise
        if (!in_array($user->role, ['manager', 'rh', 'enterprise'])) {
            abort(403, 'Accès refusé. Rôle manager, rh ou enterprise requis.');
        }

        // Récupérer l'étudiant
        $student = User::select('id', 'name', 'email', 'school', 'field', 'graduation_year', 'skills', 'photo_path', 'bio')
            ->findOrFail($studentId);

        // Récupérer tous ses stages avec évaluations
        $applications = Application::where('student_id', $studentId)
            ->with([
                'offer:id,title,description,location,duration,enterprise_id',
                'offer.enterprise:id,name,company_name,logo_path,email,phone,enterprise_id,manager_id',
                'offer.enterprise.enterprise:id,name,email,phone',
                'offer.enterprise.manager:id,email',
                'evaluations.encadrant:id,name,role,email',
                'encadrantComments.encadrant:id,name,role,email',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($app) {
                // Calcul du score moyen pour cette candidature
                $scores = $app->evaluations
                    ->whereNotNull('score')
                    ->pluck('score')
                    ->map(fn($s) => (float) $s);

                $avgScore = $scores->isNotEmpty()
                    ? round($scores->avg(), 1)
                    : null;

                return [
                    'id'         => $app->id,
                    'status'     => $app->status,
                    'created_at' => $app->created_at,
                    'updated_at' => $app->updated_at,
                    'offer'      => $app->offer ? [
                        'id'          => $app->offer->id,
                        'title'       => $app->offer->title,
                        'description' => $app->offer->description,
                        'location'    => $app->offer->location,
                        'duration'    => $app->offer->duration,
                        'enterprise'  => $app->offer->enterprise ? [
                            'id'           => $app->offer->enterprise->enterprise_id ?? $app->offer->enterprise->id,
                            'name'         => $app->offer->enterprise->company_name
                                          ?? $app->offer->enterprise->enterprise?->name
                                          ?? $app->offer->enterprise->name
                                          ?? 'N/A',
                            'logo_path'    => $app->offer->enterprise->logo_path,
                            'email'        => $app->offer->enterprise->enterprise?->email 
                                          ?? $app->offer->enterprise->manager?->email
                                          ?? $app->offer->enterprise->email,
                            'phone'        => $app->offer->enterprise->enterprise?->phone
                                          ?? $app->offer->enterprise->phone,
                        ] : null,
                    ] : null,
                    'evaluations'  => $app->evaluations->map(fn($ev) => [
                        'id'             => $ev->id,
                        'score'          => $ev->score !== null ? (float) $ev->score : null,
                        'final_decision' => $ev->final_decision,
                        'notes'          => $ev->notes,
                        'evaluator'      => $ev->encadrant ? [
                            'name' => $ev->encadrant->name,
                            'role' => $ev->encadrant->role,
                            'email' => $ev->encadrant->email,
                        ] : null,
                        'updated_at'     => $ev->updated_at,
                    ])->values(),
                    'encadrant_comments' => $app->encadrantComments->map(fn($c) => [
                        'id' => $c->id,
                        'body' => $c->body,
                        'created_at' => $c->created_at,
                        'encadrant' => $c->encadrant ? [
                            'name' => $c->encadrant->name,
                            'role' => $c->encadrant->role,
                            'email' => $c->encadrant->email,
                        ] : null,
                    ])->values(),
                    'avg_score'    => $avgScore,
                ];
            });

        // Score moyen global toutes candidatures confondues
        $allScores = $applications
            ->pluck('avg_score')
            ->filter(fn($s) => $s !== null)
            ->values();

        $globalAvg = $allScores->isNotEmpty()
            ? round($allScores->avg(), 1)
            : null;

        return response()->json([
            'student'        => $student,
            'applications'   => $applications,
            'global_avg_score' => $globalAvg,
            'total_internships' => $applications->count(),
            'completed_internships' => $applications->where('status', 'termine')->count(),
        ]);
    }
}
