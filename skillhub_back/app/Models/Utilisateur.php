<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

/**
 * Modèle Utilisateur pour l'auth JWT. La table s'appelle "utilisateurs", le champ mot de passe "mot_de_passe".
 * getAuthPassword() dit à Laravel d'utiliser mot_de_passe pour vérifier le password. getJWTIdentifier et getJWTCustomClaims pour le token.
 */
class Utilisateur extends Authenticatable implements JWTSubject
{
    use HasFactory;

    protected $table = 'utilisateurs';

    /** Champs assignables en masse (inscription, etc.) */
    protected $fillable = [
        'email',
        'mot_de_passe',
        'nom',
        'prenom',
        'role',
    ];

    /** Ne pas exposer le mot de passe dans les réponses JSON */
    protected $hidden = [
        'mot_de_passe',
    ];

    protected function casts(): array
    {
        return [
            'mot_de_passe' => 'hashed',
        ];
    }

    /** Identifiant inclus dans le token JWT (id utilisateur) */
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /** Données additionnelles dans le payload du token (email, role) */
    public function getJWTCustomClaims(): array
    {
        return [
            'email' => $this->email,
            'role' => $this->role,
        ];
    }

    /** Indique à Laravel/JWT d'utiliser la colonne "mot_de_passe" pour l'authentification */
    public function getAuthPassword()
    {
        return $this->mot_de_passe;
    }

    public function inscriptions(): HasMany
    {
        return $this->hasMany(Inscription::class);
    }

    /**
     * Relation vers les notes laissées par cet utilisateur.
     *
     * Elle est utilisée quand l'utilisateur joue le rôle d'apprenant et dépose
     * un avis sur une formation suivie.
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class, 'user_id');
    }

    public function isFormateur(): bool
    {
        return $this->role === 'formateur';
    }

    public function isApprenant(): bool
    {
        return $this->role === 'participant';
    }
}
