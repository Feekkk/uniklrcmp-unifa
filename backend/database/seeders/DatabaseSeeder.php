<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed admin accounts first
        $this->call(AdminSeeder::class);

        // Seed committee accounts
        $this->call(CommitteeSeeder::class);

        // Seed funding categories
        $this->call(FinancialAidCategoriesSeeder::class);

        // Seed welfare fund transactions
        $this->call(WelfareFundSeeder::class);

        // Create test user
        User::factory()->create([
            'username' => 'user',
            'fullName' => 'user',
            'email' => 'user@example.com',
            'program' => 'Software Engineering',
            'semester' => 1,
            'phoneNo' => '123-456-7890',
            'icNo' => '123456789012',
            'address' => '123 Test St, Test City',
            'bankName' => 'CIMB Bank',
            'bankAccount' => '1234567890',
        ]);
    }
}
