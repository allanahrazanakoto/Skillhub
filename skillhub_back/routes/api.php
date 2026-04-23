<?php

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
Route::middleware('auth.token')->group(function () {
    Route::get('formations/{formationId}/modules', [ModuleController::class, 'index'])->whereNumber('formationId');

    // Routes formateur seulement
    Route::middleware('formateur')->group(function () {
        Route::post('formations', [FormationController::class, 'store']);
        Route::put('formations/{formation}', [FormationController::class, 'update']);
        Route::post('formations/{formation}', [FormationController::class, 'update']);
        Route::delete('formations/{formation}', [FormationController::class, 'destroy']);
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
