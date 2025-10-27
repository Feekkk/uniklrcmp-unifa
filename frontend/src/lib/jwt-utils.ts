/**
 * Utility functions for JWT token handling
 */

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_BUFFER = 300; // 5 minutes in seconds

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT token and extract payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Store JWT token securely
 * @param token JWT token string
 * @param isRefreshToken Whether this is a refresh token
 */
export function storeToken(token: string, isRefreshToken: boolean = false): void {
  const key = isRefreshToken ? REFRESH_TOKEN_KEY : TOKEN_KEY;
  localStorage.setItem(key, token);
}

/**
 * Get stored JWT token
 * @param isRefreshToken Whether to get refresh token instead of access token
 * @returns Stored token or null if not found
 */
export function getStoredToken(isRefreshToken: boolean = false): string | null {
  const key = isRefreshToken ? REFRESH_TOKEN_KEY : TOKEN_KEY;
  return localStorage.getItem(key);
}

/**
 * Remove stored tokens and email keys
 */
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('student_email');
  localStorage.removeItem('admin_email');
  localStorage.removeItem('committee_email');
}

/**
 * Get user email from JWT token stored in localStorage with fallback options
 * @returns User email or null if not found/invalid
 */
export function getUserEmailFromToken(): string | null {
  // Try standard JWT token
  const token = getStoredToken();
  if (token) {
    const payload = decodeJWT(token);
    if (payload?.email) {
      return payload.email;
    }
  }
  
  // Try student email fallback
  const studentEmail = localStorage.getItem('student_email');
  if (studentEmail) {
    return studentEmail;
  }
  
  // Try committee email fallback
  const committeeEmail = localStorage.getItem('committee_email');
  if (committeeEmail) {
    return committeeEmail;
  }
  
  // Try admin email fallback
  const adminEmail = localStorage.getItem('admin_email');
  if (adminEmail) {
    return adminEmail;
  }
  
  return null;
}

/**
 * Get user role from JWT token stored in localStorage with fallback options
 * @returns User role or null if not found/invalid
 */
export function getUserRoleFromToken(): string | null {
  // Try standard JWT token
  const token = getStoredToken();
  if (token) {
    const payload = decodeJWT(token);
    if (payload?.role) {
      return payload.role;
    }
  }
  
  // Check for temp committee token
  const tempCommitteeToken = localStorage.getItem('temp_committee_token');
  if (tempCommitteeToken && tempCommitteeToken.startsWith('committee:')) {
    return 'committee';
  }
  
  // Check for temp admin token
  const tempAdminToken = localStorage.getItem('temp_admin_token');
  if (tempAdminToken && tempAdminToken.startsWith('admin:')) {
    return 'admin';
  }
  
  // Check for stored role information
  const committeeEmail = localStorage.getItem('committee_email');
  if (committeeEmail) {
    return 'committee';
  }
  
  const adminEmail = localStorage.getItem('admin_email');
  if (adminEmail) {
    return 'admin';
  }
  
  return null;
}

/**
 * Check if JWT token is expired or about to expire
 * @param token JWT token string
 * @param includeBuffer Whether to include expiry buffer time
 * @returns True if expired or about to expire, false otherwise
 */
export function isTokenExpired(token: string, includeBuffer: boolean = true): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const bufferTime = includeBuffer ? TOKEN_EXPIRY_BUFFER : 0;
  return payload.exp < (currentTime + bufferTime);
}

/**
 * Check if current token needs refresh
 * @returns True if token needs refresh, false otherwise
 */
export function needsTokenRefresh(): boolean {
  const token = getStoredToken();
  if (!token) return true;
  
  return isTokenExpired(token, true);
}
