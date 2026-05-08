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
        Route::post('formations', [FormationController::class, 'store']);
        Route::put($formationRoute, [FormationController::class, 'update']);
        Route::post($formationRoute, [FormationController::class, 'update']);
        Route::delete($formationRoute, [FormationController::class, 'destroy']);
        Route::post('formations/{formationId}/modules', [ModuleController::class, 'store'])->whereNumber('formationId');
        Route::put('modules/{module}', [ModuleController::class, 'update']);
        Route::delete('modules/{module}', [ModuleController::class, 'destroy']);
    });

    // Routes apprenant seulement
    Route::middleware('apprenant')->group(function () {
        Route::post('formations/{formationId}/inscription', [InscriptionController::class, 'store']);
        Route::delete('formations/{formationId}/inscription', [InscriptionController::class, 'destroy']);
        Route::get('apprenant/formations', [InscriptionController::class, 'index']);
        /**
         * Route de notation d'une formation.
         *
         * Elle est protégée par les middlewares auth.token et apprenant.
         * Le contrôleur vérifie ensuite la dernière règle métier : l'apprenant
         * doit être inscrit à la formation et ne peut noter qu'une seule fois.
         */
        Route::post('formations/{id}/noter', [FormationController::class, 'rate'])->whereNumber('id');
        Route::put('formations/{formationId}/progression', [InscriptionController::class, 'updateProgression']);
        Route::put('formations/{formationId}/modules/{module}/completion', [ModuleController::class, 'updateCompletion'])
            ->whereNumber('formationId');
    });
});
