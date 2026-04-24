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
    private const MSG_TOKEN_MANQUANT = 'Token manquant. Veuillez vous connecter.';
    private const MSG_TOKEN_INVALIDE = 'Token invalide.';
    private const MSG_TOKEN_EXPIRE = 'Token invalide ou expiré. Veuillez vous reconnecter.';
    private const MSG_SERVICE_INDISPONIBLE = "Service d'authentification indisponible. Réessayez dans quelques secondes.";
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
                'message' => self::MSG_TOKEN_MANQUANT,
            ], 401);
        }

        $token = substr($authHeader, 7);

        // En environnement de test, on utilise JWT local (Spring Boot non disponible)
        if (app()->environment('testing')) {
            try {
                $user = auth('api')->setToken($token)->user();
                if ($user) {
                    Auth::setUser($user);
                    $request->merge(['authUser' => [
                        'email'  => $user->email,
                        'role'   => $user->role,
                        'nom'    => $user->nom ?? '',
                        'prenom' => $user->prenom ?? '',
                    ]]);
                    return $next($request);
                }
            } catch (\Exception $e) {}
            return response()->json(['message' => self::MSG_TOKEN_INVALIDE], 401);
        }

        try {
            $response = Http::timeout(5)
                ->get("{$this->authServiceUrl}/api/auth/validate", [
                    'token' => $token,
                ]);

            $data = $response->json();

            if (! ($data['valid'] ?? false)) {
                return response()->json([
                    'message' => self::MSG_TOKEN_EXPIRE,
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
                'message' => self::MSG_SERVICE_INDISPONIBLE,
            ], 503);
        }
    }
}
