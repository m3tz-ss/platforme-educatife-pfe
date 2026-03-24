<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\Student\StudentAccessService;
use Illuminate\Http\Request;

class StudentNotificationController extends Controller
{
    public function __construct(
        protected StudentAccessService $access,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $this->access->ensureStudent($user);

        $perPage = min((int) $request->query('per_page', 20), 50);

        return response()->json(
            $user->notifications()->paginate($perPage)
        );
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();
        $this->access->ensureStudent($user);

        return response()->json(['count' => $user->unreadNotifications()->count()]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $user = $request->user();
        $this->access->ensureStudent($user);

        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json($notification);
    }

    public function markAllRead(Request $request)
    {
        $user = $request->user();
        $this->access->ensureStudent($user);

        $user->unreadNotifications->markAsRead();

        return response()->json(['message' => 'OK']);
    }
}
