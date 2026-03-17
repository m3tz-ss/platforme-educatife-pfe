<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('offers', function (Blueprint $table) {
        $table->string('domain')->nullable();
        $table->date('startDate')->nullable();
        $table->integer('availablePlaces')->nullable();
        $table->text('requirements')->nullable();
        $table->text('advantages')->nullable();
    });

    // Valeurs par défaut pour les anciennes lignes
    DB::table('offers')->whereNull('domain')->update([
        'domain' => 'Informatique',
        'startDate' => now(),
        'availablePlaces' => 1,
        'requirements' => 'À définir',
    ]);

    // Rendre les champs obligatoires
    Schema::table('offers', function (Blueprint $table) {
        $table->string('domain')->nullable(false)->change();
        $table->date('startDate')->nullable(false)->change();
        $table->integer('availablePlaces')->nullable(false)->change();
        $table->text('requirements')->nullable(false)->change();
    });
}
};