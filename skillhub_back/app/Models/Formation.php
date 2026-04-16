<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modèle Formation : une formation a un formateur (utilisateur) et une catégorie.
 * En BDD : nom, description, duree_heures, prix, level, statut, image_url.
 */
class Formation extends Model
{
    use HasFactory;

    protected $table = 'formations';

    protected $fillable = [
        'id_formateur',
        'id_categorie',
        'nom',
        'description',
        'duree_heures',
        'prix',
        'level',
        'statut',
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'duree_heures' => 'decimal:2',
            'prix' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (Formation $formation): void {
            // Garde-fou applicatif : supprime les modules meme si la contrainte SQL de cascade n'existe pas.
            $formation->modules()->delete();
        });
    }

    /**
     * En BDD : chemin relatif (/storage/formations/…). En JSON API : URL absolue pour que le front (Vite, autre domaine) charge l’image sans deviner le port Laravel.
     * APP_URL dans .env doit correspondre à l’URL du serveur (ex. http://localhost:8000 avec php artisan serve).
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: function (?string $value) {
                if ($value === null || $value === '') {
                    return null;
                }
                if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
                    return $value;
                }
                $base = rtrim((string) config('app.url'), '/');

                return $base !== '' ? $base.$value : $value;
            },
        );
    }

    /** Relation : une formation appartient à un utilisateur (formateur) */
    public function formateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_formateur');
    }

    /** Relation : une formation appartient à une catégorie (domaine) */
    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieFormation::class, 'id_categorie');
    }

    /** Relation : inscriptions des apprenants à cette formation */
    public function inscriptions(): HasMany
    {
        return $this->hasMany(Inscription::class);
    }

    /** Relation : modules (chapitres) de la formation */
    public function modules(): HasMany
    {
        return $this->hasMany(FormationModule::class, 'formation_id')->orderBy('ordre');
    }
}
