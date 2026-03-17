<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ApplicationService;

class ApplicationController extends Controller
{
    public function __construct(
        protected ApplicationService $service
    ) {}

    /**
     * 🧑‍🎓 Étudiant — Postuler à une offre
     */
    public function store(Request $request)
    {
        $request->validate([
            'offer_id' => 'required|exists:offers,id',
            'cv'       => 'required|file|mimes:pdf|max:2048'
        ]);

        $result = $this->service->apply(
            auth()->id(),
            $request->offer_id,
            $request->file('cv')
        );

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], $result['code']);
        }

        return response()->json([
            'message'     => 'Candidature envoyée',
            'application' => $result['data']
        ], $result['code']);
    }

    /**
     * 🧑‍🎓 Étudiant — Liste de mes candidatures
     */
    public function myApplications()
    {
        $applications = $this->service->getStudentApplications(auth()->id());
        return response()->json($applications);
    }

    /**
     * 🏢 Entreprise — Candidatures reçues
     */
    public function receivedApplications()
    {
        $applications = $this->service->getEnterpriseApplications(auth()->id());
        return response()->json($applications);
    }

    /**
     * 🏢 Entreprise — Changer statut candidature
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:nouveau,preselectionnee,entretien,acceptee,refusee'
        ]);

        $application = $this->service->updateStatus($id, $request->status);

        return response()->json([
            'message'     => 'Statut mis à jour',
            'application' => $application
        ]);
    }
}