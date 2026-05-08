<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crée la table ratings utilisée pour stocker les avis des apprenants.
     *
     * La structure suit exactement l'énoncé : utilisateur, formation, note,
     * commentaire et date de création.
     */
    public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();

            /**
             * L'avis appartient à un utilisateur authentifié.
             * La clé étrangère pointe sur la table utilisateurs.
             */
            $table->foreignId('user_id')->constrained('utilisateurs')->cascadeOnDelete();

            /**
             * L'avis vise une formation précise du catalogue.
             * Si la formation est supprimée, ses avis le sont aussi.
             */
            $table->foreignId('formation_id')->constrained('formations')->cascadeOnDelete();

            /**
             * Note chiffrée entre 1 et 5.
             * L'intervalle exact est contrôlé dans le contrôleur via la validation.
             */
            $table->unsignedTinyInteger('note');

            /**
             * Commentaire libre laissé par l'apprenant pour compléter la note.
             */
            $table->text('commentaire');

            /**
             * Date de création de l'avis, suffisante pour ce sujet.
             */
            $table->timestamp('created_at')->useCurrent();

            /**
             * Contrainte d'unicité métier : un même apprenant ne peut noter
             * qu'une seule fois une même formation.
             */
            $table->unique(['user_id', 'formation_id']);
        });
    }

    /**
     * Supprime la table ratings lors d'un rollback.
     */
    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};