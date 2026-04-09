<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\InterviewController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\EncadrantController;
use App\Http\Controllers\Encadrant\EncadrantSupervisionController;
use App\Http\Controllers\Encadrant\EncadrantTaskController;
use App\Http\Controllers\Encadrant\EncadrantCommentController;
use App\Http\Controllers\Encadrant\EncadrantEvaluationController;
use App\Http\Controllers\Encadrant\EncadrantTaskCommentController;
use App\Http\Controllers\Encadrant\EncadrantInterviewController;
use App\Http\Controllers\Encadrant\EncadrantNotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EnterpriseController;
use App\Http\Controllers\Student\StudentSupervisionController;
use App\Http\Controllers\Student\StudentTaskController;
use App\Http\Controllers\Student\StudentNotificationController;
use App\Http\Controllers\Student\StudentTaskCreateController;
use App\Http\Controllers\AdminEnterpriseController;
use App\Http\Controllers\AdminOfferController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\RHNotificationController;
use App\Http\Controllers\Enterprise\EnterpriseEvaluationController;




// 🔐 Auth
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// 👤 Utilisateur connecté
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', function (Request $request) {
        return auth()->user();
    });

    // RH : CRUD offres
    Route::get('/offers', [OfferController::class, 'index']);          // Liste RH
    Route::post('/offers', [OfferController::class, 'store']);         // Créer
    Route::put('/offers/{offer}', [OfferController::class, 'update']); // Modifier
    Route::delete('/offers/{offer}', [OfferController::class, 'destroy']); // Supprimer

    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
    Route::get('/enterprise/applications', [ApplicationController::class, 'receivedApplications']);
    Route::patch('/applications/{id}', [ApplicationController::class, 'updateStatus']);
    Route::post('/enterprise/interviews', [InterviewController::class, 'store']);
    Route::patch('/enterprise/interviews/{id}/result', [InterviewController::class, 'updateResult']);
    Route::get('/enterprise/applications/{id}/interviews', [InterviewController::class, 'history']);
    Route::get('/student/applications/{id}/interviews', [InterviewController::class, 'candidateInterviews']);
    Route::get('/student/applications/{applicationId}/supervision', [StudentSupervisionController::class, 'show']);

    Route::prefix('student')->group(function () {
        Route::patch('/applications/{applicationId}/tasks/{taskId}/status', [StudentTaskController::class, 'updateStatus']);
        Route::get('/applications/{applicationId}/tasks/{taskId}/comments', [StudentTaskController::class, 'comments']);
        Route::post('/applications/{applicationId}/tasks/{taskId}/comments', [StudentTaskController::class, 'storeComment']);
        Route::post('/applications/{applicationId}/tasks', [StudentTaskCreateController::class, 'store']);

        Route::get('/notifications', [StudentNotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [StudentNotificationController::class, 'unreadCount']);
        Route::post('/notifications/read-all', [StudentNotificationController::class, 'markAllRead']);
        Route::post('/notifications/{id}/read', [StudentNotificationController::class, 'markAsRead']);
    });
});
// ⚙️ Gestion des utilisateurs internes par le Manager
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/enterprise/setup-manager', [UserController::class, 'setupManager']);
    Route::get('/internal-users', [UserController::class, 'index']);
    Route::post('/internal-users', [UserController::class, 'store']);
    Route::put('/internal-users/{id}', [UserController::class, 'update']);
    Route::delete('/internal-users/{id}', [UserController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/assign-encadrant/{id}', [EncadrantController::class, 'assign']);
    Route::get('/encadrants', [UserController::class, 'encadrants']);
    Route::get('/encadrant/students', [EncadrantController::class, 'students']);

    Route::prefix('encadrant')->group(function () {
        Route::get('/supervision', [EncadrantSupervisionController::class, 'index']);
        Route::get('/supervision/applications/{applicationId}', [EncadrantSupervisionController::class, 'show']);
        Route::patch('/supervision/applications/{applicationId}/status', [EncadrantSupervisionController::class, 'updateStatus']);

        Route::get('/applications/{applicationId}/tasks', [EncadrantTaskController::class, 'index']);
        Route::post('/applications/{applicationId}/tasks', [EncadrantTaskController::class, 'store']);
        Route::put('/tasks/{taskId}', [EncadrantTaskController::class, 'update']);
        Route::delete('/tasks/{taskId}', [EncadrantTaskController::class, 'destroy']);

        // Commentaires sur une tâche spécifique (encadrant)
        Route::get('/tasks/{taskId}/comments', [EncadrantTaskCommentController::class, 'index']);
        Route::post('/tasks/{taskId}/comments', [EncadrantTaskCommentController::class, 'store']);
        Route::delete('/tasks/{taskId}/comments/{commentId}', [EncadrantTaskCommentController::class, 'destroy']);

        Route::get('/applications/{applicationId}/comments', [EncadrantCommentController::class, 'index']);
        Route::post('/applications/{applicationId}/comments', [EncadrantCommentController::class, 'store']);
        Route::delete('/comments/{commentId}', [EncadrantCommentController::class, 'destroy']);

        Route::get('/applications/{applicationId}/evaluation', [EncadrantEvaluationController::class, 'show']);
        Route::put('/applications/{applicationId}/evaluation', [EncadrantEvaluationController::class, 'upsert']);

        Route::get('/applications/{applicationId}/interviews', [EncadrantInterviewController::class, 'history']);

        Route::get('/notifications', [EncadrantNotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [EncadrantNotificationController::class, 'unreadCount']);
        Route::post('/notifications/read-all', [EncadrantNotificationController::class, 'markAllRead']);
        Route::post('/notifications/{id}/read', [EncadrantNotificationController::class, 'markAsRead']);
    });
});
// 💬 Messagerie interne


Route::middleware('auth:sanctum')->prefix('messages')->group(function () {
    Route::get('/conversations', [MessageController::class, 'conversations']);
    Route::get('/conversations/{conversationId}', [MessageController::class, 'show']);
    Route::post('/send', [MessageController::class, 'send']);
    Route::get('/contacts', [MessageController::class, 'contacts']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/profile', [ProfileController::class, 'show']);
    Route::post('/user/profile', [ProfileController::class, 'update']);
    Route::post('/user/change-password', [ProfileController::class, 'changePassword']);
});

// 🧑‍🎓 Étudiant : offres publiques
Route::get('/public/offers', [OfferController::class, 'publicIndex']);
Route::get('/public/offers/{offer}', [OfferController::class, 'publicShow']);

Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
Route::get('/admin/statistics', [AdminController::class, 'statistics']);
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::post('/admin/users', [AdminController::class, 'createUser']);
    Route::put('/admin/users/{user}/role', [AdminController::class, 'updateRole']);
    Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser']);
    Route::patch('/admin/users/{user}/block', [AdminController::class, 'blockUser']);
    Route::patch('/admin/users/{user}/unblock', [AdminController::class, 'unblockUser']);
});

Route::middleware(['auth:sanctum'])->group(function() {
  Route::apiResource('enterprises', AdminEnterpriseController::class);
});
Route::middleware('auth:sanctum')->prefix('admin')->group(function() {
    Route::apiResource('offers', AdminOfferController::class);
});

Route::post('/enterprise/login', [AuthController::class, 'enterpriseLogin']);


Route::post('/enterprise', [EnterpriseController::class, 'store']);

// 🔔 Notifications RH / Manager / Enterprise
Route::middleware('auth:sanctum')->prefix('rh')->group(function () {
    Route::get('/notifications', [RHNotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [RHNotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all', [RHNotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [RHNotificationController::class, 'markAsRead']);

    // 📋 Validation Manager
    Route::get('/applications/{applicationId}/evaluation', [EnterpriseEvaluationController::class, 'show']);
    Route::put('/applications/{applicationId}/evaluation', [EnterpriseEvaluationController::class, 'upsert']);
});
