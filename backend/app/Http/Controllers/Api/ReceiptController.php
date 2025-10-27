<?php

namespace App\Http\Controllers\Api;

use App\Models\Application;
use App\Models\Receipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Exceptions\ResourceNotFoundException;
use App\Exceptions\UnauthorizedException;

class ReceiptController extends ApiController
{
    public function index(string $id): JsonResponse
    {
        $application = Application::findOrFail($id);

        // Authorization: Allow access if:
        // 1. User is the application owner (student) AND application is approved
        // 2. User is an admin
        $user = Auth::user();
        $isAdmin = Auth::guard('admin')->check();
        
        // Check if user is the application owner
        if (!$isAdmin && ($user === null || $user->id !== $application->userId)) {
            throw new UnauthorizedException('You are not authorized to view receipts for this application');
        }
        
        // For students, only allow viewing receipts if application is approved
        if (!$isAdmin && !in_array($application->applicationStatus, ['APPROVED', 'approved', 'admin_approved'])) {
            throw new UnauthorizedException('Receipts can only be viewed when the application is approved');
        }

        $receipts = Receipt::where('applicationId', $id)->get();

        return $this->successResponse($receipts, 'Receipts retrieved successfully');
    }

    public function store(Request $request, string $id): JsonResponse
    {
        $application = Application::findOrFail($id);

        // Only admins can upload receipts
        if (!Auth::guard('admin')->check()) {
            throw new UnauthorizedException('Only admins can upload receipts');
        }

        $validated = $request->validate([
            'receiptNumber' => 'required|string|unique:receipts,receiptNumber',
            'amount' => 'required|numeric|min:0',
            'dateIssued' => 'required|date',
            'description' => 'required|string',
            'document' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png'
        ]);

        $fileName = time() . '_' . $request->file('document')->getClientOriginalName();
        $path = $request->file('document')->storeAs('receipts', $fileName, 'public');

        $receipt = Receipt::create([
            'receiptId' => 'RCP-' . strtoupper(Str::random(8)),
            'applicationId' => $id,
            'uploadedBy' => Auth::guard('admin')->user()->id,
            'fileName' => $fileName,
            'originalFileName' => $request->file('document')->getClientOriginalName(),
            'filePath' => $path,
            'fileType' => $request->file('document')->getMimeType(),
            'fileSize' => $request->file('document')->getSize(),
            'uploadedAt' => now(),
            'description' => $validated['description'],
            'status' => 'active'
        ]);

        return $this->successResponse($receipt, 'Receipt uploaded successfully', 201);
    }

    public function viewReceipt(Request $request, string $id)
    {
        $receipt = Receipt::findOrFail($id);
        $application = $receipt->application;

        // Authorization check
        $user = Auth::user();
        $isAdmin = Auth::guard('admin')->check();
        $isAdminByEmail = false;
        
        // Try to get user by email from request (for admin email fallback)
        if ($request->filled('email')) {
            $email = $request->input('email');
            // Check if this is an admin email from config
            $admins = config('admin.admins');
            if (collect($admins)->firstWhere('email', $email)) {
                $isAdminByEmail = true;
            }
            // If not admin email, try to get student user
            if (!$isAdminByEmail && !$user) {
                $user = \App\Models\User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
            }
        }
        
        // Allow access if:
        // 1. User is an admin (via JWT) OR admin via email
        // 2. User is the application owner AND application is approved
        $isAuthorized = $isAdmin || $isAdminByEmail || ($user !== null && $user->id === $application->userId);
        
        if (!$isAuthorized) {
            throw new UnauthorizedException('You are not authorized to view this receipt');
        }
        
        // For non-admins, check if application is approved
        if (!$isAdmin && !$isAdminByEmail && !in_array($application->applicationStatus, ['APPROVED', 'approved', 'admin_approved'])) {
            throw new UnauthorizedException('Receipts can only be viewed when the application is approved');
        }

        // Check if file exists on local (private) disk
        if (!Storage::disk('local')->exists($receipt->filePath)) {
            throw new ResourceNotFoundException('Receipt file not found');
        }

        // Get file path and serve it using response()->file()
        $filePath = Storage::disk('local')->path($receipt->filePath);
        $mimeType = $receipt->fileType ?: mime_content_type($filePath);

        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $receipt->originalFileName . '"'
        ]);
    }

    public function downloadReceipt(Request $request, string $id)
    {
        $receipt = Receipt::findOrFail($id);
        $application = $receipt->application;

        // Authorization check
        $user = Auth::user();
        $isAdmin = Auth::guard('admin')->check();
        $isAdminByEmail = false;
        
        // Try to get user by email from request (for admin email fallback)
        if ($request->filled('email')) {
            $email = $request->input('email');
            // Check if this is an admin email from config
            $admins = config('admin.admins');
            if (collect($admins)->firstWhere('email', $email)) {
                $isAdminByEmail = true;
            }
            // If not admin email, try to get student user
            if (!$isAdminByEmail && !$user) {
                $user = \App\Models\User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
            }
        }
        
        // Allow access if:
        // 1. User is an admin (via JWT) OR admin via email
        // 2. User is the application owner AND application is approved
        $isAuthorized = $isAdmin || $isAdminByEmail || ($user !== null && $user->id === $application->userId);
        
        if (!$isAuthorized) {
            throw new UnauthorizedException('You are not authorized to download this receipt');
        }
        
        // For non-admins, check if application is approved
        if (!$isAdmin && !$isAdminByEmail && !in_array($application->applicationStatus, ['APPROVED', 'approved', 'admin_approved'])) {
            throw new UnauthorizedException('Receipts can only be downloaded when the application is approved');
        }

        // Check if file exists on local (private) disk
        if (!Storage::disk('local')->exists($receipt->filePath)) {
            throw new ResourceNotFoundException('Receipt file not found');
        }

        // Return download response
        $filePath = Storage::disk('local')->path($receipt->filePath);
        return response()->download($filePath, $receipt->originalFileName);
    }
}