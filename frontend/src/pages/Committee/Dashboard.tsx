import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Eye, 
  Clock, 
  CheckCircle, 
  Users, 
  LogOut, 
  Bell,
  Search,
  Filter,
  UserCheck,
  ClipboardList,
  CheckSquare,
  XSquare,
  Loader2
} from 'lucide-react';
// Using RCMP logo from public
const unikLogo = '/rcmp.png';
import { useGetCommitteeDashboardStats, useGetCommitteeApplications } from '@/lib/api/hooks';
import { useAuth } from '@/hooks/use-auth';

const CommitteeDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const { data, isError: statsError } = useGetCommitteeDashboardStats();
  const stats = data?.data ?? { pendingReview: 0, approved: 0, rejected: 0, total: 0, totalAmount: 0 };
  
  const { 
    data: appsData, 
    isLoading: appsLoading, 
    isError: appsError,
    error: appsErrorDetails
  } = useGetCommitteeApplications();
  
  // Log details if there's an error
  React.useEffect(() => {
    if (appsError) {
      console.error('Committee applications error details:', appsErrorDetails);
    }
  }, [appsError, appsErrorDetails]);
  
  const apps = (appsData?.data?.applications ?? []) as any[];
  const topPending = apps.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img 
                src={unikLogo} 
                alt="UniKL Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Committee Portal</h1>
                <p className="text-slate-600">Application Review System</p>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Committee Dashboard 👋
          </h2>
          <p className="text-slate-600">
            Review and manage student financial aid applications efficiently.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.pendingReview}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Reviewed</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Pending Applications */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Pending Applications</CardTitle>
                    <CardDescription>Applications requiring your review</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/committee/submission')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {appsLoading && (
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                )}
                {appsError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-600">Error loading applications</h4>
                    <p className="text-sm text-red-500">
                      There was a problem fetching committee applications. Please refresh or contact support.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                      Refresh Page
                    </Button>
                  </div>
                )}
                {!appsLoading && !appsError && topPending.length === 0 && (
                  <div className="text-sm text-slate-600">No pending applications</div>
                )}
                {!appsLoading && !appsError && topPending.map((a) => (
                  <div key={a.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{a.type}</h4>
                        <p className="text-sm text-slate-600">Student: {a.studentName} ({a.studentId})</p>
                        <p className="text-sm text-slate-500">Amount: RM {(a.requestedAmount ?? a.suggestedAmount ?? 0).toLocaleString()} • Submitted: {a.submittedDate || '-'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => navigate('/committee/submission')}>
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Committee Guidelines */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Committee Guidelines</CardTitle>
                <CardDescription>How to review applications effectively</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 h-6 w-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-slate-700">
                        Open the Submissions page and pick an eligible application.
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 h-6 w-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-slate-700">
                        Verify student details, category, and documents for completeness.
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 h-6 w-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-slate-700">
                        Write clear remarks justifying your decision.
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 h-6 w-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-slate-700">
                        Approve or Reject the application accordingly.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-slate-700">
                  Note: For Outpatient and Emergency (Others), once approved, Admin will upload the official receipt.
                </div>
                <div className="pt-1">
                  <Button variant="outline" className="w-full justify-center" onClick={() => navigate('/committee/submission')}>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Open Submissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CommitteeDashboard;