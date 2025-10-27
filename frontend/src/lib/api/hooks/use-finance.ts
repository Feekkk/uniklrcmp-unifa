import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, financeHelpers } from '../services/finance';
import { 
  FinanceFilters, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  WelfareFundTransaction,
  FinanceBalance,
  FinanceSummary,
  StudentApplicationStats,
  ApiResponse,
  PaginatedResponse
} from '../types/finance';
import { toast } from 'sonner';

// Query keys for React Query
export const financeQueryKeys = {
  all: ['finance'] as const,
  balance: () => [...financeQueryKeys.all, 'balance'] as const,
  transactions: (filters?: FinanceFilters) => [...financeQueryKeys.all, 'transactions', filters] as const,
  summary: (year?: number, month?: number) => [...financeQueryKeys.all, 'summary', year, month] as const,
  studentStats: (year?: number, month?: number) => [...financeQueryKeys.all, 'student-stats', year, month] as const,
  transaction: (id: string) => [...financeQueryKeys.all, 'transaction', id] as const,
};

// Hook to get current welfare fund balance
export const useFinanceBalance = () => {
  return useQuery<ApiResponse<FinanceBalance>>({
    queryKey: financeQueryKeys.balance(),
    queryFn: () => financeApi.getCurrentBalance(),
    staleTime: 0, // Always fetch fresh data
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
};

// Hook to get welfare fund transactions
export const useFinanceTransactions = (filters?: FinanceFilters) => {
  return useQuery<PaginatedResponse<WelfareFundTransaction>>({
    queryKey: financeQueryKeys.transactions(filters),
    queryFn: () => financeApi.getTransactions(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 3,
  });
};

// Hook to get all welfare fund transactions with enhanced filtering
export const useAllFinanceTransactions = (filters?: {
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
}) => {
  return useQuery<PaginatedResponse<WelfareFundTransaction>>({
    queryKey: [...financeQueryKeys.all, 'all-transactions', filters],
    queryFn: () => financeApi.getAllTransactions(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 3,
  });
};

// Hook to get finance summary
export const useFinanceSummary = (year?: number, month?: number) => {
  return useQuery<ApiResponse<FinanceSummary>>({
    queryKey: financeQueryKeys.summary(year, month),
    queryFn: () => financeApi.getSummary(year, month),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    networkMode: 'always'
  });
};

// Hook to get student application statistics
export const useStudentApplicationStats = (year?: number, month?: number) => {
  return useQuery<ApiResponse<StudentApplicationStats>>({
    queryKey: financeQueryKeys.studentStats(year, month),
    queryFn: () => financeApi.getStudentApplicationStats(year, month),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    networkMode: 'always'
  });
};

// Hook to create a new transaction
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionData: CreateTransactionRequest) => 
      financeApi.createTransaction(transactionData),
    onSuccess: async (response) => {
      // Get the current date for proper cache invalidation
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // Force refetch all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: financeQueryKeys.balance(),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({ 
          queryKey: financeQueryKeys.transactions(),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({ 
          queryKey: financeQueryKeys.summary(currentYear, currentMonth),
          refetchType: 'active',
        }),
        // Also invalidate yearly summary
        queryClient.invalidateQueries({ 
          queryKey: financeQueryKeys.summary(currentYear, undefined),
          refetchType: 'active',
        })
      ]);

      // Force an immediate refetch
      await queryClient.refetchQueries({ queryKey: financeQueryKeys.all });
      
      toast.success('Transaction created successfully');
      console.log('Transaction created and data refreshed:', response.data);
    },
    onError: (error: any) => {
      console.error('Failed to create transaction:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create transaction';
      toast.error(errorMessage);
    }
  });
};

// Hook to update a transaction
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, transactionData }: { 
      transactionId: string; 
      transactionData: UpdateTransactionRequest 
    }) => financeApi.updateTransaction(transactionId, transactionData),
    onSuccess: (response, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.balance() });
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.transaction(variables.transactionId) });
      
      toast.success('Transaction updated successfully');
      console.log('Transaction updated:', response.data);
    },
    onError: (error: any) => {
      console.error('Failed to update transaction:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update transaction';
      toast.error(errorMessage);
    }
  });
};

