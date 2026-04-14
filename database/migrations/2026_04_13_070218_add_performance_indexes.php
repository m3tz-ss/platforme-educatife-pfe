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
            $table->index('student_id');
            $table->index('offer_id');
            $table->index('encadrant_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('manager_id');
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->index('enterprise_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropIndex(['student_id']);
            $table->dropIndex(['offer_id']);
            $table->dropIndex(['encadrant_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['manager_id']);
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->dropIndex(['enterprise_id']);
        });
    }
};
