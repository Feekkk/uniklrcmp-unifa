<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Committee;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class CommitteeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Clear all existing committee records
        Committee::truncate();
        
        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // Create default committee accounts
        $defaultCommittees = [
            [
                'name' => 'Chairman',
                'username' => 'committee1',
                'email' => 'committee1@unikl.com',
                'password' => 'committee123',
            ],
            [
                'name' => 'Head Of Department',
                'username' => 'committee2',
                'email' => 'committee2@unikl.com',
                'password' => 'Committee123',
            ],
            [
                'name' => 'Committee 3',
                'username' => 'committee3',
                'email' => 'committee3@unikl.com',
                'password' => 'Committee123',
            ],
            [
                'name' => 'Committee 4',
                'username' => 'committee4',
                'email' => 'committee4@unikl.com',
                'password' => 'Committee123',
            ],
            [
                'name' => 'Committee 5',
                'username' => 'committee5',
                'email' => 'committee5@unikl.com',
                'password' => 'Committee123',
            ]
        ];

        foreach ($defaultCommittees as $committeeData) {
            // First try to find by email, then by username
            $existingCommittee = Committee::where('email', $committeeData['email'])
                ->orWhere('username', $committeeData['username'])
                ->first();
                
            if ($existingCommittee) {
                // Update existing committee
                $existingCommittee->update([
                    'name' => $committeeData['name'],
                    'username' => $committeeData['username'],
                    'email' => $committeeData['email'],
                    'password' => Hash::make($committeeData['password']),
                ]);
            } else {
                // Create new committee
                Committee::create([
                    'name' => $committeeData['name'],
                    'username' => $committeeData['username'],
                    'email' => $committeeData['email'],
                    'password' => Hash::make($committeeData['password']),
                ]);
            }
        }

        // Also check for environment-based committees
        $committees = config('committee.committees');
        
        foreach ($committees as $committee) {
            // Skip if email or password is not set in environment
            if (empty($committee['email']) || empty($committee['password'])) {
                continue;
            }

            $username = explode('@', $committee['email'])[0];
            $existingCommittee = Committee::where('email', $committee['email'])
                ->orWhere('username', $username)
                ->first();
                
            if ($existingCommittee) {
                // Update existing committee
                $existingCommittee->update([
                    'name' => 'Config Committee ' . $username,
                    'username' => $username,
                    'email' => $committee['email'],
                    'password' => Hash::make($committee['password']),
                ]);
            } else {
                // Create new committee
                Committee::create([
                    'name' => 'Config Committee ' . $username,
                    'username' => $username,
                    'email' => $committee['email'],
                    'password' => Hash::make($committee['password']),
                ]);
            }
        }
    }
}
