// Finance API Types
export interface WelfareFundTransaction {
  id: string;
  transactionId: string;
  type: 'inflow' | 'outflow';
  amount: number;
  category: string;
  description: string;
  receipt_number?: string;
  processed_by?: string;
  application_id?: string;
  balance_after: number;
  remarks?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  admin_name?: string;
  status?: string;
  // Related data
  application?: {
    id: string;
    student_name: string;
    amount_requested: number;
    approved_amount: number;
  };
  processor?: {
    fullName: string;
  };
}

export interface FinanceBalance {
  current_balance: number;
  last_updated: string;
  last_updated_by: string;
}

export interface FinanceSummary {
  current_balance: number;
  total_inflow: number;
  total_outflow: number;
  net_flow: number;
  monthly_stats: MonthlyStats[];
  category_stats: CategoryStats[];
}

export interface MonthlyStats {
  month: number;
  total_inflow: number;
  total_outflow: number;
  transaction_count: number;
}

export interface CategoryStats {
  category: string;
  type: 'inflow' | 'outflow';
  total_amount: number;
  transaction_count: number;
}

export interface StudentApplicationStats {
  monthly_requested: MonthlyApplicationStats[];
  monthly_approved: MonthlyApplicationStats[];
  program_stats: ProgramStats[];
  has_data: boolean;
}

export interface MonthlyApplicationStats {
  month: number;
  total_requested?: number;
  total_approved?: number;
  application_count?: number;
  approved_count?: number;
}

export interface ProgramStats {
  program: string;
  total_requested: number;
  total_approved: number;
  application_count: number;
  approved_count: number;
}

export interface CreateTransactionRequest {
  type: 'inflow' | 'outflow';
  amount: number;
  category: string;
  description: string;
  receipt_number?: string;
  remarks?: string;
  application_id?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTransactionRequest {
  type?: 'inflow' | 'outflow';
  amount?: number;
  category?: string;
  description?: string;
  receipt_number?: string;
  remarks?: string;
  metadata?: Record<string, any>;
}

export interface FinanceFilters {
  type?: 'inflow' | 'outflow';
  category?: string;
  month?: number;
  year?: number;
  per_page?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}
