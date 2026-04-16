<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_progressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->foreignId('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->boolean('est_fait')->default(false);
            $table->timestamps();
            $table->unique(['module_id', 'utilisateur_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_progressions');
    }
};
