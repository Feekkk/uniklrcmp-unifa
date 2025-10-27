import axiosInstance from '../axios';
import {
  WelfareFundTransaction,
  FinanceBalance,
  FinanceSummary,
  StudentApplicationStats,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  FinanceFilters,
  ApiResponse,
  PaginatedResponse
} from '../types/finance';

export const financeApi = {
  // Get current welfare fund balance
  getCurrentBalance: async (): Promise<ApiResponse<FinanceBalance>> => {
    const response = await axiosInstance.get('/finance/welfare-fund/balance');
    return response.data;
  },

  // Get all welfare fund transactions with optional filters
  getTransactions: async (filters?: FinanceFilters): Promise<PaginatedResponse<WelfareFundTransaction>> => {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());

    const response = await axiosInstance.get(`/finance/welfare-fund/transactions?${params.toString()}`);
    return response.data;
  },

  // Get all welfare fund transactions with enhanced search and filtering
  getAllTransactions: async (filters?: {
    search?: string;
    type?: string;
    category?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
    page?: number;
  }): Promise<PaginatedResponse<WelfareFundTransaction>> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    const response = await axiosInstance.get(`/finance/welfare-fund/all-transactions?${params.toString()}`);
    return response.data.data; // Extract the actual data from the API response wrapper
  },

  // Get welfare fund summary with statistics
  getSummary: async (year?: number, month?: number): Promise<ApiResponse<FinanceSummary>> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await axiosInstance.get(`/finance/welfare-fund/summary?${params.toString()}`);
    return response.data;
  },

  // Get student application statistics
  getStudentApplicationStats: async (year?: number, month?: number): Promise<ApiResponse<StudentApplicationStats>> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await axiosInstance.get(`/finance/student-application-stats?${params.toString()}`);
    return response.data;
  },

  // Create a new welfare fund transaction (Admin only)
  createTransaction: async (transactionData: CreateTransactionRequest): Promise<ApiResponse<WelfareFundTransaction>> => {
    const response = await axiosInstance.post('/finance/welfare-fund/transaction', transactionData);
    return response.data;
  },

  // Update welfare fund transaction (Admin only)
  updateTransaction: async (transactionId: string, transactionData: UpdateTransactionRequest): Promise<ApiResponse<WelfareFundTransaction>> => {
    const response = await axiosInstance.put(`/finance/welfare-fund/transaction/${transactionId}`, transactionData);
    return response.data;
  },

  // Delete welfare fund transaction (Admin only)
  deleteTransaction: async (transactionId: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`/finance/welfare-fund/transaction/${transactionId}`);
    return response.data;
  },

  // Get transaction by ID
  getTransaction: async (transactionId: string): Promise<ApiResponse<WelfareFundTransaction>> => {
    const response = await axiosInstance.get(`/finance/welfare-fund/transaction/${transactionId}`);
    return response.data;
  },

  // Export transactions to CSV
  exportTransactionsCsv: async (filters?: FinanceFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    // Add admin email for authentication
    const adminEmail = localStorage.getItem('admin_email');
    if (adminEmail) {
      params.append('email', adminEmail);
    }

    const response = await axiosInstance.get(`/finance/welfare-fund/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export transactions to PDF
  exportTransactionsPdf: async (filters?: FinanceFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    // Add admin email for authentication
    const adminEmail = localStorage.getItem('admin_email');
    if (adminEmail) {
      params.append('email', adminEmail);
    }

    const response = await axiosInstance.get(`/finance/welfare-fund/export-pdf?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }
};

// Helper functions for common operations
export const financeHelpers = {
  // Format currency for display
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount);
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Get month name from number
  getMonthName: (month: number): string => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1] || 'Unknown';
  },

  // Calculate percentage change
  calculatePercentageChange: (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  },

  // Get transaction type color
  getTransactionTypeColor: (type: 'inflow' | 'outflow'): string => {
    return type === 'inflow' ? 'text-green-600' : 'text-red-600';
  },

  // Get transaction type icon
  getTransactionTypeIcon: (type: 'inflow' | 'outflow'): string => {
    return type === 'inflow' ? '↗' : '↘';
  },

  // Validate transaction amount
  validateAmount: (amount: number): boolean => {
    return amount > 0 && amount <= 999999999.99;
  },

  // Download blob as file
  downloadBlob: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Generate filename for exports
  generateExportFilename: (format: 'csv' | 'pdf', filters?: FinanceFilters): string => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    let filename = `welfare_fund_transactions_${timestamp}`;
    
    if (filters?.year) {
      filename += `_${filters.year}`;
    }
    if (filters?.month) {
      filename += `_${filters.month.toString().padStart(2, '0')}`;
    }
    if (filters?.type) {
      filename += `_${filters.type}`;
    }
    if (filters?.category) {
      filename += `_${filters.category}`;
    }
    
    return `${filename}.${format}`;
  }
};

export default financeApi;
