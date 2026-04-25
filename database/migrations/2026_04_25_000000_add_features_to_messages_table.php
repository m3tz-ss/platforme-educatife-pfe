<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('attachment')->nullable();
            $table->string('attachment_name')->nullable();
            $table->boolean('is_edited')->default(false);
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down()
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['attachment', 'attachment_name', 'is_edited', 'is_deleted']);
        });
    }
};
