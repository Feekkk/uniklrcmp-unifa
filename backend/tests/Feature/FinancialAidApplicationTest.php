<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\FundingCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FinancialAidApplicationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create funding categories
        FundingCategory::create([
            'categoryId' => 'CAT-BEREAVEMENT',
            'categoryName' => 'Bereavement (Khairat)',
            'description' => 'Financial assistance for bereavement expenses',
            'maxAmount' => 500.00,
            'eligibilityCriteria' => 'Student, Parent, or Sibling bereavement',
            'status' => 'active'
        ]);
    }

    public function test_can_submit_bereavement_application()
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('death_certificate.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/applications/financial-aid', [
                'fullName' => 'John Doe',
                'studentId' => 'ST2023001',
                'course' => 'engineering',
                'semester' => '3',
                'contactNumber' => '+60123456789',
                'emergencyContact' => '+60198765432',
                'fundCategory' => 'bereavement',
                'bereavementType' => 'student',
                'deathCertificate' => $file
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Financial aid application submitted successfully'
            ]);

        $this->assertDatabaseHas('applications', [
            'userId' => $user->id,
            'fundCategory' => 'bereavement',
            'bereavementType' => 'student',
            'amountRequested' => 500.00
        ]);
    }

    public function test_can_submit_outpatient_application()
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('receipt.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/applications/financial-aid', [
                'fullName' => 'Jane Smith',
                'studentId' => 'ST2023002',
                'course' => 'business',
                'semester' => '2',
                'contactNumber' => '+60123456788',
                'fundCategory' => 'illness-injuries',
                'fundSubCategory' => 'outpatient',
                'clinicName' => 'UniKL Medical Center',
                'reasonVisit' => 'Fever and cough',
                'visitDateTime' => '2025-01-15T10:30:00',
                'totalAmountOutpatient' => 25.00,
                'receiptClinic' => $file
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Financial aid application submitted successfully'
            ]);

        $this->assertDatabaseHas('applications', [
            'userId' => $user->id,
            'fundCategory' => 'illness-injuries',
            'fundSubCategory' => 'outpatient',
            'clinicName' => 'UniKL Medical Center',
            'totalAmountOutpatient' => 25.00,
            'amountRequested' => 25.00
        ]);
    }

    public function test_validation_fails_for_missing_required_fields()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/applications/financial-aid', [
                'fundCategory' => 'bereavement'
                // Missing required fields
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['fullName', 'studentId', 'course', 'bereavementType', 'deathCertificate']);
    }

    public function test_validation_fails_for_invalid_amount_limits()
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('receipt.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/applications/financial-aid', [
                'fullName' => 'John Doe',
                'studentId' => 'ST2023001',
                'course' => 'engineering',
                'fundCategory' => 'illness-injuries',
                'fundSubCategory' => 'outpatient',
                'clinicName' => 'UniKL Medical Center',
                'reasonVisit' => 'Fever and cough',
                'visitDateTime' => '2025-01-15T10:30:00',
                'totalAmountOutpatient' => 50.00, // Exceeds RM 30 limit
                'receiptClinic' => $file
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['totalAmountOutpatient']);
    }
}
