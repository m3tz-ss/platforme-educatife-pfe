<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encadrant_task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('encadrant_task_id')->constrained('encadrant_tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index(['encadrant_task_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encadrant_task_comments');
    }
};
