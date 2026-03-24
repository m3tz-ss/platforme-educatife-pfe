<?php

namespace App\Http\Controllers\Encadrant;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Services\Encadrant\EncadrantSupervisionService;
use Illuminate\Http\Request;

class EncadrantInterviewController extends Controller
{
    public function __construct(
        protected EncadrantSupervisionService $supervision,
    ) {}

    public function history(Request $request, int $applicationId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        if (!$this->supervision->canAccessApplication($user->id, $applicationId)) {
            abort(404);
        }

        $interviews = Interview::query()
            ->where('application_id', $applicationId)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json($interviews);
    }
}
