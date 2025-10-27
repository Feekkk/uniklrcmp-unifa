<?php

namespace App\Http\Controllers\Api;

use App\Models\Application;
use App\Models\ApplicationDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Exceptions\ResourceNotFoundException;
use App\Exceptions\UnauthorizedException;

class ApplicationDocumentController extends ApiController
{
    public function store(Request $request, string $id): JsonResponse
    {
        $application = Application::findOrFail($id);

        $validated = $request->validate([
            'document' => 'required|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
            'documentType' => 'required|string'
        ]);

        $path = $request->file('document')->store('application_documents');

        $document = ApplicationDocument::create([
            'documentId' => 'DOC-' . strtoupper(\Illuminate\Support\Str::random(8)),
            'applicationId' => $id,
            'uploadedBy' => Auth::id() ?? 1, // Fallback for testing
            'filePath' => $path,
            'documentType' => $validated['documentType'],
            'fileName' => $request->file('document')->getClientOriginalName(),
            'fileType' => $request->file('document')->getMimeType(),
            'fileSize' => $request->file('document')->getSize(),
            'uploadedAt' => now(),
            'description' => 'Uploaded document',
            'status' => 'active'
        ]);

        return $this->successResponse($document, 'Document uploaded successfully', 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $document = ApplicationDocument::findOrFail($id);
        $application = Application::findOrFail($document->applicationId);

        // Public demo: skip ownership check

        // Delete file from storage
        Storage::delete($document->filePath);

        // Delete record from database
        $document->delete();

        return $this->successResponse(null, 'Document deleted successfully');
    }

    /**
     * Serve/view a document file
     */
    public function viewDocument(Request $request, string $id)
    {
        $document = ApplicationDocument::findOrFail($id);
        $application = Application::findOrFail($document->applicationId);
        
        // Authorization check
        $user = Auth::user();
        $isAdmin = Auth::guard('admin')->check();
        $isCommittee = Auth::guard('committee')->check();
        $isAdminByEmail = false;
        $isCommitteeByEmail = false;
        
        // Try to get user by email from request (for admin/committee email fallback)
        if ($request->filled('email')) {
            $email = $request->input('email');
            // Check if this is an admin email from config
            $admins = config('admin.admins');
            if (collect($admins)->firstWhere('email', $email)) {
                $isAdminByEmail = true;
            }
            // Check if this is a committee email from database
            if (!$isAdminByEmail) {
                $committee = \App\Models\Committee::where('email', $email)->first();
                if ($committee) {
                    $isCommitteeByEmail = true;
                }
            }
            // If not admin or committee email, try to get student user
            if (!$isAdminByEmail && !$isCommitteeByEmail && !$user) {
                $user = \App\Models\User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
            }
        }
        
        // Allow access if:
        // 1. User is an admin (via JWT) OR admin via email
        // 2. User is a committee member (via JWT) OR committee via email
        // 3. User is the application owner
        $isAuthorized = $isAdmin || $isAdminByEmail || $isCommittee || $isCommitteeByEmail || ($user !== null && $user->id === $application->userId);
        
        if (!$isAuthorized) {
            throw new UnauthorizedException('You are not authorized to view this document');
        }
        
        // Check if file exists
        if (!Storage::disk('public')->exists($document->filePath)) {
            throw new ResourceNotFoundException('Document file not found');
        }

        // Get file content and mime type
        $filePath = Storage::disk('public')->path($document->filePath);
        $mimeType = $document->fileType ?: mime_content_type($filePath);

        // Return file response
        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $document->fileName . '"'
        ]);
    }

    /**
     * Download a document file
     */
    public function downloadDocument(Request $request, string $id)
    {
        $document = ApplicationDocument::findOrFail($id);
        $application = Application::findOrFail($document->applicationId);
        
        // Authorization check
        $user = Auth::user();
        $isAdmin = Auth::guard('admin')->check();
        $isCommittee = Auth::guard('committee')->check();
        $isAdminByEmail = false;
        $isCommitteeByEmail = false;
        
        // Try to get user by email from request (for admin/committee email fallback)
        if ($request->filled('email')) {
            $email = $request->input('email');
            // Check if this is an admin email from config
            $admins = config('admin.admins');
            if (collect($admins)->firstWhere('email', $email)) {
                $isAdminByEmail = true;
            }
            // Check if this is a committee email from database
            if (!$isAdminByEmail) {
                $committee = \App\Models\Committee::where('email', $email)->first();
                if ($committee) {
                    $isCommitteeByEmail = true;
                }
            }
            // If not admin or committee email, try to get student user
            if (!$isAdminByEmail && !$isCommitteeByEmail && !$user) {
                $user = \App\Models\User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
            }
        }
        
        // Allow access if:
        // 1. User is an admin (via JWT) OR admin via email
        // 2. User is a committee member (via JWT) OR committee via email
        // 3. User is the application owner
        $isAuthorized = $isAdmin || $isAdminByEmail || $isCommittee || $isCommitteeByEmail || ($user !== null && $user->id === $application->userId);
        
        if (!$isAuthorized) {
            throw new UnauthorizedException('You are not authorized to download this document');
        }
        
        // Check if file exists
        if (!Storage::disk('public')->exists($document->filePath)) {
            throw new ResourceNotFoundException('Document file not found');
        }

        // Return download response
        $filePath = Storage::disk('public')->path($document->filePath);
        return response()->download($filePath, $document->fileName);
    }
}