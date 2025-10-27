import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
const unikLogo = '/rcmp.png';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, ArrowLeft, Search, Filter, Download, Calendar, LogOut, Loader2, Plus, FileText, ChevronDown } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { financeHelpers, useAllFinanceTransactions, useExportTransactions } from '@/lib/api/hooks/use-finance';
import { PaginatedResponse, WelfareFundTransaction } from '@/lib/api/types/finance';
import { TransactionDialog } from '@/components/TransactionDialog';
import { toast } from '@/hooks/use-toast';


const AllTransactions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  // Prepare filters for API call
  const apiFilters = useMemo(() => ({
    search: searchTerm || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    per_page: 20,
    page: currentPage,
    sort_by: 'created_at',
    sort_order: 'desc'
  }), [searchTerm, typeFilter, categoryFilter, currentPage]);

  // Fetch transactions from API
  const { 
    data: transactionsResponse, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useAllFinanceTransactions(apiFilters);

  // Export functionality
  const { exportCsv, exportPdf, isExporting } = useExportTransactions();

  // Extract transactions from API response
  const transactions = useMemo(() => {
    if (!transactionsResponse?.data) {
      return [];
    }
    return transactionsResponse.data;
  }, [transactionsResponse]);

  // Get pagination info
  const pagination = useMemo(() => {
    if (!transactionsResponse) return null;
    return {
      current_page: transactionsResponse.current_page || 1,
      last_page: transactionsResponse.last_page || 1,
      per_page: transactionsResponse.per_page || 20,
      total: transactionsResponse.total || 0,
      from: transactionsResponse.from || 0,
      to: transactionsResponse.to || 0
    };
  }, [transactionsResponse]);

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  function handleLogout(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    window.location.href = '/login';
  }

  // Handle transaction creation
  const handleCreateTransaction = async (data: any) => {
    try {
      setIsTransactionDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to create transaction',
        description: 'Please try again.',
      });
    }
  };

  // Handle export functions
  const handleExportCsv = () => {
    const exportFilters = {
      type: typeFilter !== 'all' ? (typeFilter as 'inflow' | 'outflow') : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      search: searchTerm || undefined,
    };
    exportCsv(exportFilters);
  };

  const handleExportPdf = () => {
    const exportFilters = {
      type: typeFilter !== 'all' ? (typeFilter as 'inflow' | 'outflow') : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      search: searchTerm || undefined,
    };
    exportPdf(exportFilters);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
    refetch();
  };

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-3">
                  <img 
                    src={unikLogo} 
                    alt="UniKL Logo" 
                    className="h-12 w-12 object-contain"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">RCMP UniFA</h1>
                    <p className="text-sm text-slate-600">UniKL RCMP Financial Aids</p>
                  </div>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-slate-600">Loading transactions...</span>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-3">
                <img 
                  src={unikLogo} 
                  alt="UniKL Logo" 
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">RCMP UniFA</h1>
                  <p className="text-sm text-slate-600">UniKL RCMP Financial Aids</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/finance')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Finance
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">All Transactions</h1>
                <p className="text-slate-600 mt-2">
                  Complete transaction history and management
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white hover:bg-slate-50"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCsv} disabled={isExporting}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => setIsTransactionDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Transaction
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <Select value={typeFilter} onValueChange={(value) => {
                    setTypeFilter(value);
                    handleFilterChange();
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="inflow">Inflow</SelectItem>
                      <SelectItem value="outflow">Outflow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <Select value={categoryFilter} onValueChange={(value) => {
                    setCategoryFilter(value);
                    handleFilterChange();
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="government_grant">Government Grant</SelectItem>
                      <SelectItem value="donation">Donation</SelectItem>
                      <SelectItem value="fundraising">Fundraising</SelectItem>
                      <SelectItem value="investment_return">Investment Return</SelectItem>
                      <SelectItem value="student_aid">Student Aid</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Actions</label>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('all');
                      setCategoryFilter('all');
                      setCurrentPage(1);
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Transactions List */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    {pagination ? `${pagination.from}-${pagination.to} of ${pagination.total} transactions` : 'Loading...'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isError ? (
                  <div className="text-center py-12">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Error loading transactions</h3>
                    <p className="text-slate-600 mb-4">
                      {error?.message || 'Failed to load transactions. Please try again.'}
                    </p>
                    <Button onClick={() => refetch()}>
                      Retry
                    </Button>
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          transaction.type === 'inflow' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'inflow' ? (
                            <ArrowDown className="w-6 h-6 text-green-600" />
                          ) : (
                            <ArrowUp className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold text-slate-900">
                              {getCategoryLabel(transaction.category)}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {transaction.status || 'completed'}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm mb-1">
                            {transaction.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </div>
                            {transaction.receipt_number && (
                              <div>
                                Receipt: {transaction.receipt_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          transaction.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'inflow' ? '+' : '-'}{financeHelpers.formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-slate-400 text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No transactions found</h3>
                    <p className="text-slate-600 mb-4">
                      Try adjusting your search criteria or filters
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setCategoryFilter('all');
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing {pagination.from} to {pagination.to} of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= pagination.last_page}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Transaction Dialog */}
      <TransactionDialog
        isOpen={isTransactionDialogOpen}
        onClose={() => setIsTransactionDialogOpen(false)}
        onSubmit={handleCreateTransaction}
        isLoading={false}
        currentBalance={0} // You can get this from your finance data
      />
      
      <Footer />
    </div>
  );
};

export default AllTransactions;
