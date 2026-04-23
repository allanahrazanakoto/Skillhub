<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Utilisateur;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de validation du token d'authentification.
 */
class ValidateAuthToken
{
    private string $authServiceUrl;

    public function __construct()
    {
        $this->authServiceUrl = env('AUTH_SERVICE_URL', 'http://auth:8080');
    }

    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (! $authHeader || ! str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'message' => 'Token manquant. Veuillez vous connecter.',
            ], 401);
        }

        $token = substr($authHeader, 7);

        try {
            $response = Http::timeout(5)
                ->get("{$this->authServiceUrl}/api/auth/validate", [
                    'token' => $token,
                ]);

            $data = $response->json();

            if (! ($data['valid'] ?? false)) {
                return response()->json([
                    'message' => 'Token invalide ou expiré. Veuillez vous reconnecter.',
                ], 401);
            }

            $request->merge([
                'authUser' => [
                    'email'  => $data['email']  ?? null,
                    'role'   => $data['role']   ?? 'participant',
                    'nom'    => $data['nom']    ?? '',
                    'prenom' => $data['prenom'] ?? '',
                ],
            ]);

            $email = $data['email'] ?? null;
            if ($email) {
                $utilisateur = Utilisateur::firstOrCreate(
                    ['email' => $email],
                    [
                        'nom'          => $data['nom']    ?? '',
                        'prenom'       => $data['prenom'] ?? '',
                        'role'         => $data['role']   ?? 'participant',
                        'mot_de_passe' => bcrypt(\Illuminate\Support\Str::random(32)),
                    ]
                );
                Auth::setUser($utilisateur);
            }

            return $next($request);

        } catch (\Exception $e) {
            Log::error('Auth service error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Service d\'authentification indisponible. Réessayez dans quelques secondes.',
            ], 503);
        }
    }
}
