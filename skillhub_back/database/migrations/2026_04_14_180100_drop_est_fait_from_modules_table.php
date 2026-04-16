<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('modules', 'est_fait')) {
            Schema::table('modules', function (Blueprint $table) {
                $table->dropColumn('est_fait');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('modules', 'est_fait')) {
            Schema::table('modules', function (Blueprint $table) {
                $table->boolean('est_fait')->default(false)->after('ordre');
            });
        }
    }
};
