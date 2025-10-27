<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfTokenForApi extends Middleware
{
    /**
     * Determine if the request has a valid CSRF token.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function tokensMatch($request)
    {
        // For API requests with a session cookie, verify CSRF
        if (isset($_COOKIE['XSRF-TOKEN'])) {
            return parent::tokensMatch($request);
        }
        
        // For initial API requests without a session, skip CSRF
        return true;
    }
}