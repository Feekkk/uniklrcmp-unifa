import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Wallet, LogOut, Loader2, Plus, Clock, TrendingUp, TrendingDown, Calendar, DollarSign, Eye, EyeOff } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceDashboard, useCreateTransaction } from '@/lib/api/hooks/use-finance';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { 
  FinanceBalance, 
  FinanceSummary, 
  CreateTransactionRequest,
  WelfareFundTransaction,
  ApiResponse,
  PaginatedResponse
} from '@/lib/api/types/finance';
import { TransactionDialog } from '@/components/TransactionDialog';
import { toast } from 'sonner';

const AnimatedNumber = ({ value, duration = 2000, prefix = '', suffix = '', className = '' }: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  React.useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    setIsAnimating(true);
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={`${className} ${isAnimating ? 'animate-pulse' : ''}`}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

const FinanceOverview = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAllAmountsVisible, setIsAllAmountsVisible] = useState(false);

  // Fetch finance data from API
  const { balance, summary, recentTransactions, isLoading, isError, error } = useFinanceDashboard(selectedYear);
  
  // Transaction creation hook
  const createTransactionMutation = useCreateTransaction();

  // Process yearly cash flow data from API (aggregated from monthly stats)
  const yearlyCashFlow = useMemo(() => {
    // Extract the actual data from the API response
    const summaryData = (summary.data as any)?.data;
    
    if (!summaryData?.monthly_stats || !Array.isArray(summaryData.monthly_stats)) {
      return [];
    }

    // Group monthly stats by year and aggregate
    const yearMap = new Map();
    
    summaryData.monthly_stats.forEach((stat: any) => {
      const year = new Date().getFullYear(); // Current year since backend filters by year
      if (!yearMap.has(year)) {
        yearMap.set(year, {
          year: year,
          inflow: 0,
          outflow: 0,
          net: 0,
          transactionCount: 0
        });
      }
      
      const yearData = yearMap.get(year);
      yearData.inflow += parseFloat(stat.total_inflow) || 0;
      yearData.outflow += parseFloat(stat.total_outflow) || 0;
      yearData.transactionCount += stat.transaction_count || 0;
      yearData.net = yearData.inflow - yearData.outflow;
    });

    return Array.from(yearMap.values());
  }, [summary.data]);

  // Donut chart colors
  const COLORS = {
    inflow: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'],
    outflow: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']
  };

  // Process donut chart data for selected year
  const donutChartData = useMemo(() => {
    const yearData = yearlyCashFlow.find(item => item.year === selectedYear);
    const summaryData = (summary.data as any)?.data;
    
    if (!yearData) {
      return {
        inflow: [],
        outflow: [],
        totalInflow: 0,
        totalOutflow: 0,
        netFlow: 0
      };
    }

    // Use actual category data from backend if available
    let inflowData: any[] = [];
    let outflowData: any[] = [];
    
    if (summaryData?.category_stats && Array.isArray(summaryData.category_stats)) {
      const categoryStats = summaryData.category_stats;
      let inflowIndex = 0;
      let outflowIndex = 0;
      
      categoryStats.forEach((stat: any) => {
        if (stat.type === 'inflow' && stat.total_amount > 0) {
          inflowData.push({
            name: stat.category,
            value: parseFloat(stat.total_amount),
            color: COLORS.inflow[inflowIndex % COLORS.inflow.length]
          });
          inflowIndex++;
        } else if (stat.type === 'outflow' && stat.total_amount > 0) {
          outflowData.push({
            name: stat.category,
            value: parseFloat(stat.total_amount),
            color: COLORS.outflow[outflowIndex % COLORS.outflow.length]
          });
          outflowIndex++;
        }
      });
    }
    
    // Fallback to sample data if no category stats available
    if (inflowData.length === 0 && yearData.inflow > 0) {
      inflowData = [
        { name: 'Government Grant', value: yearData.inflow * 0.4, color: COLORS.inflow[0] },
        { name: 'Donations', value: yearData.inflow * 0.3, color: COLORS.inflow[1] },
        { name: 'Fundraising', value: yearData.inflow * 0.2, color: COLORS.inflow[2] },
        { name: 'Investment Return', value: yearData.inflow * 0.1, color: COLORS.inflow[3] }
      ].filter(item => item.value > 0);
    }
    
    if (outflowData.length === 0 && yearData.outflow > 0) {
      outflowData = [
        { name: 'Student Aid', value: yearData.outflow * 0.5, color: COLORS.outflow[0] },
        { name: 'Administrative', value: yearData.outflow * 0.2, color: COLORS.outflow[1] },
        { name: 'Operational', value: yearData.outflow * 0.15, color: COLORS.outflow[2] },
        { name: 'Maintenance', value: yearData.outflow * 0.1, color: COLORS.outflow[3] },
        { name: 'Equipment', value: yearData.outflow * 0.05, color: COLORS.outflow[4] }
      ].filter(item => item.value > 0);
    }

    return {
      inflow: inflowData,
      outflow: outflowData,
      totalInflow: yearData.inflow,
      totalOutflow: yearData.outflow,
      netFlow: yearData.net
    };
  }, [yearlyCashFlow, selectedYear, summary.data]);

  // Get available years (for now, just current year since backend filters by year)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return yearlyCashFlow.length > 0 ? [currentYear] : [currentYear];
  }, [yearlyCashFlow]);

  // Custom tooltip for donut charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xl backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <p className="font-semibold text-slate-900">{data.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-600">
              Amount: <span className="font-medium text-slate-900">
                {isAllAmountsVisible ? `RM ${data.value.toLocaleString()}` : '••••••'}
              </span>
            </p>
            <p className="text-slate-600">
              Percentage: <span className="font-medium text-slate-900">
                {isAllAmountsVisible ? 
                  `${((data.value / (data.name.includes('Grant') || data.name.includes('Donations') || data.name.includes('Fundraising') || data.name.includes('Investment') ? donutChartData.totalInflow : donutChartData.totalOutflow)) * 100).toFixed(1)}%` 
                  : '••••••'
                }
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Process data from API
  const financeData = useMemo(() => {
    // Extract the actual data from the API response
    const balanceData = (balance.data as any)?.data as FinanceBalance | undefined;
    const summaryData = (summary.data as any)?.data as FinanceSummary | undefined;
    const transactionsData = (recentTransactions?.data as PaginatedResponse<WelfareFundTransaction>)?.data;
    
    const data = {
      currentBalance: balanceData?.current_balance || 0,
      lastUpdated: balanceData?.last_updated || new Date().toISOString(),
      lastUpdatedBy: balanceData?.last_updated_by || 'System',
      totalInflow: summaryData?.total_inflow || 0,
      totalOutflow: summaryData?.total_outflow || 0,
      transactions: transactionsData || []
    };
    return data;
  }, [balance.data, summary.data, recentTransactions?.data]);


  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Handle transaction creation
  const handleCreateTransaction = async (transactionData: CreateTransactionRequest) => {
    try {
      await createTransactionMutation.mutateAsync(transactionData);

      toast.success('Transaction created successfully!');
      
    } catch (error) {
      toast.error('Failed to create transaction. Please try again.');
      throw error; // Re-throw to prevent dialog from closing
    }
  };

  // Get current balance for the dialog
  const currentBalance = (balance.data as ApiResponse<FinanceBalance>)?.data?.current_balance || 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-3">
                  <img 
                    src="/rcmp.png" 
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
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Financial Overview</h1>
                <p className="text-slate-600 mt-2">Loading financial data...</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <Skeleton className="w-16 h-6 rounded-full" />
                    </div>
                    <Skeleton className="w-24 h-4 mb-2" />
                    <Skeleton className="w-20 h-8" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-slate-600">Loading financial data...</span>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-3">
                  <img 
                    src="/rcmp.png" 
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
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Financial Overview</h1>
                <p className="text-slate-600 mt-2">Error loading financial data</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Financial Data</h2>
                <p className="text-slate-600 mb-4">
                  {error?.message || 'An error occurred while loading the financial data. Please try again.'}
                </p>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
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
                    src="/rcmp.png" 
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
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welfare Fund Management</h1>
              <p className="text-slate-600 mt-2">
                Manage and track welfare fund balance
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAllAmountsVisible(!isAllAmountsVisible)}
                className="flex items-center space-x-2 hover:bg-slate-100 transition-all duration-200"
                title={isAllAmountsVisible ? "Hide all amounts" : "Show all amounts"}
              >
                {isAllAmountsVisible ? (
                  <EyeOff className="w-4 h-4 text-slate-600" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-sm font-medium">
                  {isAllAmountsVisible ? "Hide Amounts" : "Show Amounts"}
                </span>
              </Button>
              <Button
                onClick={() => setIsTransactionDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Transaction
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Current Balance */}
          <div className="mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Wallet className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-600 mb-2">Current Fund Balance</h2>
                  <p className="text-4xl font-bold text-slate-900 mb-2">
                    {isAllAmountsVisible ? (
                      <AnimatedNumber 
                        value={financeData.currentBalance} 
                        prefix="RM " 
                        className="text-4xl font-bold text-slate-900"
                        duration={1500}
                      />
                    ) : (
                      <span className="text-4xl font-bold text-slate-900">••••••</span>
                    )}
                  </p>
                  <div className="flex items-center text-sm text-slate-500 mt-4">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Last updated: {new Date(financeData.lastUpdated).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Yearly Cash Flow Analysis */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>Yearly Cash Flow Analysis</span>
                  </CardTitle>
                  <CardDescription>Detailed breakdown of income and expenses by category</CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/transactions')}
                    className="flex items-center space-x-2"
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>View Transactions</span>
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-slate-600">Loading financial data...</span>
                  </div>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 bg-slate-50 rounded-lg">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Error Loading Data</h3>
                  <p className="text-sm text-center max-w-md">
                    {error?.message || 'Failed to load financial data. Please try again.'}
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : yearlyCashFlow.length > 0 && donutChartData.totalInflow + donutChartData.totalOutflow > 0 ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Total Inflow</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        {isAllAmountsVisible ? (
                          <AnimatedNumber 
                            value={donutChartData.totalInflow} 
                            prefix="RM " 
                            className="text-2xl font-bold text-green-900"
                            duration={1000}
                          />
                        ) : (
                          <span className="text-2xl font-bold text-green-900">••••••</span>
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Total Outflow</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900 mt-1">
                        {isAllAmountsVisible ? (
                          <AnimatedNumber 
                            value={donutChartData.totalOutflow} 
                            prefix="RM " 
                            className="text-2xl font-bold text-red-900"
                            duration={1000}
                          />
                        ) : (
                          <span className="text-2xl font-bold text-red-900">••••••</span>
                        )}
                      </p>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${
                      donutChartData.netFlow >= 0 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <DollarSign className={`w-5 h-5 ${
                          donutChartData.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                        }`} />
                        <span className={`text-sm font-medium ${
                          donutChartData.netFlow >= 0 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          Net Flow
                        </span>
                      </div>
                      <p className={`text-2xl font-bold mt-1 ${
                        donutChartData.netFlow >= 0 ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {isAllAmountsVisible ? (
                          <AnimatedNumber 
                            value={Math.abs(donutChartData.netFlow)} 
                            prefix={donutChartData.netFlow >= 0 ? '+RM ' : '-RM '} 
                            className={`text-2xl font-bold ${donutChartData.netFlow >= 0 ? 'text-green-900' : 'text-red-900'}`}
                            duration={1000}
                          />
                        ) : (
                          <span className={`text-2xl font-bold ${donutChartData.netFlow >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                            ••••••
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Donut Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Inflow Chart */}
                    {donutChartData.inflow.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <span>Inflow Breakdown</span>
                        </h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={donutChartData.inflow}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={120}
                                paddingAngle={2}
                                dataKey="value"
                                animationBegin={0}
                                animationDuration={800}
                              >
                                {donutChartData.inflow.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                    style={{
                                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                    }}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend 
                                verticalAlign="bottom" 
                                height={36}
                                formatter={(value, entry) => (
                                  <span className="text-slate-600 text-sm">
                                    {value} ({isAllAmountsVisible ? 
                                      `${(entry.payload as any).percentage?.toFixed(1) || '0.0'}%` 
                                      : '••••••'
                                    })
                                  </span>
                                )}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Outflow Chart */}
                    {donutChartData.outflow.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                          <TrendingDown className="w-5 h-5 text-red-600" />
                          <span>Outflow Breakdown</span>
                        </h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={donutChartData.outflow}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={120}
                                paddingAngle={2}
                                dataKey="value"
                                animationBegin={0}
                                animationDuration={800}
                              >
                                {donutChartData.outflow.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                    style={{
                                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                    }}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend 
                                verticalAlign="bottom" 
                                height={36}
                                formatter={(value, entry) => (
                                  <span className="text-slate-600 text-sm">
                                    {value} ({isAllAmountsVisible ? 
                                      `${(entry.payload as any).percentage?.toFixed(1) || '0.0'}%` 
                                      : '••••••'
                                    })
                                  </span>
                                )}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category Legend */}
                  <div className="pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Category Legend</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[...donutChartData.inflow, ...donutChartData.outflow].map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-slate-600">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 bg-slate-50 rounded-lg">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Transaction Data</h3>
                  <p className="text-sm text-center max-w-md">
                    No financial transactions have been recorded for {selectedYear}. Create your first transaction to see the yearly cash flow analysis.
                  </p>
                  <Button
                    onClick={() => setIsTransactionDialogOpen(true)}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Transaction
                  </Button>
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
        isLoading={createTransactionMutation.isPending}
        currentBalance={currentBalance}
      />
      <Footer />
    </div>
  );
};

export default FinanceOverview;
