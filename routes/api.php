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
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EnterpriseController;




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
    Route::patch('/applications/{id}',[ApplicationController::class, 'updateStatus']);
    Route::post('/enterprise/interviews', [InterviewController::class, 'store']);
    Route::patch('/enterprise/interviews/{id}/result', [InterviewController::class, 'updateResult']);
    Route::get('/enterprise/applications/{id}/interviews', [InterviewController::class, 'history']);
    Route::get('/student/applications/{id}/interviews', [InterviewController::class, 'candidateInterviews']);
    
    
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
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/profile',         [ProfileController::class, 'show']);
    Route::post('/user/profile',        [ProfileController::class, 'update']);
    Route::post('/user/change-password',[ProfileController::class, 'changePassword']);
});

// 🧑‍🎓 Étudiant : offres publiques
Route::get('/public/offers', [OfferController::class, 'publicIndex']);
Route::get('/public/offers/{offer}', [OfferController::class, 'publicShow']);

Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);

Route::post('/enterprise/login', [AuthController::class, 'enterpriseLogin']);


Route::post('/enterprise', [EnterpriseController::class, 'store']);
