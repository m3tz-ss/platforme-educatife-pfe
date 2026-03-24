<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encadrant_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->foreignId('encadrant_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('score', 4, 1)->nullable(); // 0–20
            $table->string('final_decision')->default('pending'); // valide, a_ameliorer, non_conforme, pending
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['application_id', 'encadrant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encadrant_evaluations');
    }
};
