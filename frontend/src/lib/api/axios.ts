import axios from 'axios';
import { getStoredToken, storeToken, clearTokens, isTokenExpired } from '../jwt-utils';

// Queue to store requests that are waiting for token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add JWT token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Skip token for refresh and login endpoints
    if (config.url?.includes('/auth/refresh') || config.url?.includes('/auth/login')) {
      return config;
    }

    let token = getStoredToken();
    const committeeEmail = localStorage.getItem('committee_email');
    const adminEmail = localStorage.getItem('admin_email');

    // Special handling for committee routes
    if (config.url?.startsWith('/committee/') && !token && committeeEmail) {
      console.log('Using committee email for authentication:', committeeEmail);
      
      // For committee routes without a token but with email, add the email as parameter
      if (!config.params) {
        config.params = {};
      }
      config.params.email = committeeEmail;
      
      // If headers are passed in config, use those instead
      if (!config.headers?.Authorization && config.headers) {
        config.headers['X-Committee-Email'] = committeeEmail;
      }
      
      // Continue with the request even without token
      return config;
    }
    
    // Special handling for admin routes
    if (config.url?.startsWith('/admin/') && !token && adminEmail) {
      console.log('Using admin email for authentication:', adminEmail);
      
      // For admin routes without a token but with email, add the email as parameter
      if (!config.params) {
        config.params = {};
      }
      config.params.email = adminEmail;
      
      // If headers are passed in config, use those instead
      if (!config.headers?.Authorization && config.headers) {
        config.headers['X-Admin-Email'] = adminEmail;
      }
      
      // Continue with the request even without token
      return config;
    }
    
    // Special handling for finance routes (admin only)
    if (config.url?.startsWith('/finance/') && !token && adminEmail) {
      console.log('Using admin email for finance authentication:', adminEmail);
      
      // For finance routes without a token but with admin email, add the email as parameter
      if (!config.params) {
        config.params = {};
      }
      config.params.email = adminEmail;
      
      // If headers are passed in config, use those instead
      if (!config.headers?.Authorization && config.headers) {
        config.headers['X-Admin-Email'] = adminEmail;
      }
      
      // Continue with the request even without token
      return config;
    }
    
    // Also try email fallback for finance routes even when there IS a token (in case token is invalid)
    if (config.url?.startsWith('/finance/') && token && adminEmail) {
      console.log('Finance route with token, but adding admin email as fallback:', adminEmail);
      
      // Add email as parameter for fallback authentication
      if (!config.params) {
        config.params = {};
      }
      config.params.email = adminEmail;
      
      // Also add header for fallback
      if (config.headers) {
        config.headers['X-Admin-Email'] = adminEmail;
      }
    }
    
    // Debug: Log what we're sending for finance routes
    if (config.url?.startsWith('/finance/')) {
      console.log('Finance route request config:', {
        url: config.url,
        hasToken: !!token,
        adminEmail: adminEmail,
        headers: config.headers,
        params: config.params
      });
    }
    
    if (token && config.headers) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // If already refreshing, queue the request
        if (isRefreshing) {
          try {
            await new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });
            token = getStoredToken(); // Get the new token after refresh
          } catch (error) {
            throw error;
          }
        } else {
          // Start refresh process
          isRefreshing = true;
          try {
            const response = await axios.post(`${axiosInstance.defaults.baseURL}/auth/refresh`, {}, {
              headers: { Authorization: `Bearer ${getStoredToken(true)}` } // Use refresh token
            });
            const { access_token, refresh_token } = response.data;
            storeToken(access_token);
            if (refresh_token) {
              storeToken(refresh_token, true);
            }
            token = access_token;
            processQueue();
          } catch (error) {
            processQueue(error);
            clearTokens();
            // Only redirect to login if not a committee route
            if (!config.url?.startsWith('/committee/')) {
              window.location.href = '/login';
            }
            throw error;
          } finally {
            isRefreshing = false;
          }
        }
      }

      config.headers['Authorization'] = `Bearer ${token}`;
      console.debug('Request Config:', {
        url: config.url,
        method: config.method,
        headers: {
          ...config.headers,
          Authorization: 'Bearer [REDACTED]'
        }
      });
    } else if (
      config.url?.startsWith('/student/') && 
      !token && 
      !config.headers?.Authorization
    ) {
      return Promise.reject(new Error('No authentication token found'));
    } else if (
      config.url?.startsWith('/admin/') && 
      !token && 
      !adminEmail &&
      !config.headers?.Authorization
    ) {
      // Temporarily allow admin requests without authentication for testing
      // TODO: Remove this when authentication is properly set up
      // return Promise.reject(new Error('No admin authentication found'));
      console.log('Allowing admin request without authentication for testing');
    }
    
    return config;
  },
  (error) => {
    // Log error details for debugging
    console.error('Request Error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      endpoint: error.config?.url,
      method: error.config?.method
    });
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.debug('Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log detailed error information
    console.error('Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: originalRequest?.url,
      method: originalRequest?.method
    });

    // Handle unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If it's not a refresh token request
      if (!originalRequest.url?.includes('/auth/refresh')) {
        console.error('401 Unauthorized error caught in axios interceptor');
        
        // Check if we're using email-based auth that should bypass token requirements
        const adminEmail = localStorage.getItem('admin_email');
        const committeeEmail = localStorage.getItem('committee_email');
        const isAdminRoute = originalRequest.url?.startsWith('/admin/');
        const isCommitteeRoute = originalRequest.url?.startsWith('/committee/');
        const isFinanceRoute = originalRequest.url?.startsWith('/finance/');
        
        // Public finance routes that don't require authentication
        const publicFinanceRoutes = [
          '/finance/welfare-fund/balance',
          '/finance/welfare-fund/transactions', 
          '/finance/welfare-fund/summary',
          '/finance/student-application-stats'
        ];
        const isPublicFinanceRoute = publicFinanceRoutes.some(route => originalRequest.url?.includes(route));
        
        // Don't redirect for public finance routes or routes with email fallback
        if (isPublicFinanceRoute) {
          console.log('Public finance route, not redirecting to login');
        } else if ((isAdminRoute && !adminEmail) || (isCommitteeRoute && !committeeEmail) || 
            (isFinanceRoute && !adminEmail) || (!isAdminRoute && !isCommitteeRoute && !isFinanceRoute)) {
          console.log('No fallback auth available, redirecting to login');
          clearTokens();
          // Use setTimeout to avoid immediate redirect which can disrupt debugging
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
        } else {
          console.log(`Using ${isAdminRoute ? 'admin' : (isCommitteeRoute ? 'committee' : 'finance')} email fallback, not redirecting`);
        }
      }
    }

    // If it's a 400 error, log additional details
    if (error.response?.status === 400) {
      console.error('Bad Request Details:', {
        validationErrors: error.response.data.errors,
        message: error.response.data.message,
        requestData: originalRequest.data
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;