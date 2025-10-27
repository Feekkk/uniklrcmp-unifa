<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Admin;
use App\Models\Committee;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Exceptions\UnauthorizedException;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends ApiController
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'fullName' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'bankName' => 'nullable|string|max:255',
            'bankAccount' => 'nullable|string|max:255',
            'password' => 'required|string|min:8|confirmed',
            'phoneNo' => 'nullable|string|max:20',
            'icNo' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'program' => 'nullable|string|max:255',
            'semester' => 'nullable|integer',
        ]);

        try {
            $user = User::create([
                'name' => $validated['fullName'],
                'username' => $validated['username'],
                'fullName' => $validated['fullName'],
                'email' => $validated['email'],
                'bankName' => $validated['bankName'] ?? null,
                'bankAccount' => $validated['bankAccount'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => 'student',
                'phoneNo' => $validated['phoneNo'] ?? null,
                'icNo' => $validated['icNo'] ?? null,
                'address' => $validated['address'] ?? null,
                'program' => $validated['program'] ?? null,
                'semester' => $validated['semester'] ?? null,
            ]);

            // Generate token for the newly registered user
            $token = JWTAuth::fromUser($user);

            return response()->json([
                'message' => 'Registered successfully',
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60,
                'role' => 'user',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'fullName' => $user->fullName,
                    'email' => $user->email,
                    'bankName' => $user->bankName,
                    'bankAccount' => $user->bankAccount,
                    'program' => $user->program,
                    'semester' => $user->semester,
                    'phoneNo' => $user->phoneNo,
                    'icNo' => $user->icNo,
                    'address' => $user->address,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Registration failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only(['email', 'password']);

        try {
            // Try Admin authentication first
            $admin = Admin::where('email', $credentials['email'])->first();
            if ($admin && Hash::check($credentials['password'], $admin->password)) {
                $token = JWTAuth::fromUser($admin);
                return response()->json([
                    'access_token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => config('jwt.ttl') * 60,
                    'role' => 'admin'
                ]);
            }

            // Try Committee authentication
            $committee = Committee::where('email', $credentials['email'])->first();
            if ($committee && Hash::check($credentials['password'], $committee->password)) {
                $token = JWTAuth::fromUser($committee);
                return response()->json([
                    'access_token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => config('jwt.ttl') * 60,
                    'role' => 'committee'
                ]);
            }

            // Try User authentication
            if ($token = JWTAuth::attempt($credentials)) {
                return response()->json([
                    'access_token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => config('jwt.ttl') * 60,
                    'role' => 'user'
                ]);
            }

            throw new UnauthorizedException('Invalid credentials');
        } catch (\Exception $e) {
            Log::error('Authentication error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Internal server error during authentication',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(): JsonResponse
    {
        try {
            if (auth()->guard('admin')->check()) {
                auth()->guard('admin')->logout();
            } elseif (auth()->guard('committee')->check()) {
                auth()->guard('committee')->logout();
            } else {
                auth()->guard('api')->logout();
            }
            return response()->json(['message' => 'Successfully logged out']);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Failed to logout, please try again.'], 500);
        }
    }

    public function me(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            // The role is already being added as a virtual attribute
            return response()->json($user);
            
        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            return response()->json(['error' => 'Token has expired'], 401);
        } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
            return response()->json(['error' => 'Token is invalid'], 401);
        } catch (\Tymon\JWTAuth\Exceptions\JWTException $e) {
            Log::error('Authentication error in me(): ' . $e->getMessage());
            return response()->json(['error' => 'Token absent'], 401);
        } catch (\Exception $e) {
            Log::error('Unexpected error in me(): ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $validationRules = [
                'fullName' => 'required|string|min:2',
                'phoneNo' => 'nullable|string',
                'icNo' => 'nullable|string',
                'address' => 'nullable|string|min:5',
                'bankName' => 'nullable|string',
                'bankAccount' => 'nullable|string',
                'program' => 'nullable|string',
                'semester' => 'nullable|integer|min:1|max:10',
            ];

            $validatedData = $request->validate($validationRules);

            $user->fill(array_filter($validatedData, function ($v) { return !is_null($v); }))->save();

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => $user->fresh()
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json(['errors' => $ve->errors()], 422);
        } catch (JWTException $e) {
            Log::error('Update profile error: ' . $e->getMessage());
            return response()->json(['error' => 'Token is invalid'], 401);
        } catch (\Exception $e) {
            Log::error('Update profile error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update profile'], 500);
        }
    }

    public function getProfile(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }
            return response()->json($user);
        } catch (JWTException $e) {
            Log::error('Get profile error: ' . $e->getMessage());
            return response()->json(['error' => 'Token is invalid'], 401);
        }
    }

    public function changePassword(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $validatedData = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8',
                'confirm_password' => 'required|same:new_password'
            ]);

            // Verify current password
            if (!Hash::check($validatedData['current_password'], $user->password)) {
                return response()->json(['error' => 'Current password is incorrect'], 400);
            }

            // Check if new password is same as old password (case-sensitive)
            if ($validatedData['current_password'] === $validatedData['new_password']) {
                return response()->json(['error' => 'New password must be different from current password'], 400);
            }

            // Update password
            $user->password = Hash::make($validatedData['new_password']);
            $user->save();

            return response()->json(['message' => 'Password changed successfully']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (JWTException $e) {
            Log::error('Change password error: ' . $e->getMessage());
            return response()->json(['error' => 'Token is invalid'], 401);
        } catch (\Exception $e) {
            Log::error('Change password error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to change password'], 500);
        }
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::parseToken()->refresh();
            return response()->json([
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60
            ]);
        } catch (JWTException $e) {
            Log::error('Token refresh error: ' . $e->getMessage());
            return response()->json(['error' => 'Token could not be refreshed'], 401);
        }
    }
}
