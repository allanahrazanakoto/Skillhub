<?php

namespace Tests\Feature;

use App\Models\CategorieFormation;
use App\Models\Formation;
use App\Models\Inscription;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormationRatingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Apprenant utilisé dans la majorité des scénarios de test.
     */
    private Utilisateur $apprenant;
    /**
     * Formation cible sur laquelle les avis sont déposés.
     */
    private Formation $formation;

    /**
     * Prépare les données communes à tous les tests de notation.
     *
     * On crée une catégorie, un formateur, un apprenant et une formation pour
     * reproduire un scénario réaliste proche de l'application réelle.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $categorie = CategorieFormation::factory()->create();
        $formateur = Utilisateur::factory()->formateur()->create();

        $this->apprenant = Utilisateur::factory()->participant()->create();
        $this->formation = Formation::factory()->create([
            'id_formateur' => $formateur->id,
            'id_categorie' => $categorie->id,
        ]);
    }

    /**
     * Génère un JWT Laravel local pour simuler un apprenant authentifié.
     */
    private function getApprenantToken(): string
    {
        return auth('api')->login($this->apprenant);
    }

    /**
     * Vérifie qu'un apprenant inscrit peut noter correctement une formation.
     *
     * Le test confirme à la fois le code HTTP 201 et l'écriture en base.
     */
    public function test_enrolled_apprenant_can_submit_valid_rating(): void
    {
        Inscription::create([
            'utilisateur_id' => $this->apprenant->id,
            'formation_id' => $this->formation->id,
            'progression' => 0,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->getApprenantToken())
            ->postJson('/api/formations/' . $this->formation->id . '/noter', [
                'note' => 4,
                'commentaire' => 'Très bonne formation',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('rating.note', 4)
            ->assertJsonPath('rating.commentaire', 'Très bonne formation')
            ->assertJsonPath('rating.user_id', $this->apprenant->id)
            ->assertJsonPath('rating.formation_id', $this->formation->id);

        $this->assertDatabaseHas('ratings', [
            'user_id' => $this->apprenant->id,
            'formation_id' => $this->formation->id,
            'note' => 4,
            'commentaire' => 'Très bonne formation',
        ]);
    }

    /**
     * Vérifie qu'un même apprenant ne peut pas déposer deux avis sur la même formation.
     */
    public function test_same_apprenant_cannot_rate_twice(): void
    {
        Inscription::create([
            'utilisateur_id' => $this->apprenant->id,
            'formation_id' => $this->formation->id,
            'progression' => 0,
        ]);

        $token = $this->getApprenantToken();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/formations/' . $this->formation->id . '/noter', [
                'note' => 5,
                'commentaire' => 'Top',
            ])
            ->assertStatus(201);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/formations/' . $this->formation->id . '/noter', [
                'note' => 3,
                'commentaire' => 'Deuxième avis',
            ])
            ->assertStatus(400)
            ->assertJson(['message' => 'Vous avez déjà noté cette formation.']);
    }

    /**
     * Vérifie qu'une note hors intervalle 1..5 retourne bien une erreur 400.
     */
    public function test_rating_out_of_range_returns_400(): void
    {
        Inscription::create([
            'utilisateur_id' => $this->apprenant->id,
            'formation_id' => $this->formation->id,
            'progression' => 0,
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $this->getApprenantToken())
            ->postJson('/api/formations/' . $this->formation->id . '/noter', [
                'note' => 6,
                'commentaire' => 'Impossible',
            ])
            ->assertStatus(400);
    }

    /**
     * Vérifie qu'un apprenant non inscrit reçoit bien une réponse 403.
     */
    public function test_non_enrolled_apprenant_gets_403(): void
    {
        $this->withHeader('Authorization', 'Bearer ' . $this->getApprenantToken())
            ->postJson('/api/formations/' . $this->formation->id . '/noter', [
                'note' => 4,
                'commentaire' => 'Je ne suis pas inscrit',
            ])
            ->assertStatus(403)
            ->assertJson(['message' => 'Vous devez être inscrit à la formation pour la noter.']);
    }

    /**
     * Vérifie qu'une requête sans token est bloquée par le middleware d'authentification.
     */
    public function test_missing_token_returns_401(): void
    {
        $this->postJson('/api/formations/' . $this->formation->id . '/noter', [
            'note' => 4,
            'commentaire' => 'Sans token',
        ])->assertStatus(401);
    }

    /**
     * Vérifie que le détail d'une formation expose bien la moyenne des notes
     * et le nombre total d'avis dans la réponse API.
     */
    public function test_show_formation_includes_rating_average_and_count(): void
    {
        Inscription::create([
            'utilisateur_id' => $this->apprenant->id,
            'formation_id' => $this->formation->id,
            'progression' => 0,
        ]);

        $otherLearner = Utilisateur::factory()->participant()->create();
        Inscription::create([
            'utilisateur_id' => $otherLearner->id,
            'formation_id' => $this->formation->id,
            'progression' => 0,
        ]);

        $this->formation->ratings()->create([
            'user_id' => $this->apprenant->id,
            'note' => 4,
            'commentaire' => 'Très bonne formation',
        ]);

        $this->formation->ratings()->create([
            'user_id' => $otherLearner->id,
            'note' => 5,
            'commentaire' => 'Excellent contenu',
        ]);

        $this->getJson('/api/formations/' . $this->formation->id)
            ->assertStatus(200)
            ->assertJsonPath('formation.nombre_avis', 2)
            ->assertJsonPath('formation.note_moyenne', 4.5);
    }
}