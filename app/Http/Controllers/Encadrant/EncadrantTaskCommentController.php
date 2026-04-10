<?php

namespace App\Http\Controllers\Encadrant;

use App\Http\Controllers\Controller;
use App\Services\Encadrant\EncadrantSupervisionService;
use App\Models\EncadrantTask;
use App\Models\EncadrantTaskComment;
use Illuminate\Http\Request;

class EncadrantTaskCommentController extends Controller
{
    public function __construct(
        protected EncadrantSupervisionService $supervision,
    ) {}

    /**
     * Lister les commentaires d'une tâche (encadrant)
     */
    public function index(Request $request, int $taskId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        $task = EncadrantTask::where('id', $taskId)
            ->where('encadrant_id', $user->id)
            ->firstOrFail();

        $perPage = min((int) $request->query('per_page', 30), 50);

        $comments = EncadrantTaskComment::where('encadrant_task_id', $taskId)
            ->with('user:id,name')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($comments);
    }

    /**
     * Créer un commentaire sur une tâche (encadrant)
     */
    public function store(Request $request, int $taskId)
{
    $user = $request->user();
    $this->supervision->ensureEncadrant($user);

    $task = EncadrantTask::where('id', $taskId)
        ->where('encadrant_id', $user->id)
        ->firstOrFail();

    $data = $request->validate([
        'body' => 'required|string|max:10000',
        'attachment' => 'nullable|file|mimes:pdf,doc,docx,png,jpg,zip|max:4096'
    ]);

    $filePath = null;

    if ($request->hasFile('attachment')) {
        $filePath = $request->file('attachment')->store('task_comments', 'public');
    }

    $comment = EncadrantTaskComment::create([
        'encadrant_task_id' => $taskId,
        'user_id'           => $user->id,
        'body'              => $data['body'],
        'attachment'        => $filePath
    ]);

    $comment->load('user:id,name');

    return response()->json($comment, 201);
}
    public function destroy(Request $request, int $taskId, int $commentId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        // Vérifier que la tâche appartient à l'encadrant
        $task = EncadrantTask::where('id', $taskId)
            ->where('encadrant_id', $user->id)
            ->firstOrFail();

        $comment = EncadrantTaskComment::where('id', $commentId)
            ->where('encadrant_task_id', $taskId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $comment->delete();

        return response()->json(null, 204);
    }
}
