<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFormationRequest;
use App\Http\Requests\UpdateFormationRequest;
use App\Models\CategorieFormation;
use App\Models\Formation;
use App\Services\ActivityLogService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * CRUD des formations. Index = liste paginée avec meta (pour le front), show = détail.
 * Store : le front envoie title, description, price, duration, level (et optionnellement id_categorie, image).
 * On mappe title -> nom, duration -> duree_heures, price -> prix, et on prend id_formateur depuis l'utilisateur connecté.
 * Update : pareil, avec PUT en JSON ou POST en FormData si on envoie une nouvelle image.
 */
class FormationController extends Controller
{
    /**
     * Liste des formations (paginée, avec filtres optionnels).
     *
     * @OA\Get(path="/formations", tags={"Formations"}, summary="Liste des formations", security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id_formateur", in="query", description="Filtrer par formateur", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="id_categorie", in="query", description="Filtrer par catégorie", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="statut", in="query", description="Filtrer par statut", @OA\Schema(type="string", enum={"En Cours","Terminé"})),
     *     @OA\Parameter(name="page", in="query", description="Numéro de page (défaut: 1)", @OA\Schema(type="integer", default=1)),
     *     @OA\Parameter(name="per_page", in="query", description="Nombre par page (défaut: 15, max: 50)", @OA\Schema(type="integer", default=15)),
     *
     *     @OA\Response(response="200", description="Liste paginée des formations",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="formations", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="meta", type="object",
     *                 @OA\Property(property="current_page", type="integer", example=1),
     *                 @OA\Property(property="last_page", type="integer", example=5),
     *                 @OA\Property(property="per_page", type="integer", example=15),
     *                 @OA\Property(property="total", type="integer", example=73)
     *             )
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $query = Formation::with(['formateur:id,nom,prenom', 'categorie:id,libelle'])
            ->withCount('inscriptions');

        $user = auth()->user();
        if ($user && $user->role === 'formateur' && ! $request->has('id_formateur')) {
            $query->where('id_formateur', $user->id);
        }

        if ($request->filled('id_formateur')) {
            $query->where('id_formateur', $request->id_formateur);
        }
        if ($request->filled('id_categorie')) {
            $query->where('id_categorie', $request->id_categorie);
        }
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }
        if ($request->filled('recherche')) {
            $term = $request->recherche;
            $query->where(function ($q) use ($term) {
                $q->where('nom', 'like', '%'.$term.'%')
                    ->orWhere('description', 'like', '%'.$term.'%');
            });
        }

        $paginator = $query->orderBy('id', 'desc')->paginate(
            min((int) $request->input('per_page', 15), 50)
        );

        return response()->json([
            'formations' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Détail d'une formation (catalogue, page formation).
     */
    public function show(int $id): JsonResponse
    {
        $formation = Formation::with(['formateur:id,nom,prenom', 'categorie:id,libelle', 'modules'])
            ->withCount('inscriptions')
            ->find($id);

        if (! $formation) {
            return response()->json(['message' => 'Formation introuvable'], 404);
        }

        return response()->json(['formation' => $formation]);
    }

