<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ApiController extends Controller
{
    protected function successResponse($data = null, $message = null, $code = 200): JsonResponse
    {
        $message = $message ?? 'Success';
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    protected function errorResponse($message = null, $errors = null, $code = 400): JsonResponse
    {
        $message = $message ?? 'Error';
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => $errors
        ], $code);
    }
}