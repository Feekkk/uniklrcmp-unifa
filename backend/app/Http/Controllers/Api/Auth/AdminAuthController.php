<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Auth\AdminChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;
use App\Exceptions\UnauthorizedException;
use App\Exceptions\ResourceNotFoundException;

class AdminAuthController extends ApiController
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        
        // Get admin credentials from config
        $admins = config('admin.admins');
        
        // Check if the provided email exists in admin config
        $admin = collect($admins)->firstWhere('email', $credentials['email']);
        
        if (!$admin) {
            throw new ResourceNotFoundException('Admin not found');
        }
        
        // Check if password matches
        if ($credentials['password'] !== $admin['password']) {
            throw new UnauthorizedException('Invalid credentials');
        }
        
        // Create an Admin instance and generate token
        $adminModel = new Admin();
        $adminModel->email = $admin['email'];
        $token = JWTAuth::fromUser($adminModel);
        
        return $this->successResponse([
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60
        ], 'Admin logged in successfully');
    }

    public function changePassword(AdminChangePasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        // Get admin credentials from config
        $admins = config('admin.admins');
        
        // Check if the provided email exists in admin config
        $adminIndex = collect($admins)->search(function($admin) use ($validated) {
            return $admin['email'] === $validated['email'];
        });
        
        if ($adminIndex === false) {
            throw new ResourceNotFoundException('Admin not found');
        }
        
        // Verify current password
        if ($validated['current_password'] !== $admins[$adminIndex]['password']) {
            throw new UnauthorizedException('Current password is incorrect');
        }
        
        // Update password in .env file
        $envFile = base_path('.env');
        $envContents = File::get($envFile);
        
        // Determine which admin is changing password
        $adminNumber = $adminIndex + 1;
        $oldLine = "ADMIN{$adminNumber}_PASSWORD=" . $admins[$adminIndex]['password'];
        $newLine = "ADMIN{$adminNumber}_PASSWORD=" . $validated['new_password'];
        
        // Replace the password line in .env
        $newContents = str_replace($oldLine, $newLine, $envContents);
        File::put($envFile, $newContents);
        
        // Clear config cache
        Artisan::call('config:clear');
        
        return $this->successResponse(null, 'Password changed successfully');
    }

    public function logout(): JsonResponse
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return $this->successResponse(null, 'Successfully logged out');
    }
}
