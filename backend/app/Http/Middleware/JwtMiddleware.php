<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Http\Middleware\BaseMiddleware;
use App\Models\User;
use App\Models\Admin;
use App\Models\Committee;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class JwtMiddleware extends BaseMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Special case for committee, admin, and finance routes that can use email parameter
        if (($request->is('api/committee/*') || $request->is('api/admin/*') || $request->is('api/finance/*')) && 
            ($request->has('email') || $request->header('X-Admin-Email') || $request->header('X-Committee-Email'))) {
            
            $email = $request->get('email') ?? $request->header('X-Admin-Email') ?? $request->header('X-Committee-Email');
            
            // Log this special case
            \Log::info('Route with email parameter - bypassing JWT auth', [
                'path' => $request->path(),
                'email' => $email,
                'route_type' => $request->is('api/committee/*') ? 'committee' : ($request->is('api/admin/*') ? 'admin' : 'finance')
            ]);
            
            // Let the controller handle the email-based authentication
            return $next($request);
        }
        
        try {
            // Log request headers for debugging
            \Log::info('JWT Middleware - Request headers', [
                'authorization' => $request->header('Authorization'),
                'content_type' => $request->header('Content-Type'),
                'accept' => $request->header('Accept'),
                'path' => $request->path()
            ]);
            
            // Get the token from the request
            $token = JWTAuth::getToken();
            \Log::info('JWT Middleware - Token found: ' . ($token ? 'Yes' : 'No'));
            if (!$token) {
                \Log::info('JWT Middleware - No token found, checking for email fallback');
                // Special handling for committee, admin, and finance routes
                if (($request->is('api/committee/*') || $request->is('api/admin/*') || $request->is('api/finance/*')) && 
                    ($request->header('X-Committee-Email') || $request->header('X-Admin-Email') || $request->has('email'))) {
                    
                    $email = $request->header('X-Committee-Email') ?? $request->header('X-Admin-Email') ?? $request->get('email');
                    
                    \Log::info('Allowing route access with email header', [
                        'email' => $email,
                        'route_type' => $request->is('api/committee/*') ? 'committee' : ($request->is('api/admin/*') ? 'admin' : 'finance')
                    ]);
                    
                    return $next($request);
                }
                
                \Log::info('JWT Middleware - No token found and no email fallback available');
                return response()->json(['error' => 'Authorization token not found'], 401);
            }
            
            // Decode the token to get the payload
            $payload = JWTAuth::getPayload($token)->toArray();
            \Log::info('JWT Middleware - Token payload', ['payload' => $payload]);
            
            // Log token information for debugging
            \Log::info('JWT token info', [
                'payload_role' => $payload['role'] ?? 'no role',
                'path' => $request->path(),
                'is_committee_route' => $request->is('api/committee/*'),
                'is_admin_route' => $request->is('api/admin/*')
            ]);
            
            // Check if this is a committee route that requires role validation
            if ($request->is('api/committee/*')) {
                // Check if token has committee role
                if (!isset($payload['role']) || $payload['role'] !== 'committee') {
                    return response()->json([
                        'error' => 'Unauthorized. Committee access required',
                        'provided_role' => $payload['role'] ?? 'none'
                    ], 403);
                }
                
                // Attempt to authenticate as committee
                $user = JWTAuth::parseToken()->authenticate('committee');
                if (!$user) {
                    return response()->json(['error' => 'Committee user not found'], 404);
                }
            } else if ($request->is('api/admin/*')) {
                // Check if token has admin role
                if (!isset($payload['role']) || $payload['role'] !== 'admin') {
                    return response()->json([
                        'error' => 'Unauthorized. Admin access required',
                        'provided_role' => $payload['role'] ?? 'none'
                    ], 403);
                }
                
                // Attempt to authenticate as admin
                $user = JWTAuth::parseToken()->authenticate('admin');
                if (!$user) {
                    return response()->json(['error' => 'Admin user not found'], 404);
                }
            } else {
                // For other routes, use default authentication
                $user = JWTAuth::parseToken()->authenticate();
                \Log::info('JWT Middleware - User authenticated: ' . ($user ? 'Yes' : 'No'));
                if (!$user) {
                    // If authentication fails and this is a finance route with email, try email fallback
                    if ($request->is('api/finance/*') && 
                        ($request->header('X-Admin-Email') || $request->has('email'))) {
                        
                        $email = $request->header('X-Admin-Email') ?? $request->get('email');
                        
                        \Log::info('JWT auth failed, trying email fallback for finance route', [
                            'email' => $email
                        ]);
                        
                        return $next($request);
                    }
                    
                    \Log::info('JWT Middleware - User not found, checking for email fallback');
                    return response()->json(['error' => 'User not found'], 404);
                }
            }
            
        } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
            \Log::error('JWT token invalid', ['exception' => $e->getMessage()]);
            
            // Try email fallback for finance routes when token is invalid
            if ($request->is('api/finance/*') && 
                ($request->header('X-Admin-Email') || $request->has('email'))) {
                
                $email = $request->header('X-Admin-Email') ?? $request->get('email');
                
                \Log::info('Invalid token, trying email fallback for finance route', [
                    'email' => $email
                ]);
                
                return $next($request);
            }
            
            return response()->json(['error' => 'Token is invalid'], 401);
        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            \Log::error('JWT token expired', ['exception' => $e->getMessage()]);
            
            // Try email fallback for finance routes when token is expired
            if ($request->is('api/finance/*') && 
                ($request->header('X-Admin-Email') || $request->has('email'))) {
                
                $email = $request->header('X-Admin-Email') ?? $request->get('email');
                
                \Log::info('Expired token, trying email fallback for finance route', [
                    'email' => $email
                ]);
                
                return $next($request);
            }
            
            return response()->json(['error' => 'Token has expired'], 401);
        } catch (\Tymon\JWTAuth\Exceptions\JWTException $e) {
            \Log::error('JWT exception', ['exception' => $e->getMessage()]);
            
            // Try email fallback for finance routes when JWT exception occurs
            if ($request->is('api/finance/*') && 
                ($request->header('X-Admin-Email') || $request->has('email'))) {
                
                $email = $request->header('X-Admin-Email') ?? $request->get('email');
                
                \Log::info('JWT exception, trying email fallback for finance route', [
                    'email' => $email
                ]);
                
                return $next($request);
            }
            
            return response()->json(['error' => 'Authorization token not found: ' . $e->getMessage()], 401);
        } catch (\Exception $e) {
            \Log::error('Authentication error', ['exception' => $e->getMessage()]);
            return response()->json(['error' => 'Authentication error: ' . $e->getMessage()], 500);
        }

        return $next($request);
    }
    
    public function authenticate(Request $request)
    {
        if ($this->auth->guard('committee')->check()) {
            return $this->auth->shouldUse('committee');
        }
        throw new UnauthorizedHttpException('', 'Unauthenticated.');
    }
}
