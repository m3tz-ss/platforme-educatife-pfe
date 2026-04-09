<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RHNotificationController extends Controller
{
    public function index(Request $request)
    {
        $user    = $request->user();
        $perPage = min((int) $request->query('per_page', 20), 50);

        return response()->json(
            $user->notifications()->paginate($perPage)
        );
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count()
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json($notification);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Toutes les notifications lues']);
    }
}
