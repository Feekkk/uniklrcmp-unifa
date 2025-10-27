<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Get credentials
        $credentials = $request->only(['email', 'password']);

        // Attempt to authenticate
        if (!$token = Auth::attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        // Get the authenticated user
        $user = Auth::user();

        // Create response
        return response()->json([
            'message' => 'Successfully logged in',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'role' => $user->role,
                'profile' => [
                    'fullName' => $user->fullName,
                    'bankName' => $user->bankName,
                    'bankAccount' => $user->bankAccount,
                    'program' => $user->program,
                    'semester' => $user->semester,
                    'phoneNo' => $user->phoneNo,
                    'icNo' => $user->icNo,
                    'address' => $user->address,
                ]
            ]
        ]);
    }

    public function logout()
    {
        Auth::logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function register(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'fullName' => 'nullable|string|max:255',
            'phoneNo' => 'nullable|string|max:20',
            'icNo' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'program' => 'nullable|string|max:255',
            'semester' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Create new user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'role' => 'student', // Default role for registration
                'fullName' => $request->fullName,
                'phoneNo' => $request->phoneNo,
                'icNo' => $request->icNo,
                'address' => $request->address,
                'program' => $request->program,
                'semester' => $request->semester,
            ]);

            DB::commit();

            // Generate token for the new user
            $token = JWTAuth::fromUser($user);

            return response()->json([
                'message' => 'Student registered successfully',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'role' => $user->role,
                    'profile' => [
                        'fullName' => $user->fullName,
                        'bankName' => $user->bankName,
                        'bankAccount' => $user->bankAccount,
                        'program' => $user->program,
                        'semester' => $user->semester,
                        'phoneNo' => $user->phoneNo,
                        'icNo' => $user->icNo,
                        'address' => $user->address,
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Registration failed: ' . $e->getMessage());

            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function me()
    {
        $user = Auth::user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'role' => $user->role,
                'profile' => [
                    'fullName' => $user->fullName,
                    'bankName' => $user->bankName,
                    'bankAccount' => $user->bankAccount,
                    'program' => $user->program,
                    'semester' => $user->semester,
                    'phoneNo' => $user->phoneNo,
                    'icNo' => $user->icNo,
                    'address' => $user->address,
                ]
            ]
        ]);
    }

    public function refresh()
    {
        return response()->json([
            'token' => Auth::refresh(),
            'message' => 'Token refreshed successfully'
        ]);
    }
}