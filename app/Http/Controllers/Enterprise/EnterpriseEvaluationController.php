<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\EncadrantEvaluation;
use App\Http\Resources\EvaluationResource;
use Illuminate\Http\Request;
use App\Models\Application;

class EnterpriseEvaluationController extends Controller
{
    public function show(Request $request, int $applicationId)
    {
        $user = $request->user();
        if (!in_array($user->role, ['manager', 'rh'])) {
            abort(403, 'Accès refusé. Rôle manager ou rh requis.');
        }

        $evaluation = EncadrantEvaluation::where('application_id', $applicationId)
            ->where('encadrant_id', $user->id)
            ->first();

        if (!$evaluation) {
            return response()->json(null, 200);
        }

        return new EvaluationResource($evaluation);
    }

    public function upsert(Request $request, int $applicationId)
    {
        $user = $request->user();
        if (!in_array($user->role, ['manager', 'rh'])) {
            abort(403, 'Accès refusé. Rôle manager ou rh requis.');
        }

        $data = $request->validate([
            'score'          => 'nullable|numeric|between:0,20',
            'final_decision' => 'required|string|in:valide,a_ameliorer,non_conforme,pending',
            'notes'          => 'nullable|string|max:10000',
        ]);

        $evaluation = EncadrantEvaluation::updateOrCreate(
            [
                'application_id' => $applicationId,
                'encadrant_id'   => $user->id,
            ],
            [
                'score'          => $data['score'] ?? null,
                'final_decision' => $data['final_decision'],
                'notes'          => $data['notes'] ?? null,
            ]
        );

        return new EvaluationResource($evaluation);
    }
}
