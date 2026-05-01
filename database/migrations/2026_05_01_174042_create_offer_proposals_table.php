<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offer_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained('offers')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('rh_id')->constrained('users')->cascadeOnDelete();
            $table->text('personal_message')->nullable();
            // pending | accepted | refused
            $table->string('status')->default('pending');
            $table->timestamps();

            // Un RH ne peut proposer la même offre qu'une fois au même étudiant
            $table->unique(['offer_id', 'student_id', 'rh_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_proposals');
    }
};
