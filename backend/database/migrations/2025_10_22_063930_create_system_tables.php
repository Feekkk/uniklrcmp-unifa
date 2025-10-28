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
        // Notifications table
        Schema::create('notifications', function (Blueprint $table) {
            $table->string('notificationId')->primary();
            $table->unsignedBigInteger('userId');
            $table->string('applicationId');
            $table->string('title');
            $table->text('message');
            $table->string('type');
            $table->boolean('isRead')->default(false);
            $table->timestamp('createdAt');
            $table->timestamp('readAt')->nullable();

            $table->foreign('userId')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('applicationId')->references('applicationId')->on('applications')->onDelete('cascade');
        });

        // Cache table
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        // Cache locks table
        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });
    }
};