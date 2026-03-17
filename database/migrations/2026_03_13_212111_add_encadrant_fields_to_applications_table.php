<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            // ✅ Ajouter cv si pas encore présent
            if (!Schema::hasColumn('applications', 'cv')) {
                $table->string('cv')->nullable()->after('offer_id');
            }

            // ✅ Encadrant lié à la candidature
            if (!Schema::hasColumn('applications', 'encadrant_id')) {
                $table->foreignId('encadrant_id')
                      ->nullable()
                      ->after('status')
                      ->constrained('users')
                      ->onDelete('set null');
            }

            // ✅ Progression du stage (0 - 100%)
            if (!Schema::hasColumn('applications', 'progress')) {
                $table->integer('progress')->default(0)->after('encadrant_id');
            }

            // ✅ Date de début du stage
            if (!Schema::hasColumn('applications', 'start_date')) {
                $table->date('start_date')->nullable()->after('progress');
            }

            // ✅ Date de fin du stage
            if (!Schema::hasColumn('applications', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['encadrant_id']);
            $table->dropColumn(['encadrant_id', 'progress', 'start_date', 'end_date']);

            if (Schema::hasColumn('applications', 'cv')) {
                $table->dropColumn('cv');
            }
        });
    }
};