    /**
     * Créer une formation.
     * Payload : title, description, price, duration, level (obligatoires), id_categorie (optionnel), image (optionnel en multipart).
     * L'id_formateur est récupéré via l'utilisateur authentifié ; ne jamais l'envoyer depuis le front.
     *
     * @OA\Post(path="/formations", tags={"Formations"}, summary="Créer une formation", security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(required=true,
     *
     *         @OA\MediaType(mediaType="application/json",
     *
     *             @OA\Schema(required={"title","description","price","duration","level"},
     *
     *                 @OA\Property(property="title", type="string", maxLength=200, example="Introduction à React"),
     *                 @OA\Property(property="description", type="string", maxLength=2000, example="Apprenez les bases de React."),
     *                 @OA\Property(property="price", type="number", minimum=0, example=199.99),
     *                 @OA\Property(property="duration", type="number", minimum=0, example=24),
     *                 @OA\Property(property="level", type="string", enum={"beginner","intermediate","advanced"}, example="beginner"),
     *                 @OA\Property(property="id_categorie", type="integer", nullable=true, description="Optionnel ; si absent, première catégorie utilisée")
     *             )
     *         ),
     *
     *         @OA\MediaType(mediaType="multipart/form-data",
     *
     *             @OA\Schema(required={"title","description","price","duration","level"},
     *
     *                 @OA\Property(property="title", type="string", maxLength=200),
     *                 @OA\Property(property="description", type="string", maxLength=2000),
     *                 @OA\Property(property="price", type="number", minimum=0),
     *                 @OA\Property(property="duration", type="number", minimum=0),
     *                 @OA\Property(property="level", type="string", enum={"beginner","intermediate","advanced"}),
     *                 @OA\Property(property="id_categorie", type="integer", nullable=true),
     *                 @OA\Property(property="image", type="string", format="binary", description="Image optionnelle (jpeg, png, jpg, gif, webp, max 2 Mo)")
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(response="201", description="Formation créée avec succès"),
     *     @OA\Response(response="401", description="Token absent"),
     *     @OA\Response(response="403", description="Token invalide ou accès réservé aux formateurs"),
     *     @OA\Response(response="422", description="Erreur de validation")
     * )
     */
    public function store(StoreFormationRequest $request): JsonResponse
    {
        $data = $request->validated();
        // id_formateur vient toujours du user connecté, jamais du front
        $data['id_formateur'] = $request->user()->id;
        // Mapping des noms de champs front (title, duration, price) vers la BDD (nom, duree_heures, prix)
        $data['nom'] = $data['title'];
        $data['duree_heures'] = $data['duration'];
        $data['prix'] = $data['price'];
        $data['id_categorie'] = $data['id_categorie'] ?? CategorieFormation::first()?->id;
        if ($data['id_categorie'] === null) {
            return response()->json([
                'message' => 'Aucune catégorie disponible. Créez d\'abord une catégorie de formation.',
            ], 422);
        }
        $data['statut'] = 'En Cours';
        unset($data['title'], $data['duration'], $data['price'], $data['image']);

        // Upload image optionnel : stockage dans storage/app/public/formations avec nom UUID
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
            $path = $file->storeAs('formations', $filename, 'public');
            $data['image_url'] = '/storage/'.$path;
        }

        $formation = Formation::create($data);

        $formation->load(['formateur:id,nom,prenom', 'categorie:id,libelle']);

        app(ActivityLogService::class)->logCourseCreation($formation->id, (int) $request->user()->id);

