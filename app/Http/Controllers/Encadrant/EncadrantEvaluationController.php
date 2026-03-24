<?php

namespace App\Http\Controllers\Encadrant;

use App\Http\Controllers\Controller;
use App\Services\Encadrant\EncadrantEvaluationService;
use App\Services\Encadrant\EncadrantSupervisionService;
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

        return response()->json(
            $this->evaluations->show($user->id, $applicationId)
        );
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

        return response()->json(
            $this->evaluations->upsert($user->id, $applicationId, $data)
        );
    }
}
