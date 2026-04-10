<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('encadrant_comments', function (Blueprint $table) {
        $table->string('attachment')->nullable()->after('body');
    });
}

public function down()
{
    Schema::table('encadrant_comments', function (Blueprint $table) {
        $table->dropColumn('attachment');
    });
}
};
