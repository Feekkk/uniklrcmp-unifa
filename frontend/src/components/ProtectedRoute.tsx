import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    // Debug log for authentication status
    console.log('ProtectedRoute auth status:', {
      isAuthenticated,
      isLoading,
      userRole: user?.role,
      requiredRole,
      adminEmail: localStorage.getItem('admin_email'),
      committeeEmail: localStorage.getItem('committee_email')
    });
    
    // Special case for admin pages - allow email-based fallback
    if (!isLoading && !isAuthenticated && window.location.pathname.startsWith('/admin/')) {
      const adminEmail = localStorage.getItem('admin_email');
      if (adminEmail) {
        console.log('Admin email fallback found, not redirecting:', adminEmail);
        return; // Skip redirect if we have admin email for fallback auth
      }
    }
    
    // Special case for committee pages - allow email-based fallback
    if (!isLoading && !isAuthenticated && window.location.pathname.startsWith('/committee/')) {
      const committeeEmail = localStorage.getItem('committee_email');
      if (committeeEmail) {
        console.log('Committee email fallback found, not redirecting:', committeeEmail);
        return; // Skip redirect if we have committee email for fallback auth
      }
    }
    
    // Set redirect URL if not authenticated after loading
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, will redirect to login');
      setRedirectUrl('/login');
    }
  }, [isAuthenticated, isLoading, user, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Handle redirect if needed
  if (redirectUrl) {
    return <Navigate to={redirectUrl} replace />;
  }

  // Role check if specified and we have a user
  if (requiredRole && user && user.role !== requiredRole) {
    console.log(`Role mismatch: required ${requiredRole}, has ${user.role}`);
    return <Navigate to="/login" replace />;
  }

  // If we're here, either we're authenticated or using email fallback
  return <>{children}</>;
}