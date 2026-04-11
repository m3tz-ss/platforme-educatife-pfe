<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Ajout de la colonne skills si elle n'existe pas
            if (!Schema::hasColumn('users', 'skills')) {
                $table->jsonb('skills')->nullable()->default(null);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'skills')) {
                $table->dropColumn('skills');
            }
        });
    }
};
