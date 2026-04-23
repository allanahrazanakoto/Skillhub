<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Formation;
use App\Models\FormationModule;
use App\Models\Inscription;
use App\Models\ModuleProgression;
use App\Models\Utilisateur;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Inscriptions apprenants (middleware : rôle participant).
 */
class InscriptionController extends Controller
{
    public function store(Request $request, int $formationId): JsonResponse
    {
        $email = $request->authUser['email'] ?? null;
        $utilisateur = $email ? Utilisateur::where('email', $email)->first() : null;
        if (! $utilisateur) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }
        $userId = $utilisateur->id;

        $formation = Formation::find($formationId);
        if (! $formation) {
            return response()->json(['message' => 'Formation introuvable'], 404);
        }

        $exists = Inscription::where('utilisateur_id', $userId)->where('formation_id', $formationId)->exists();
        if ($exists) {
            return response()->json(['message' => 'Vous êtes déjà inscrit à cette formation.'], 422);
        }

        Inscription::create([
            'utilisateur_id' => $userId,
            'formation_id' => $formationId,
            'progression' => 0,
        ]);

        app(ActivityLogService::class)->logCourseEnrollment($userId, $formationId);

        return response()->json(['message' => 'Inscription enregistrée.'], 201);
    }

    public function destroy(Request $request, int $formationId): JsonResponse
    {
        $email = $request->authUser['email'] ?? null;
        $utilisateur = $email ? Utilisateur::where('email', $email)->first() : null;
        if (! $utilisateur) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }
        $userId = $utilisateur->id;

        $inscription = Inscription::where('utilisateur_id', $userId)->where('formation_id', $formationId)->first();
        if (! $inscription) {
            return response()->json(['message' => 'Inscription introuvable.'], 404);
        }

        // Nettoyage du suivi des modules pour cet apprenant sur cette formation
        $moduleIds = FormationModule::where('formation_id', $formationId)->pluck('id');
        if ($moduleIds->isNotEmpty()) {
            ModuleProgression::where('utilisateur_id', $userId)
                ->whereIn('module_id', $moduleIds)
                ->delete();
        }

        $inscription->delete();

        return response()->json(['message' => 'Désinscription effectuée.']);
    }

    public function index(Request $request): JsonResponse
    {
        $email = $request->authUser['email'] ?? null;
        $utilisateur = $email ? Utilisateur::where('email', $email)->first() : null;
        if (! $utilisateur) {
            return response()->json(['formations' => []]);
        }
        $userId = $utilisateur->id;

        $inscriptions = Inscription::where('utilisateur_id', $userId)
            ->whereHas('formation')
            ->with(['formation.formateur:id,nom,prenom', 'formation.categorie:id,libelle'])
            ->orderByDesc('date_inscription')
            ->get();

        $formations = $inscriptions->map(function (Inscription $ins) {
            $f = $ins->formation;
            if (! $f) {
                return null;
            }
            $f->progression = $ins->progression;
            $f->date_inscription = $ins->date_inscription;

            return $f;
        })->filter()->values();

        return response()->json(['formations' => $formations]);
    }

    public function updateProgression(Request $request, int $formationId): JsonResponse
    {
        $email = $request->authUser['email'] ?? null;
        $utilisateur = $email ? Utilisateur::where('email', $email)->first() : null;
        if (! $utilisateur) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }
        $userId = $utilisateur->id;

        $inscription = Inscription::where('utilisateur_id', $userId)->where('formation_id', $formationId)->first();
        if (! $inscription) {
            return response()->json(['message' => 'Inscription introuvable.'], 404);
        }

        $progression = (int) request()->input('progression', 0);
        $progression = max(0, min(100, $progression));
        $inscription->update(['progression' => $progression]);

        return response()->json(['message' => 'Progression enregistrée', 'progression' => $inscription->progression]);
    }
}
