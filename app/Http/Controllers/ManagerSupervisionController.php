<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Application;
use App\Models\User;
use App\Models\EncadrantEvaluation;
use App\Models\Offer;

class ManagerSupervisionController extends Controller
{
    public function offers(Request $request)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $managerId = $request->user()->id;

        $offers = Offer::with(['user:id,name,email'])
            ->withCount('applications')
            ->where(function($q) use ($managerId) {
                $q->where('enterprise_id', $managerId)
                  ->orWhereIn('enterprise_id', function($sub) use ($managerId) {
                      $sub->select('id')->from('users')->where('manager_id', $managerId);
                  });
            })
            ->latest()
            ->get();

        return response()->json($offers);
    }

    public function evaluations(Request $request)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $managerId = $request->user()->id;

        $evaluations = EncadrantEvaluation::with([
                'application.student:id,name,email,photo_path',
                'application.offer:id,title',
                'encadrant:id,name,email,role',
            ])
            ->whereHas('application.offer', function($q) use ($managerId) {
                $q->where('enterprise_id', $managerId)
                  ->orWhereIn('enterprise_id', function($sub) use ($managerId) {
                      $sub->select('id')->from('users')->where('manager_id', $managerId);
                  });
            })
            ->latest()
            ->get();

        return response()->json($evaluations);
    }

    public function index(Request $request)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $managerId = $request->user()->id;

        // On récupère toutes les candidatures liées à l'entreprise du manager
        // (Offres créées par le manager lui-même ou par ses RH)
        $applications = Application::with([
                'student:id,name,email,photo_path',
                'offer:id,title,enterprise_id',
                'offer.user:id,name,email', // Le RH créateur de l'offre
                'encadrant:id,name,email',
            ])
            ->withCount([
                'encadrantTasks as total_tasks',
                'encadrantTasks as completed_tasks' => function($query) {
                    $query->where('status', 'done');
                }
            ])
            ->whereHas('offer', function($q) use ($managerId) {
                $q->where('enterprise_id', $managerId)
                  ->orWhereIn('enterprise_id', User::select('id')->where('manager_id', $managerId)->pluck('id'));
            })
            ->latest()
            ->get();

        // Calcul de l'avancement pour les stages acceptés
        $applications->each(function($app) {
            if ($app->status === 'acceptee') {
                $total = $app->total_tasks;
                $done = $app->completed_tasks;
                
                $app->progress = $total > 0 ? round(($done / $total) * 100) : 0;
                $app->stats = [
                    'total_tasks' => $total,
                    'completed_tasks' => $done,
                ];
            } else {
                $app->progress = 0;
                $app->stats = null;
            }
        });

        return response()->json($applications);
    }
}
