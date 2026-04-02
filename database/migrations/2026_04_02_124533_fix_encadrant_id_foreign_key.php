<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vérifier si la colonne encadrant_id existe déjà
        if (Schema::hasColumn('applications', 'encadrant_id')) {
            // Supprimer la clé étrangère existante (si elle existe)
            Schema::table('applications', function (Blueprint $table) {
                try {
                    $table->dropForeign(['encadrant_id']);
                } catch (\Exception $e) {
                    // La clé n'existe peut-être pas
                }
            });

            // Recréer la clé étrangère correctement
            Schema::table('applications', function (Blueprint $table) {
                $table->foreign('encadrant_id')
                      ->references('id')
                      ->on('users')
                      ->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            try {
                $table->dropForeign(['encadrant_id']);
            } catch (\Exception $e) {
                // Ignorer les erreurs
            }
        });
    }
};