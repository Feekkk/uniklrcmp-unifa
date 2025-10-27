<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Committee;
use App\Http\Requests\Auth\CommitteeChangePasswordRequest;
use Illuminate\Support\Facades\Hash;

class CommitteeAuthController extends Controller
{
    public function getProfile(Request $request): JsonResponse
    {
        $email = $request->query('email');
        if (!$email) {
            return response()->json(['error' => 'Email is required'], 422);
        }
        $committee = Committee::where('email', $email)->first();
        if (!$committee) {
            return response()->json(['error' => 'Committee not found'], 404);
        }
        return response()->json($committee);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'username' => 'nullable|string',
        ]);

        $committee = Committee::where('email', $validated['email'])->first();
        if (!$committee) {
            return response()->json(['error' => 'Committee not found'], 404);
        }

        $committee->update(array_filter([
            'username' => $validated['username'] ?? null,
        ], fn($v) => !is_null($v)));

        return response()->json([
            'message' => 'Profile updated successfully',
            'committee' => $committee->fresh()
        ]);
    }

    public function changePassword(CommitteeChangePasswordRequest $request): JsonResponse
    {
        $email = $request->input('email');
        $committee = Committee::where('email', $email)->first();
        
        if (!$committee) {
            return response()->json(['error' => 'Committee not found'], 404);
        }

        if (!Hash::check($request->input('current_password'), $committee->password)) {
            return response()->json(['error' => 'Current password is incorrect'], 422);
        }

        $committee->password = Hash::make($request->input('password'));
        $committee->save();

        return response()->json(['message' => 'Password successfully updated']);
    }
}
