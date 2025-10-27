<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Funding categories table
        Schema::create('funding_categories', function (Blueprint $table) {
            $table->string('categoryId')->primary();
            $table->string('categoryName')->unique();
            $table->string('description')->nullable();
            $table->decimal('maxAmount', 15, 2)->nullable(); 
            $table->string('eligibilityCriteria')->nullable();
            $table->string('status')->default('active');
            $table->boolean('requires_committee_approval')->default(false);
            $table->timestamps();
        });

        // Applications table (with all fields from multiple migrations)
        Schema::create('applications', function (Blueprint $table) {
            $table->string('applicationId')->primary();
            $table->unsignedBigInteger('userId');
            $table->string('categoryId');
            $table->string('formId');
            $table->json('formData');
            $table->decimal('amountRequested', 10, 2);
            $table->string('purpose');
            $table->string('justification');
            $table->string('applicationStatus')->default('SUBMITTED');
            $table->string('status')->nullable(); 
            $table->timestamp('submittedAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
            $table->unsignedBigInteger('adminId')->nullable();
            $table->unsignedBigInteger('committeeId')->nullable();
            $table->timestamp('adminReviewedAt')->nullable();
            $table->timestamp('committeeReviewedAt')->nullable();
            $table->string('adminComments')->nullable();
            $table->string('committeeComments')->nullable();
            $table->decimal('approvedAmount', 10, 2)->nullable();
            $table->decimal('suggestedAmount', 10, 2)->nullable();

            $table->string('fundCategory')->nullable();
            $table->string('fundSubCategory')->nullable();
            
            $table->string('bereavementType')->nullable();
            $table->string('deathCertificatePath')->nullable();
            
            $table->string('clinicName')->nullable();
            $table->text('reasonVisit')->nullable();
            $table->timestamp('visitDateTime')->nullable();
            $table->decimal('totalAmountOutpatient', 10, 2)->nullable();
            $table->string('receiptClinicPath')->nullable();
            
            $table->text('reasonVisitInpatient')->nullable();
            $table->date('checkInDate')->nullable();
            $table->date('checkOutDate')->nullable();
            $table->decimal('totalAmountInpatient', 10, 2)->nullable();
            $table->string('hospitalDocumentsPath')->nullable();
            
            $table->decimal('totalAmountInjuries', 10, 2)->nullable();
            $table->string('injuryDocumentsPath')->nullable();
            
            $table->decimal('totalAmountCriticalIllness', 10, 2)->nullable();
            $table->string('criticalIllnessDocumentsPath')->nullable();
            
            $table->text('naturalDisasterCase')->nullable();
            $table->decimal('totalAmountNaturalDisaster', 10, 2)->nullable();
            $table->string('naturalDisasterDocumentsPath')->nullable();
            
            $table->text('othersCase')->nullable();
            $table->decimal('totalAmountOthers', 10, 2)->nullable();
            $table->string('othersDocumentsPath')->nullable();
            
            $table->string('studentId')->nullable();
            $table->string('course')->nullable();
            $table->string('semester')->nullable();
            $table->string('contactNumber')->nullable();
            $table->string('emergencyContact')->nullable();

            // Foreign key constraints
            $table->foreign('userId')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('categoryId')->references('categoryId')->on('funding_categories');
            $table->foreign('adminId')->references('id')->on('admins');
            $table->foreign('committeeId')->references('id')->on('committees');
        });

        // Application documents table
        Schema::create('application_documents', function (Blueprint $table) {
            $table->string('documentId')->primary();
            $table->string('applicationId');
            $table->unsignedBigInteger('uploadedBy');
            $table->string('fileName');
            $table->string('filePath');
            $table->string('fileType');
            $table->decimal('fileSize', 10, 2);
            $table->string('documentType');
            $table->timestamp('uploadedAt');
            $table->string('description')->nullable();
            $table->string('status')->default('active');

            $table->foreign('applicationId')->references('applicationId')->on('applications')->onDelete('cascade');
            $table->foreign('uploadedBy')->references('id')->on('users');
        });

        // Approval workflow table
        Schema::create('approval_workflows', function (Blueprint $table) {
            $table->string('workflowId')->primary();
            $table->string('applicationId');
            $table->string('approverType');
            $table->unsignedBigInteger('approverId');
            $table->string('previousStatus');
            $table->string('newStatus');
            $table->string('comments')->nullable();
            $table->timestamp('reviewedAt');
            $table->string('decision');

            $table->foreign('applicationId')->references('applicationId')->on('applications')->onDelete('cascade');
        });

        // Application status logs table
        Schema::create('application_status_logs', function (Blueprint $table) {
            $table->string('logId')->primary();
            $table->string('applicationId');
            $table->string('previousStatus');
            $table->string('newStatus');
            $table->unsignedBigInteger('changedBy');
            $table->timestamp('changedAt');
            $table->string('remarks')->nullable();

            $table->foreign('applicationId')->references('applicationId')->on('applications')->onDelete('cascade');
        });

        // Insert funding categories with all the data from organize_funding_categories migration
        $categories = [
            // Illness & Injuries Categories
            'CAT-ILLNESS' => [
                [
                    'categoryId' => 'CAT-ILLNESS-INPATIENT',
                    'categoryName' => 'Medical Treatment (Inpatient)',
                    'description' => 'For students requiring inpatient medical treatment',
                    'maxAmount' => 10000.00, 
                    'eligibilityCriteria' => 'Must provide hospital admission documents',
                    'status' => 'active',
                    'requires_committee_approval' => true
                ],
                [
                    'categoryId' => 'CAT-ILLNESS-OUTPATIENT',
                    'categoryName' => 'Medical Treatment (Outpatient)',
                    'description' => 'For students requiring outpatient medical treatment',
                    'maxAmount' => 2000.00,
                    'eligibilityCriteria' => 'Must provide medical certificates and receipts',
                    'status' => 'active',
                    'requires_committee_approval' => false
                ],
                [
                    'categoryId' => 'CAT-ILLNESS-CHRONIC',
                    'categoryName' => 'Chronic Illness Treatment',
                    'description' => 'For students with chronic illnesses requiring ongoing treatment',
                    'maxAmount' => 8000.00,
                    'eligibilityCriteria' => 'Must provide doctor\'s report and treatment plan',
                    'status' => 'active',
                    'requires_committee_approval' => true
                ]
            ],

            // Emergency Categories
            'CAT-EMERGENCY' => [
                [
                    'categoryId' => 'CAT-EMERGENCY-NATURAL',
                    'categoryName' => 'Natural Disaster',
                    'description' => 'For students affected by natural disasters',
                    'maxAmount' => 4000.00,
                    'eligibilityCriteria' => 'Must provide evidence of damage and official reports',
                    'status' => 'active',
                    'requires_committee_approval' => true
                ],
                [
                    'categoryId' => 'CAT-EMERGENCY-FAMILY',
                    'categoryName' => 'Family Emergency',
                    'description' => 'For students facing family emergencies',
                    'maxAmount' => 3000.00,
                    'eligibilityCriteria' => 'Must provide relevant documentation of emergency',
                    'status' => 'active',
                    'requires_committee_approval' => true
                ],
                [
                    'categoryId' => 'CAT-EMERGENCY-OTHERS',
                    'categoryName' => 'Other Emergencies',
                    'description' => 'For other emergency cases requiring immediate assistance',
                    'maxAmount' => 2000.00,
                    'eligibilityCriteria' => 'Must provide justification and supporting documents',
                    'status' => 'active',
                    'requires_committee_approval' => true
                ]
            ],

            // Bereavement Category
            'CAT-BEREAVEMENT' => [
                [
                    'categoryId' => 'CAT-BEREAVEMENT',
                    'categoryName' => 'Bereavement (Khairat)',
                    'description' => 'For bereavement related assistance',
                    'maxAmount' => 500.00,
                    'eligibilityCriteria' => 'Student, Parent, or Sibling',
                    'status' => 'active',
                    'requires_committee_approval' => false
                ]
            ]
        ];

        // Insert categories
        foreach ($categories as $mainCategory => $subCategories) {
            foreach ($subCategories as $category) {
                DB::table('funding_categories')->insert($category);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_status_logs');
        Schema::dropIfExists('approval_workflows');
        Schema::dropIfExists('application_documents');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('funding_categories');
    }
};