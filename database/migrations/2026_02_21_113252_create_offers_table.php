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
        Schema::create('offers', function (Blueprint $table) {
            $table->string('title');
    $table->string('domain');
    $table->string('location');
    $table->string('duration');
    $table->date('startDate');
    $table->integer('availablePlaces');

    $table->text('description');
    $table->text('requirements');
    $table->text('advantages')->nullable();

            $table->foreignId('enterprise_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
