<?php

namespace Tests\Feature;

use App\Models\Formation;
use App\Models\Inscription;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InscriptionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_apprenant_ne_peut_pas_etre_inscrit_a_plus_de_5_formations()
    {
        // Création d'un utilisateur apprenant
        $apprenant = Utilisateur::factory()->create([
            'role' => 'participant',
        ]);

        // Création de 6 formations
        $formations = Formation::factory()->count(6)->create();

        // Inscrire l'apprenant aux 5 premières formations
        foreach ($formations->take(5) as $formation) {
            Inscription::create([
                'utilisateur_id' => $apprenant->id,
                'formation_id' => $formation->id,
                'progression' => 0,
            ]);
        }


        // Générer un token JWT pour l'utilisateur
        $token = auth('api')->login($apprenant);

        // Tenter une inscription à la 6e formation avec le header Authorization
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/formations/{$formations[5]->id}/inscription");

        // Vérifier la réponse HTTP 400 et le message
        $response->assertStatus(400)
            ->assertJson([
                'message' => 'Un apprenant ne peut pas être inscrit à plus de 5 formations simultanément.'
            ]);
    }
}
