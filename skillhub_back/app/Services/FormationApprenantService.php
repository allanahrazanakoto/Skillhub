<?php

namespace App\Services;

use App\Models\Formation;
use App\Models\Inscription;

/**
 * Service charge de construire la vue formateur des apprenants inscrits.
 *
 * Il recupere les inscriptions d'une formation, charge les utilisateurs lies
 * puis retourne un tableau JSON simple adapte a l'endpoint
 * GET /api/formations/{id}/apprenants.
 */
class FormationApprenantService
{
    /**
     * Retourne les apprenants inscrits a une formation avec les champs attendus.
     *
     * Le tableau retourne est volontairement plat pour correspondre exactement
     * au sujet : id, nom, email, progression et date_inscription.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listForFormation(Formation $formation): array
    {
        /**
         * On lit les inscriptions de la formation en chargeant uniquement les
         * colonnes utiles de l'utilisateur pour limiter la charge de la requete.
         */
        return Inscription::query()
            /**
             * On filtre uniquement les inscriptions liees a la formation demandee.
             */
            ->where('formation_id', $formation->id)

            /**
             * On charge l'utilisateur associe a chaque inscription avec les seuls
             * champs utiles pour la vue formateur : id, nom et email.
             */
            ->with('utilisateur:id,nom,email')

            /**
             * On trie du plus recent au plus ancien pour afficher d'abord les
             * derniers apprenants inscrits.
             */
            ->orderByDesc('date_inscription')

            /**
             * On execute la requete SQL et on recupere une collection d'inscriptions.
             */
            ->get()

            /**
             * Chaque inscription est transformee en un tableau JSON simple
             * correspondant exactement a la structure demandee par le sujet.
             */
            ->map(function (Inscription $inscription): array {
                /**
                 * Chaque inscription est transformee en ligne de reponse pour la
                 * vue formateur. La progression et la date proviennent de
                 * l'inscription, tandis que l'identite provient de l'utilisateur.
                 */
                return [
                    /** Identifiant de l'apprenant inscrit. */
                    'id' => $inscription->utilisateur?->id,

                    /** Nom de l'apprenant. */
                    'nom' => $inscription->utilisateur?->nom,

                    /** Email de l'apprenant. */
                    'email' => $inscription->utilisateur?->email,

                    /** Progression actuelle de l'apprenant dans la formation. */
                    'progression' => (int) $inscription->progression,

                    /** Date a laquelle l'inscription a ete enregistree. */
                    'date_inscription' => $inscription->date_inscription?->toISOString(),
                ];
            })

            /**
             * On reindexe proprement le tableau a partir de 0.
             */
            ->values()

            /**
             * On convertit enfin la collection Laravel en tableau PHP pur pour
             * que le controleur puisse le retourner directement en JSON.
             */
            ->all();
    }
}