        return response()->json([
            'message' => 'Formation créée avec succès',
            'formation' => $this->formationPourReponseApi($formation),
        ], 201);
    }

    /**
     * Modifier une formation (PUT JSON ou POST multipart si image).
     * Réponse alignée sur store : formation avec title, description, price, duration, level.
     *
     * @OA\Put(path="/formations/{id}", tags={"Formations"}, summary="Modifier une formation", security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *
     *     @OA\RequestBody(
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="id_categorie", type="integer"),
     *             @OA\Property(property="nom", type="string"),
     *             @OA\Property(property="description", type="string", maxLength=2000),
     *             @OA\Property(property="duree_heures", type="number"),
     *             @OA\Property(property="prix", type="number"),
     *             @OA\Property(property="level", type="string", enum={"beginner","intermediate","advanced"}),
     *             @OA\Property(property="statut", type="string", enum={"En Cours","Terminé"})
     *         )
     *     ),
     *
     *     @OA\Response(response="200", description="Formation mise à jour (réponse enrichie comme store)"),
     *     @OA\Response(response="403", description="Formation appartenant à un autre formateur"),
     *     @OA\Response(response="404", description="Formation introuvable"),
     *     @OA\Response(response="422", description="Erreur de validation")
     * )
     */
    public function update(UpdateFormationRequest $request, Formation $formation): JsonResponse
    {
        if ($formation->id_formateur !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Vous ne pouvez modifier que vos propres formations.',
            ], 403);
        }

        $oldValues = $formation->only(['nom', 'description', 'level', 'statut', 'duree_heures', 'prix']);

        try {
            $data = $request->validated();
            unset($data['image'], $data['image_url']);

            // Si nouvelle image : suppression de l'ancienne puis enregistrement de la nouvelle
            if ($request->hasFile('image')) {
                self::deleteStoredImageFile($formation->getRawOriginal('image_url'));

                $file = $request->file('image');
                $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
                $path = $file->storeAs('formations', $filename, 'public');
                $data['image_url'] = '/storage/'.$path;
            }

            $formation->update($data);
            $formation->load(['formateur:id,nom,prenom', 'categorie:id,libelle']);

            $newValues = $formation->only(['nom', 'description', 'level', 'statut', 'duree_heures', 'prix']);
            app(ActivityLogService::class)->logCourseUpdate(
                (int) $formation->id,
                (int) $request->user()->id,
                $oldValues,
                $newValues
            );

            return response()->json([
                'message' => 'Formation mise à jour',
                'formation' => $this->formationPourReponseApi($formation),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de la mise à jour.',
            ], 500);
        }
    }

    /**
     * Supprimer une formation.
     *
     * @OA\Delete(path="/formations/{id}", tags={"Formations"}, summary="Supprimer une formation", security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *
     *     @OA\Response(response="200", description="Formation supprimée"),
     *     @OA\Response(response="403", description="Formation appartenant à un autre formateur"),
     *     @OA\Response(response="404", description="Formation introuvable")
     * )
     */
    public function destroy(Formation $formation): JsonResponse
    {
        if ($formation->id_formateur !== (int) auth()->id()) {
            return response()->json([
                'message' => 'Vous ne pouvez supprimer que vos propres formations.',
            ], 403);
        }

        try {
            $formationId = $formation->id;
            $userId = (int) auth()->id();

            self::deleteStoredImageFile($formation->getRawOriginal('image_url'));

            $formation->delete();

            app(ActivityLogService::class)->logCourseDeletion($formationId, $userId);

            return response()->json(['message' => 'Formation supprimée']);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de la suppression.',
            ], 500);
        }
    }

    /**
     * Réponse JSON alignée avec le front : champs title, price, duration en plus des colonnes BDD.
     *
     * @return array<string, mixed>
     */
    private function formationPourReponseApi(Formation $formation): array
    {
        return array_merge($formation->toArray(), [
            'title' => $formation->nom,
            'description' => $formation->description,
            'price' => (float) $formation->prix,
            'duration' => (float) $formation->duree_heures,
            'level' => $formation->level,
        ]);
    }

    /** Supprime le fichier image sur le disque public (valeur telle qu’en BDD, pas l’URL JSON de l’accessor). */
    private static function deleteStoredImageFile(?string $rawImageUrlFromDb): void
    {
        $path = self::imageUrlToStoragePath($rawImageUrlFromDb);
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Convertit une image_url (ex: /storage/formations/xxx.jpg) en chemin de stockage (formations/xxx.jpg).
     */
    private static function imageUrlToStoragePath(?string $imageUrl): ?string
    {
        if (! $imageUrl) {
            return null;
        }
        if (str_starts_with($imageUrl, 'http://') || str_starts_with($imageUrl, 'https://')) {
            $path = parse_url($imageUrl, PHP_URL_PATH);
            $imageUrl = is_string($path) ? $path : '';
        }
        $imageUrl = ltrim($imageUrl, '/');
        if (str_starts_with($imageUrl, 'storage/')) {
            return substr($imageUrl, 8);
        }

        return $imageUrl;
    }
}
