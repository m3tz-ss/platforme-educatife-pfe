<?php

namespace App\Http\Controllers\Encadrant;

use App\Http\Controllers\Controller;
use App\Services\Encadrant\EncadrantSupervisionService;
use Illuminate\Http\Request;

class EncadrantSupervisionController extends Controller
{
    public function __construct(
        protected EncadrantSupervisionService $supervision,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        $perPage = min((int) $request->query('per_page', 12), 50);
        return response()->json(
            $this->supervision->dashboard($user->id, $perPage)
        );
    }

    public function show(Request $request, int $applicationId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        return response()->json(
            $this->supervision->applicationDetail($user->id, $applicationId)
        );
    }

    public function updateStatus(Request $request, int $applicationId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        $data = $request->validate([
            'status' => 'required|string|in:nouveau,preselectionnee,entretien,acceptee,refusee',
        ]);

        return response()->json(
            $this->supervision->updateApplicationStatus($user->id, $applicationId, $data['status'])
        );
    }
}