// Hook to delete a transaction
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => financeApi.deleteTransaction(transactionId),
    onSuccess: (response, transactionId) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.balance() });
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.summary() });
      queryClient.removeQueries({ queryKey: financeQueryKeys.transaction(transactionId) });
      
      toast.success('Transaction deleted successfully');
      console.log('Transaction deleted:', transactionId);
    },
    onError: (error: any) => {
      console.error('Failed to delete transaction:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete transaction';
      toast.error(errorMessage);
    }
  });
};

// Hook to get a single transaction
export const useTransaction = (transactionId: string) => {
  return useQuery<ApiResponse<WelfareFundTransaction>>({
    queryKey: financeQueryKeys.transaction(transactionId),
    queryFn: () => financeApi.getTransaction(transactionId),
    enabled: !!transactionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    networkMode: 'always'
  });
};

// Custom hook for finance dashboard data
export const useFinanceDashboard = (year?: number, month?: number) => {
  const balanceQuery = useQuery<ApiResponse<FinanceBalance>>({
    queryKey: financeQueryKeys.balance(),
    queryFn: () => financeApi.getCurrentBalance(),
    staleTime: 0,
    gcTime: 1000 * 60,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
    networkMode: 'always'
  });

  const summaryQuery = useQuery<ApiResponse<FinanceSummary>>({
    queryKey: financeQueryKeys.summary(year, month),
    queryFn: () => financeApi.getSummary(year, month),
    staleTime: 0,
    gcTime: 1000 * 60,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
    networkMode: 'always'
  });

  const studentStatsQuery = useQuery<ApiResponse<StudentApplicationStats>>({
    queryKey: financeQueryKeys.studentStats(year, month),
    queryFn: () => financeApi.getStudentApplicationStats(year, month),
    staleTime: 0,
    gcTime: 1000 * 60,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
    networkMode: 'always'
  });

  const transactionsQuery = useQuery<PaginatedResponse<WelfareFundTransaction>>({
    queryKey: financeQueryKeys.transactions({ year, month, per_page: 10 }),
    queryFn: () => financeApi.getTransactions({
      per_page: 10,
      year,
      month
    }),
    staleTime: 0,
    gcTime: 1000 * 60,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
    networkMode: 'always'
  });

  return {
    balance: balanceQuery,
    summary: summaryQuery,
    studentStats: studentStatsQuery,
    recentTransactions: transactionsQuery,
    isLoading: balanceQuery.isLoading || summaryQuery.isLoading || studentStatsQuery.isLoading || transactionsQuery.isLoading,
    isError: balanceQuery.isError || summaryQuery.isError || studentStatsQuery.isError || transactionsQuery.isError,
    error: balanceQuery.error || summaryQuery.error || studentStatsQuery.error || transactionsQuery.error
  };
};

// Export functions
export const useExportTransactions = () => {
  const queryClient = useQueryClient();

  const exportCsv = useMutation({
    mutationFn: (filters?: FinanceFilters) => financeApi.exportTransactionsCsv(filters),
    onSuccess: (blob, filters) => {
      const filename = financeHelpers.generateExportFilename('csv', filters);
      financeHelpers.downloadBlob(blob, filename);
      toast.success('CSV export completed successfully');
    },
    onError: (error) => {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV. Please try again.');
    }
  });

  const exportPdf = useMutation({
    mutationFn: (filters?: FinanceFilters) => financeApi.exportTransactionsPdf(filters),
    onSuccess: (blob, filters) => {
      const filename = financeHelpers.generateExportFilename('pdf', filters);
      financeHelpers.downloadBlob(blob, filename);
      toast.success('PDF export completed successfully');
    },
    onError: (error) => {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    }
  });

  return {
    exportCsv: exportCsv.mutate,
    exportPdf: exportPdf.mutate,
    isExportingCsv: exportCsv.isPending,
    isExportingPdf: exportPdf.isPending,
    isExporting: exportCsv.isPending || exportPdf.isPending
  };
};

// Export helper functions for use in components
export { financeHelpers };
