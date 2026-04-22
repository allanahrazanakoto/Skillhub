<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder principal : crée des données de test si nécessaire.
 * Le projet utilise le modèle Utilisateur (table utilisateurs), pas User.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CategorieFormationSeeder::class,
        ]);
    }
}
