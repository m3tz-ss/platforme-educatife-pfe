<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();

            //  Lien avec la candidature
            $table->foreignId('application_id')
                  ->constrained()
                  ->onDelete('cascade');

            //  Planification
            $table->date('date');
            $table->time('time');

            //  Présentiel ou visio
            $table->string('location')->nullable();
            $table->string('meeting_link')->nullable();

            //  Suivi
            $table->enum('status', ['planned', 'done'])->default('planned');
            $table->enum('result', ['accepted', 'rejected', 'pending'])->nullable();

            //  Commentaire RH
            $table->text('comment')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};