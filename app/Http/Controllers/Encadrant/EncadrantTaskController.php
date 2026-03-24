<?php

namespace App\Http\Controllers\Encadrant;

use App\Http\Controllers\Controller;
use App\Services\Encadrant\EncadrantTaskService;
use App\Services\Encadrant\EncadrantSupervisionService;
use Illuminate\Http\Request;

class EncadrantTaskController extends Controller
{
    public function __construct(
        protected EncadrantTaskService $tasks,
        protected EncadrantSupervisionService $supervision,
    ) {}

    public function index(Request $request, int $applicationId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);
        $perPage = min((int) $request->query('per_page', 15), 50);

        return response()->json($this->tasks->list($user->id, $applicationId, $perPage));
    }

    public function store(Request $request, int $applicationId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'nullable|string|in:todo,in_progress,done',
            'due_date'    => 'nullable|date',
            'sort_order'  => 'nullable|integer',
        ]);

        return response()->json($this->tasks->store($user->id, $applicationId, $data), 201);
    }

    public function update(Request $request, int $taskId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'sometimes|string|in:todo,in_progress,done',
            'due_date'    => 'nullable|date',
            'sort_order'  => 'nullable|integer',
        ]);

        return response()->json($this->tasks->update($user->id, $taskId, $data));
    }

    public function destroy(Request $request, int $taskId)
    {
        $user = $request->user();
        $this->supervision->ensureEncadrant($user);

        $this->tasks->destroy($user->id, $taskId);

        return response()->json(null, 204);
    }
}
