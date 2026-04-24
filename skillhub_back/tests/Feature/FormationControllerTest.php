    // Constantes pour éviter la duplication
    private const API_FORMATIONS = '/api/formations';
    private const FORMATION_PHP = 'Formation PHP';
    private const DESCRIPTION_FORMATION = 'Description de la formation';
    private const NOUVEAU_NOM = 'Nouveau nom';
    private const STATUT_TERMINE = 'Terminé';
<?php

namespace Tests\Feature;

use App\Models\CategorieFormation;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormationControllerTest extends TestCase
{
    use RefreshDatabase;

    private Utilisateur $formateur;

    protected function setUp(): void
    {
        parent::setUp();
        $this->formateur = Utilisateur::factory()->formateur()->create();
        CategorieFormation::factory()->create();
    }

    private function getAuthToken(): string
    {
        return auth('api')->login($this->formateur);
    }

    /**
     * Vérifie qu'une requête POST sans token retourne 401.
     */
    public function test_post_formation_without_token_returns_401(): void
    {
        $response = $this->postJson(self::API_FORMATIONS, [
            'title' => self::FORMATION_PHP,
            'description' => self::DESCRIPTION_FORMATION,
            'price' => 199.99,
            'duration' => 24,
            'level' => 'beginner',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Vérifie qu'une requête valide avec utilisateur connecté fonctionne correctement (201).
     */
    public function test_post_formation_with_valid_user_returns_201(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->getAuthToken())
            ->postJson(self::API_FORMATIONS, [
                'title' => self::FORMATION_PHP,
                'description' => self::DESCRIPTION_FORMATION,
                'price' => 199.99,
                'duration' => 24,
                'level' => 'beginner',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Formation créée avec succès',
                'formation' => [
                    'title' => self::FORMATION_PHP,
                    'description' => self::DESCRIPTION_FORMATION,
                    'price' => 199.99,
                    'duration' => 24,
                    'level' => 'beginner',
                ],
            ]);

        $this->assertDatabaseHas('formations', [
            'nom' => self::FORMATION_PHP,
            'id_formateur' => $this->formateur->id,
        ]);
    }

    /**
     * Un apprenant ne peut pas créer de formation (403).
     */
    public function test_apprenant_cannot_create_formation(): void
    {
        $apprenant = Utilisateur::factory()->participant()->create();
        $token = auth('api')->login($apprenant);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::API_FORMATIONS, [
                'title' => 'Ma formation',
                'description' => 'Description',
                'price' => 0,
                'duration' => 10,
                'level' => 'beginner',
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('formations', ['nom' => 'Ma formation']);
    }

    /**
     * Un formateur ne peut modifier que ses propres formations.
     */
    public function test_formateur_cannot_update_another_formateur_formation(): void
    {
        $autreFormateur = Utilisateur::factory()->formateur()->create();
        $categorie = CategorieFormation::first();
        $formation = \App\Models\Formation::factory()->create([
            'id_formateur' => $autreFormateur->id,
            'id_categorie' => $categorie->id,
        ]);
        $token = auth('api')->login($this->formateur);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson(self::API_FORMATIONS . '/' . $formation->id, [
                'nom' => 'Pirate',
                'description' => 'Modification non autorisée',
            ]);

        $response->assertStatus(403);
        $formation->refresh();
        $this->assertNotEquals('Pirate', $formation->nom);
    }

    public function test_post_formation_with_invalid_payload_returns_422(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->getAuthToken())
            ->postJson('/api/formations', [
                'title' => '',
                'description' => '',
                'price' => -5,
                'duration' => -1,
                'level' => 'expert',
            ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('formations', ['nom' => '']);
    }

    public function test_formateur_can_update_own_formation(): void
    {
        $categorie = CategorieFormation::first();
        $formation = \App\Models\Formation::factory()->create([
            'id_formateur' => $this->formateur->id,
            'id_categorie' => $categorie->id,
            'nom' => 'Ancien nom',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->getAuthToken())
            ->putJson(self::API_FORMATIONS . '/' . $formation->id, [
                'nom' => self::NOUVEAU_NOM,
                'description' => 'Description mise à jour',
                'prix' => 299.99,
                'duree_heures' => 18,
                'level' => 'advanced',
                'statut' => self::STATUT_TERMINE,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Formation mise à jour',
                'formation' => [
                    'title' => self::NOUVEAU_NOM,
                    'level' => 'advanced',
                    'statut' => self::STATUT_TERMINE,
                ],
            ]);

        $this->assertDatabaseHas('formations', [
            'id' => $formation->id,
            'nom' => self::NOUVEAU_NOM,
            'level' => 'advanced',
            'statut' => self::STATUT_TERMINE,
        ]);
    }
}
