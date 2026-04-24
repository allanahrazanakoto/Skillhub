<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Formation;

class FormationSeeder extends Seeder
{
    /**
     * Seed des formations.
     */
    public function run(): void
    {
        Formation::factory()->count(10)->create();
    }
}
