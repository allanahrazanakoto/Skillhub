<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Routes réservées aux utilisateurs avec le rôle participant (apprenant).
 */
class VerifierApprenant
{
    public function handle(Request $request, Closure $next): Response
    {
        // On lit le rôle depuis authUser (mis par le middleware ValidateAuthToken)
        $authUser = $request->input('authUser');

        if (! $authUser || ($authUser['role'] ?? '') !== 'participant') {
            return response()->json([
                'message' => 'Réservé aux apprenants.',
            ], 403);
        }

        return $next($request);
    }
}
