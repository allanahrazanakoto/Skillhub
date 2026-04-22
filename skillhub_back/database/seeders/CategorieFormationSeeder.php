<?php

namespace Database\Seeders;

use App\Models\CategorieFormation;
use Illuminate\Database\Seeder;

class CategorieFormationSeeder extends Seeder
{
    /**
     * Seed des categories de formation (idempotent).
     */
    public function run(): void
    {
        $categories = [
            'Front-end',
            'Back-end',
            'Sécurité',
            'Data Science',
            'DevOps',
            'Mobile',
            'Langage',
            'Base de données',
            'Cloud',
            'Full Stack',
        ];

        foreach ($categories as $libelle) {
            CategorieFormation::updateOrCreate(
                ['libelle' => $libelle],
                ['libelle' => $libelle]
            );
        }
    }
}
