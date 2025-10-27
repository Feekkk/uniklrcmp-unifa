<?php

namespace App\Traits;

trait ApiResponse
{
    /**
     * Success Response
     */
    protected function successResponse($data = null, $message = null, $code = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * Error Response
     */
    protected function errorResponse($message = null, $code = 400, $errors = null)
    {
        $response = [
            'status' => 'error',
            'message' => $message
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * Response with data
     */
    protected function withData($data, $code = 200)
    {
        return response()->json($data, $code);
    }
}