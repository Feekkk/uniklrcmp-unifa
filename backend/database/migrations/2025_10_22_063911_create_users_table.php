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
        // Main users table (consolidated from users, admins, committees)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('fullName');
            $table->string('email')->unique();
            $table->string('program')->nullable();
            $table->integer('semester')->nullable();
            $table->string('phoneNo')->nullable();
            $table->string('icNo')->nullable();
            $table->text('address')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('user'); 
            $table->string('bankName')->nullable();
            $table->string('bankAccount')->nullable();
            $table->string('profile_picture')->nullable();
            $table->timestamps();
        });

        // Separate admins table (for admin-specific data)
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamps();
        });

        // Separate committees table (for committee-specific data)
        Schema::create('committees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('committees');
        Schema::dropIfExists('admins');
        Schema::dropIfExists('users');
    }
};