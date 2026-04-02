<?php

namespace App\Http\Controllers\Encadrant;

use App\Http\Controllers\Controller;
use App\Services\Encadrant\EncadrantCommentService;
use App\Services\Encadrant\EncadrantSupervisionService;
use Illuminate\Http\Request;

class EncadrantCommentController extends Controller
{
    public function __construct(
        protected EncadrantCommentService $comments,
        protected EncadrantSupervisionService $supervision,
    ) {}

    public function index(Request $request, int $applicationId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);
        $perPage = min((int) $request->query('per_page', 20), 50);

        return response()->json($this->comments->list($user->id, $applicationId, $perPage));
    }

    public function store(Request $request, int $applicationId)
{
    try {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        $data = $request->validate([
            'body' => 'required|string|max:10000',
        ]);

        return response()->json($this->comments->store($user->id, $applicationId, $data['body']), 201);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'An unexpected error occurred.',
            'error'   => $e->getMessage(),
        ], 500);
    }
}

    public function destroy(Request $request, int $commentId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        $this->comments->destroy($user->id, $commentId);

        return response()->json(null, 204);
    }
}
