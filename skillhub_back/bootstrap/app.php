<?php

/**
 * Point d'entrée de l'application Laravel.
 * Définit le routage (web, api, console), l'alias du middleware "formateur"
 * et le rendu des exceptions en JSON pour toutes les routes api/*.
 */

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'formateur'   => \App\Http\Middleware\VerifierFormateur::class,
            'apprenant'   => \App\Http\Middleware\VerifierApprenant::class,
            // Nouveau middleware : valide le token auprès du microservice Spring Boot Auth
            'auth.token'  => \App\Http\Middleware\ValidateAuthToken::class,
        ]);
        // Evite la redirection vers une route "login" inexistante sur les routes API protégées.
        $middleware->redirectGuestsTo(function (Request $request) {
            return $request->is('api/*') ? null : '/login';
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Pour les routes api/* on renvoie toujours du JSON (le front attend du JSON)
        $exceptions->shouldRenderJsonWhen(fn (Request $request, \Throwable $e) => $request->is('api/*'));

        // 422 : erreurs de validation (champs manquants, format invalide, etc.)
        $exceptions->renderable(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Erreur de validation',
                    'erreurs' => $e->errors(),
                ], 422);
            }
        });

        // 401 : non authentifié (token manquant ou invalide)
        $exceptions->renderable(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Token manquant ou invalide. Veuillez vous reconnecter.'], 401);
            }
        });

        // 401 JWT : token expiré, invalide, ou non fourni
        $exceptions->renderable(function (UnauthorizedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                $message = $e->getMessage();
                if (str_contains($message, 'expired')) {
                    $message = 'Token expiré. Veuillez vous reconnecter.';
                } elseif (str_contains($message, 'invalid') || str_contains($message, 'malformed')) {
                    $message = 'Token invalide. Veuillez vous reconnecter.';
                } elseif (str_contains($message, 'not provided')) {
                    $message = 'Token manquant.';
                }

                return response()->json(['message' => $message], 401);
            }
        });

        // 404 : ressource non trouvée (ex. formation inexistante)
        $exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Ressource introuvable'], 404);
            }
        });

        $exceptions->renderable(function (HttpException $e, Request $request) {
            if ($request->is('api/*') && $e->getStatusCode() >= 500) {
                return response()->json([
                    'message' => 'Erreur serveur. Veuillez réessayer plus tard.',
                ], $e->getStatusCode());
            }
        });

        $exceptions->renderable(function (\Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                if ($e instanceof \Tymon\JWTAuth\Exceptions\JWTException) {
                    $message = str_contains(strtolower($e->getMessage()), 'not provided')
                        ? 'Token manquant.'
                        : 'Token invalide ou expiré. Veuillez vous reconnecter.';

                    return response()->json(['message' => $message], 401);
                }
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

                return response()->json([
                    'message' => config('app.debug') ? $e->getMessage() : 'Une erreur inattendue est survenue.',
                ], $status);
            }
        });
    })->create();
