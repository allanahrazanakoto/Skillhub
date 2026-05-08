<?php

$formationRoute = 'formations/{formation}';

use App\Http\Controllers\Api\CategorieFormationController;
use App\Http\Controllers\Api\FormationController;
use App\Http\Controllers\Api\InscriptionController;
use App\Http\Controllers\Api\ModuleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Routes publiques
Route::get('categories', [CategorieFormationController::class, 'index']);
Route::get('formations', [FormationController::class, 'index']);
Route::get('formations/{id}', [FormationController::class, 'show'])->whereNumber('id');

// Routes protégées
Route::middleware('auth.token')->group(function () use ($formationRoute) {
    Route::get('formations/{formationId}/modules', [ModuleController::class, 'index'])->whereNumber('formationId');

    // Routes formateur seulement
    Route::middleware('formateur')->group(function () use ($formationRoute) {
        /**
         * Creation de formation reservee aux formateurs authentifies.
         */
        Route::post('formations', [FormationController::class, 'store']);

        /**
         * Liste des apprenants inscrits a une formation.
         *
         * Cette route est reservee au formateur authentifie. Le controleur
         * verifie ensuite qu'il est bien proprietaire de la formation cible.
         */
        Route::get('formations/{id}/apprenants', [FormationController::class, 'learners'])->whereNumber('id');

        /**
         * Mise a jour reservee au formateur proprietaire.
         */
        Route::put($formationRoute, [FormationController::class, 'update']);

        /**
         * Variante POST conservee pour les formulaires multipart/form-data.
         */
        Route::post($formationRoute, [FormationController::class, 'update']);

        /**
         * Suppression reservee au formateur proprietaire.
         */
        Route::delete($formationRoute, [FormationController::class, 'destroy']);

        /**
         * Gestion des modules reservee au formateur.
         */
        Route::post('formations/{formationId}/modules', [ModuleController::class, 'store'])->whereNumber('formationId');
        Route::put('modules/{module}', [ModuleController::class, 'update']);
        Route::delete('modules/{module}', [ModuleController::class, 'destroy']);
    });

    // Routes apprenant seulement
    Route::middleware('apprenant')->group(function () {
        Route::post('formations/{formationId}/inscription', [InscriptionController::class, 'store']);
        Route::delete('formations/{formationId}/inscription', [InscriptionController::class, 'destroy']);
        Route::get('apprenant/formations', [InscriptionController::class, 'index']);
        Route::put('formations/{formationId}/progression', [InscriptionController::class, 'updateProgression']);
        Route::put('formations/{formationId}/modules/{module}/completion', [ModuleController::class, 'updateCompletion'])
            ->whereNumber('formationId');
    });
});
