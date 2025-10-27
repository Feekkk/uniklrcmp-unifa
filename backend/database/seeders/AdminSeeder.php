<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default admin accounts
        $defaultAdmins = [
            [
                'name' => 'Admin 1',
                'username' => 'admin1',
                'email' => 'admin1@unikl.com',
                'password' => 'admin123',
            ],
            [
                'name' => 'Admin 2',
                'username' => 'admin2',
                'email' => 'admin2@unikl.com',
                'password' => 'admin123',
            ],
            [
                'name' => 'Admin 3',
                'username' => 'admin3',
                'email' => 'afiq.danial@t.unikl.edu.my',
                'password' => 'admin123',
            ]
        ];

        foreach ($defaultAdmins as $adminData) {
            // First try to find by email, then by username
            $existingAdmin = Admin::where('email', $adminData['email'])
                ->orWhere('username', $adminData['username'])
                ->first();
                
            if ($existingAdmin) {
                // Update existing admin
                $existingAdmin->update([
                    'name' => $adminData['name'],
                    'username' => $adminData['username'],
                    'email' => $adminData['email'],
                    'password' => Hash::make($adminData['password']),
                ]);
            } else {
                // Create new admin
                Admin::create([
                    'name' => $adminData['name'],
                    'username' => $adminData['username'],
                    'email' => $adminData['email'],
                    'password' => Hash::make($adminData['password']),
                ]);
            }
        }

        // Also check for environment-based admins
        $admins = config('admin.admins');
        
        foreach ($admins as $admin) {
            // Skip if email or password is not set in environment
            if (empty($admin['email']) || empty($admin['password'])) {
                continue;
            }

            $username = explode('@', $admin['email'])[0];
            $existingAdmin = Admin::where('email', $admin['email'])
                ->orWhere('username', $username)
                ->first();
                
            if ($existingAdmin) {
                // Update existing admin
                $existingAdmin->update([
                    'name' => 'Config Admin ' . $username,
                    'username' => $username,
                    'email' => $admin['email'],
                    'password' => Hash::make($admin['password']),
                ]);
            } else {
                // Create new admin
                Admin::create([
                    'name' => 'Config Admin ' . $username,
                    'username' => $username,
                    'email' => $admin['email'],
                    'password' => Hash::make($admin['password']),
                ]);
            }
        }
    }
}
