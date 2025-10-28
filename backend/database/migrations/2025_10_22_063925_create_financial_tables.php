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
        // Welfare fund transactions table
        Schema::create('welfare_fund_transactions', function (Blueprint $table) {
            $table->string('transactionId')->primary();
            $table->enum('type', ['inflow', 'outflow']); 
            $table->decimal('amount', 15, 2);
            $table->string('category'); 
            $table->string('description');
            $table->string('receipt_number')->nullable();
            $table->string('processed_by')->nullable(); 
            $table->string('application_id')->nullable();
            $table->decimal('balance_after', 15, 2); 
            $table->text('remarks')->nullable(); 
            $table->json('metadata')->nullable(); 
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['type', 'created_at']);
            $table->index(['category', 'created_at']);
            $table->index('application_id');
            $table->index('processed_by');
        });

        // Welfare fund balance table
        Schema::create('welfare_fund_balance', function (Blueprint $table) {
            $table->id();
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->timestamp('last_updated')->nullable();
            $table->string('last_updated_by')->nullable();
            $table->timestamps();
        });

        // Receipts table
        Schema::create('receipts', function (Blueprint $table) {
            $table->string('receiptId')->primary();
            $table->string('applicationId');
            $table->unsignedBigInteger('uploadedBy');
            $table->string('fileName');
            $table->string('originalFileName');
            $table->string('filePath');
            $table->string('fileType');
            $table->decimal('fileSize', 10, 2);
            $table->timestamp('uploadedAt');
            $table->string('description')->nullable();
            $table->string('status')->default('active');

            $table->foreign('applicationId')->references('applicationId')->on('applications')->onDelete('cascade');
            $table->foreign('uploadedBy')->references('id')->on('admins');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
        Schema::dropIfExists('welfare_fund_balance');
        Schema::dropIfExists('welfare_fund_transactions');
    }
};