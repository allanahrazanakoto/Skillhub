<?php

namespace Tests\Feature;

use App\Models\CategorieFormation;
use App\Models\Formation;
use App\Models\Inscription;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests fonctionnels du endpoint GET /api/formations/{id}/apprenants.
 *
 * Cette suite verifie les 4 cas demandes dans le sujet :
 * - acces du formateur proprietaire
 * - refus pour un autre formateur
 * - tableau vide si aucun apprenant
 * - refus sans token
 */
class FormationApprenantListTest extends TestCase
{
    use RefreshDatabase;

    /** Formateur proprietaire de la formation testee. */
    private Utilisateur $owner;

    /** Formateur non proprietaire utilise pour le test de refus d'acces. */
    private Utilisateur $otherOwner;

    /** Formation cible du nouvel endpoint. */
    private Formation $formation;

    /**
     * Prepare les donnees communes aux tests de liste des apprenants.
     */
    protected function setUp(): void
    {
        /**
         * On lance d'abord la preparation standard du framework de test.
         */
        parent::setUp();

        /**
         * Une categorie est necessaire pour pouvoir creer une formation valide.
         */
        $categorie = CategorieFormation::factory()->create();

        /**
         * Ce formateur sera le proprietaire legitime de la formation.
         */
        $this->owner = Utilisateur::factory()->formateur()->create();

        /**
         * Ce deuxieme formateur servira a verifier le cas 403 non proprietaire.
         */
        $this->otherOwner = Utilisateur::factory()->formateur()->create();

        /**
         * On cree la formation cible rattachee explicitement au formateur proprietaire.
         */
        $this->formation = Formation::factory()->create([
            'id_formateur' => $this->owner->id,
            'id_categorie' => $categorie->id,
        ]);
    }

    /**
     * Genere un token JWT Laravel local pour le formateur fourni.
     */
    private function tokenFor(Utilisateur $user): string
    {
        /**
         * En environnement de test, JWTAuth genere un token local pour simuler
         * un utilisateur authentifie sans appeler le service Spring Boot.
         */
        return auth('api')->login($user);
    }

    /**
     * Verifie que le formateur proprietaire obtient la liste des apprenants.
     */
    public function test_owner_formateur_gets_learners_list(): void
    {
        /**
         * On cree un premier apprenant avec des donnees faciles a reconnaitre
         * dans la reponse JSON.
         */
        $apprenantA = Utilisateur::factory()->participant()->create([
            'nom' => 'Alice',
            'email' => 'alice@example.com',
        ]);

        /**
         * On cree un second apprenant pour verifier le retour d'un tableau a plusieurs lignes.
         */
        $apprenantB = Utilisateur::factory()->participant()->create([
            'nom' => 'Bob',
            'email' => 'bob@example.com',
        ]);

        /**
         * On inscrit le premier apprenant avec une progression partielle.
         */
        Inscription::create([
            'utilisateur_id' => $apprenantA->id,
            'formation_id' => $this->formation->id,
            'progression' => 25,
        ]);

        /**
         * On inscrit le second apprenant avec une autre progression pour verifier
         * que la valeur remontee vient bien de la table inscriptions.
         */
        Inscription::create([
            'utilisateur_id' => $apprenantB->id,
            'formation_id' => $this->formation->id,
            'progression' => 80,
        ]);

        /**
         * Le proprietaire doit obtenir 200 et une structure de tableau conforme au sujet.
         */
        $this->withHeader('Authorization', 'Bearer ' . $this->tokenFor($this->owner))
            ->getJson('/api/formations/' . $this->formation->id . '/apprenants')
            ->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonStructure([
                ['id', 'nom', 'email', 'progression', 'date_inscription'],
            ]);
    }

    /**
     * Verifie qu'un formateur non proprietaire recoit bien une reponse 403.
     */
    public function test_non_owner_formateur_gets_403(): void
    {
        /**
         * Un autre formateur authentifie ne doit pas acceder a la liste des inscrits.
         */
        $this->withHeader('Authorization', 'Bearer ' . $this->tokenFor($this->otherOwner))
            ->getJson('/api/formations/' . $this->formation->id . '/apprenants')
            ->assertStatus(403);
    }

    /**
     * Verifie qu'une formation sans apprenants renvoie un tableau vide.
     */
    public function test_empty_learners_list_returns_empty_array(): void
    {
        /**
         * Aucune inscription n'est creee ici : la reponse attendue est donc un tableau vide.
         */
        $this->withHeader('Authorization', 'Bearer ' . $this->tokenFor($this->owner))
            ->getJson('/api/formations/' . $this->formation->id . '/apprenants')
            ->assertStatus(200)
            ->assertExactJson([]);
    }

    /**
     * Verifie que le middleware d'authentification bloque une requete sans token.
     */
    public function test_request_without_token_returns_401(): void
    {
        /**
         * Sans token JWT, le middleware auth.token doit interrompre l'acces.
         */
        $this->getJson('/api/formations/' . $this->formation->id . '/apprenants')
            ->assertStatus(401);
    }
}