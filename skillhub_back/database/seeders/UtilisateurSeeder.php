<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Utilisateur;
use App\Models\Formation;

class UtilisateurSeeder extends Seeder
{
    /**
     * Seed des utilisateurs (formateurs et apprenants).
     */
    public function run(): void
    {
        Utilisateur::factory()->count(5)->formateur()->create();
        Utilisateur::factory()->count(10)->participant()->create();
    }
}
