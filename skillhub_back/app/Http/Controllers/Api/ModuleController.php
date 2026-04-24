<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreModuleRequest;
use App\Http\Requests\UpdateModuleRequest;
use App\Models\Formation;
use App\Models\FormationModule;
use App\Models\Inscription;
use App\Models\ModuleProgression;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    private const MSG_FORMATION_INTROUVABLE = 'Formation introuvable';
    private const MSG_GESTION_FORMATION = 'Vous ne pouvez gérer que vos propres formations.';
    private const MSG_INSCRIPTION_OBLIGATOIRE = 'Vous devez être inscrit à cette formation.';
    private const MSG_MODULE_INVALIDE = 'Module invalide pour cette formation.';
    public function index(Request $request, int $formationId): JsonResponse
    {
        $formation = Formation::find($formationId);
        if (! $formation) {
            return response()->json(['message' => self::MSG_FORMATION_INTROUVABLE], 404);
        }

        $modules = FormationModule::where('formation_id', $formationId)
            ->orderBy('ordre')
            ->orderBy('id')
            ->get();

        $user = $request->user();
        if ($user && $user->role === 'participant') {
            $moduleIds = $modules->pluck('id');
            $progressions = ModuleProgression::where('utilisateur_id', (int) $user->id)
                ->whereIn('module_id', $moduleIds)
                ->get();

            // Migration douce: si l'apprenant avait une progression globale historique mais aucune
            // ligne module_progressions, on initialise les coches sur les premiers modules.
            if ($progressions->isEmpty()) {
                $inscription = Inscription::where('utilisateur_id', (int) $user->id)
                    ->where('formation_id', $formationId)
                    ->first();

                if ($inscription && (int) $inscription->progression > 0 && $modules->count() > 0) {
                    $doneCount = (int) round(((int) $inscription->progression / 100) * $modules->count());
                    $doneCount = max(0, min($doneCount, $modules->count()));

                    $doneIds = $modules->take($doneCount)->pluck('id');
                    foreach ($doneIds as $moduleId) {
                        ModuleProgression::updateOrCreate(
                            ['module_id' => (int) $moduleId, 'utilisateur_id' => (int) $user->id],
                            ['est_fait' => true]
                        );
                    }

                    $progressions = ModuleProgression::where('utilisateur_id', (int) $user->id)
                        ->whereIn('module_id', $moduleIds)
                        ->get();
                }
            }

            $doneModuleIds = $progressions
                ->where('est_fait', true)
                ->pluck('module_id')
                ->all();

            $doneMap = array_flip($doneModuleIds);
            $modules->transform(function (FormationModule $module) use ($doneMap) {
                $module->est_fait = isset($doneMap[$module->id]);

                return $module;
            });
        }

        return response()->json(['modules' => $modules]);
    }

    public function store(StoreModuleRequest $request, int $formationId): JsonResponse
    {
        $formation = Formation::find($formationId);
        if (! $formation) {
            return response()->json(['message' => self::MSG_FORMATION_INTROUVABLE], 404);
        }

        if ($formation->id_formateur !== (int) $request->user()->id) {
            return response()->json(['message' => self::MSG_GESTION_FORMATION], 403);
        }

        $data = $request->validated();
        $data['formation_id'] = $formationId;
        if (! isset($data['ordre'])) {
            $maxOrdre = (int) FormationModule::where('formation_id', $formationId)->max('ordre');
            $data['ordre'] = $maxOrdre > 0 ? $maxOrdre + 1 : 1;
        }

        $module = FormationModule::create($data);

        return response()->json([
            'message' => 'Module ajouté avec succès',
            'module' => $module,
        ], 201);
    }

    public function update(UpdateModuleRequest $request, FormationModule $module): JsonResponse
    {
        $formation = Formation::find($module->formation_id);
        if (! $formation) {
            return response()->json(['message' => self::MSG_FORMATION_INTROUVABLE], 404);
        }

        if ($formation->id_formateur !== (int) $request->user()->id) {
            return response()->json(['message' => self::MSG_GESTION_FORMATION], 403);
        }

        $module->update($request->validated());

        return response()->json([
            'message' => 'Module modifié avec succès',
            'module' => $module->fresh(),
        ]);
    }

    public function destroy(FormationModule $module): JsonResponse
    {
        $formation = Formation::find($module->formation_id);
        if (! $formation) {
            return response()->json(['message' => self::MSG_FORMATION_INTROUVABLE], 404);
        }

        if ($formation->id_formateur !== (int) auth()->id()) {
            return response()->json(['message' => self::MSG_GESTION_FORMATION], 403);
        }

        $module->delete();

        return response()->json(['message' => 'Module supprimé avec succès']);
    }

    public function updateCompletion(Request $request, int $formationId, FormationModule $module): JsonResponse
    {
        if ($module->formation_id !== $formationId) {
            return response()->json(['message' => self::MSG_MODULE_INVALIDE], 422);
        }

        $userId = (int) $request->user()->id;
        $inscription = Inscription::where('utilisateur_id', $userId)
            ->where('formation_id', $formationId)
            ->first();

        if (! $inscription) {
            return response()->json(['message' => self::MSG_INSCRIPTION_OBLIGATOIRE], 403);
        }

        $estFait = (bool) $request->boolean('est_fait');
        ModuleProgression::updateOrCreate(
            ['module_id' => $module->id, 'utilisateur_id' => $userId],
            ['est_fait' => $estFait]
        );

        $total = FormationModule::where('formation_id', $formationId)->count();
        $faits = ModuleProgression::query()
            ->join('modules', 'modules.id', '=', 'module_progressions.module_id')
            ->where('modules.formation_id', $formationId)
            ->where('module_progressions.utilisateur_id', $userId)
            ->where('module_progressions.est_fait', true)
            ->count();
        $progression = $total > 0 ? (int) round(($faits / $total) * 100) : 0;

        $inscription->update(['progression' => $progression]);

        return response()->json([
            'message' => 'Statut du module mis à jour.',
            'module' => array_merge($module->fresh()->toArray(), ['est_fait' => $estFait]),
            'progression' => $progression,
        ]);
    }
}
