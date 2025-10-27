<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Validator;

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