<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Commun
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->text('bio')->nullable();
            $table->string('photo_path')->nullable();

            // Étudiant
            $table->string('school')->nullable();
            $table->string('field')->nullable();
            $table->integer('graduation_year')->nullable();
            $table->string('cv_path')->nullable();

            // Entreprise
            $table->string('position')->nullable();
            $table->string('department')->nullable();
            $table->string('company_name')->nullable();
            $table->text('company_description')->nullable();
            $table->string('company_website')->nullable();
            $table->string('logo_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'address', 'bio', 'photo_path',
                'school', 'field', 'graduation_year', 'cv_path',
                'position', 'department', 'company_name',
                'company_description', 'company_website', 'logo_path',
            ]);
        });
    }
};