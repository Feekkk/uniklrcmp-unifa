<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // For API requests, never redirect to a route
        if ($request->is('api/*')) {
            return null;
        }
        
        // Only use login route for web requests
        return $request->expectsJson() ? null : '/login';
    }
}