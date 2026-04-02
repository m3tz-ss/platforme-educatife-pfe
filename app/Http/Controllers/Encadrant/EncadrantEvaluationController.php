<?php

namespace App\Http\Controllers\Encadrant;

use App\Http\Controllers\Controller;
use App\Services\Encadrant\EncadrantEvaluationService;
use App\Services\Encadrant\EncadrantSupervisionService;
use App\Http\Resources\EvaluationResource;
use Illuminate\Http\Request;

class EncadrantEvaluationController extends Controller
{
    public function __construct(
        protected EncadrantEvaluationService $evaluations,
        protected EncadrantSupervisionService $supervision,
    ) {}

    public function show(Request $request, int $applicationId)
{
    $user = $request->user();
    $this->supervision->ensureEncadrant($user);

    $evaluation = $this->evaluations->show($user->id, $applicationId);

    // ✅ Retourner null proprement si pas encore d'évaluation
    if (!$evaluation) {
        return response()->json(null, 200);
    }

    return new EvaluationResource($evaluation);
}

public function upsert(Request $request, int $applicationId)
{
    $user = $request->user();
    $this->supervision->ensureEncadrant($user);

    $data = $request->validate([
        'score'          => 'nullable|numeric|between:0,20',
        'final_decision' => 'required|string|in:valide,a_ameliorer,non_conforme,pending',
        'notes'          => 'nullable|string|max:10000',
    ]);

    return new EvaluationResource(
        $this->evaluations->upsert($user->id, $applicationId, $data)
    );
}
}
