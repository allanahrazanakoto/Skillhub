<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle Rating : représente l'avis laissé par un apprenant sur une formation.
 *
 * Un rating contient une note chiffrée de 1 à 5, un commentaire libre et la date
 * de création. La contrainte d'unicité user_id + formation_id garantit qu'un
 * apprenant ne note qu'une seule fois la même formation.
 */
class Rating extends Model
{
    use HasFactory;

    /**
     * La table des ratings ne conserve qu'une date de création.
     *
     * Un avis n'est pas prévu pour être modifié dans ce sujet, donc la colonne
     * updated_at n'est pas nécessaire.
     */
    public const UPDATED_AT = null;

    /** Nom réel de la table SQL utilisée pour stocker les avis. */
    protected $table = 'ratings';

    /**
     * Champs autorisés en assignation de masse.
     *
     * Le contrôleur de notation utilise ces colonnes pour créer directement
     * un avis valide après contrôle métier.
     */
    protected $fillable = [
        'user_id',
        'formation_id',
        'note',
        'commentaire',
    ];

    /**
     * Casts utilisés pour renvoyer des types cohérents dans l'API.
     *
     * Cela évite d'exposer des entiers ou dates au mauvais format dans les tests
     * et dans les réponses JSON.
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'formation_id' => 'integer',
            'note' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Relation inverse vers l'apprenant auteur de l'avis.
     *
     * Chaque rating appartient à un seul utilisateur identifié par user_id.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    /**
     * Relation inverse vers la formation notée.
     *
     * Chaque rating appartient à une seule formation identifiée par formation_id.
     */
    public function formation(): BelongsTo
    {
        return $this->belongsTo(Formation::class);
    }
}