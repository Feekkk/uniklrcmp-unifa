import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Shield, 
  LogOut, 
  Database,
  Activity,
  UserPlus,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useGetApplicationStatistics, useGetAllApplications } from '@/lib/api/hooks/use-admin-applications';
import { useFinanceDashboard } from '@/lib/api/hooks/use-finance';
import { useUserManagement } from '@/lib/api/hooks/use-user-management';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const adminEmail = localStorage.getItem('admin_email');
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetApplicationStatistics();
  const { data: applications, isLoading: applicationsLoading } = useGetAllApplications();
  const { balance, summary, studentStats, isLoading: financeLoading } = useFinanceDashboard();
  const { users, isLoading: usersLoading } = useUserManagement();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!adminEmail) {
      navigate('/login');
    }
  }, [adminEmail, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Calculate real statistics
  const totalUsers = users?.length || 0;
  const studentUsers = users?.filter(user => user.type === 'student').length || 0;
  const committeeUsers = users?.filter(user => user.type === 'committee').length || 0;
  const totalApplications = stats?.total || 0;
  const pendingApplications = stats?.pending || 0;
  const completedApplications = stats?.completed || 0;
  const needReceiptApplications = stats?.needReceipt || 0;
  
  // Calculate financial data
  const currentBalance = balance?.data?.data?.current_balance || 0;
  const totalDisbursed = summary?.data?.data?.total_outflow || 0;
  const averageAidAmount = completedApplications > 0 ? totalDisbursed / completedApplications : 0;
  
  // Get recent applications (last 3)
  const recentApplications = applications?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img 
                src="/rcmp.png" 
                alt="UniKL Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
                <p className="text-slate-600">System Administration</p>
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
            Welcome, Administrator! 🛡️
          </h2>
          <p className="text-slate-600">
            Manage system users, monitor applications, and oversee platform operations.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/submission')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-900">{statsLoading ? '...' : pendingApplications}</p>
                  <p className="text-xs text-yellow-600 mt-1">Needs admin review</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Applications</p>
                  <p className="text-2xl font-bold text-blue-900">{statsLoading ? '...' : totalApplications}</p>
                  <p className="text-xs text-blue-600 mt-1">Submitted applications</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Need Receipt Upload</p>
                  <p className="text-2xl font-bold text-green-900">{statsLoading ? '...' : needReceiptApplications}</p>
                  <p className="text-xs text-green-600 mt-1">Committee approved</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-purple-900">{statsLoading ? '...' : completedApplications}</p>
                  <p className="text-xs text-purple-600 mt-1">Receipt uploaded</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Review Process Section */}
            <Card className="border-0 shadow-lg bg-white mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Application Review Process</CardTitle>
                <CardDescription>Three-step approval workflow for financial aid applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                  
                  {/* Step 1: Admin Initial Review */}
                  <div className="flex items-start space-x-4 mb-8 relative">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center z-10">
                      <UserPlus className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">1. Admin Initial Review</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        First review of applications by admin:
                      </p>
                      <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                        <li>Initial screening</li>
                        <li>Documentation verification</li>
                        <li>Recommend to committee</li>
                        <li>Reject if ineligible</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 2: Committee Review */}
                  <div className="flex items-start space-x-4 mb-8 relative">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center z-10">
                      <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">2. Committee Review</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        Committee reviews admin-recommended applications:
                      </p>
                      <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                        <li>Review admin recommendations</li>
                        <li>Financial need assessment</li>
                        <li>Final approval decision</li>
                        <li>Amount confirmation</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 3: Receipt Upload */}
                  <div className="flex items-start space-x-4 relative">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center z-10">
                      <Database className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">3. Receipt Processing</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        Final stage after committee approval:
                      </p>
                      <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                        <li>Upload bank receipt</li>
                        <li>Mark as completed</li>
                        <li>Notify student</li>
                        <li>Archive application</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Overview */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">System Users Overview</CardTitle>
                <CardDescription>Monitor all user activities and roles in the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Students */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-blue-900">Students</p>
                        <Badge className="bg-blue-100 text-blue-700">{usersLoading ? '...' : studentUsers} Users</Badge>
                      </div>
                      <p className="text-sm text-blue-700">Active student accounts in the system</p>
                      <p className="text-xs text-blue-600">Total registered students</p>
                    </div>
                  </div>
                </div>

                {/* Committee Members */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-purple-900">Committee Members</p>
                        <Badge className="bg-purple-100 text-purple-700">{usersLoading ? '...' : committeeUsers} Users</Badge>
                      </div>
                      <p className="text-sm text-purple-700">Financial aid committee members</p>
                      <p className="text-xs text-purple-600">Active committee members</p>
                    </div>
                  </div>
                </div>

                {/* View All Users Button */}
                <div className="text-right">
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                    onClick={() => navigate('/admin/userlist')}
                  >
                    View All Users
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Applications */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-900">Recent Applications</CardTitle>
                  <Button 
                    variant="default"
                    onClick={() => navigate('/admin/submission')}
                     className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    View All Applications
                  </Button>
                </div>
                <CardDescription>Recently submitted applications awaiting review</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {applicationsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-slate-500">Loading applications...</p>
                  </div>
                ) : recentApplications.length > 0 ? (
                  recentApplications.map((application, index) => {
                    const getStatusBadge = (status: string) => {
                      const statusConfig: Record<string, { color: string; text: string }> = {
                        'SUBMITTED': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: 'Pending' },
                        'committee_approved': { color: 'bg-green-100 text-green-700 border-green-200', text: 'Committee Approved' },
                        'approved': { color: 'bg-blue-100 text-blue-700 border-blue-200', text: 'Approved' },
                        'rejected': { color: 'bg-red-100 text-red-700 border-red-200', text: 'Rejected' },
                      };
                      const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-700 border-gray-200', text: status };
                      return (
                        <Badge className={`${config.color} border`}>
                          {config.text}
                        </Badge>
                      );
                    };

                    return (
                      <div key={application.applicationId} className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">{application.user?.name || 'Unknown Student'}</h4>
                            <p className="text-sm text-slate-600">{application.user?.course || 'Unknown Course'} • {application.user?.studentId || 'N/A'}</p>
                            <p className="text-xs text-slate-500 mt-1">{application.category?.name || 'Financial Aid'}</p>
                          </div>
                          {getStatusBadge(application.applicationStatus)}
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                          <p>Amount: RM {(application.approvedAmount || application.amountRequested || 0).toLocaleString()}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-500">No applications found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900">Financial Overview</CardTitle>
                </div>
                <CardDescription>Summary of financial aid distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">Total Disbursed</p>
                    <p className="text-xl font-bold text-emerald-700">RM {financeLoading ? '...' : totalDisbursed.toLocaleString()}</p>
                    <p className="text-xs text-slate-600">{completedApplications} approved applications</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">Pending Disbursement</p>
                    <p className="text-xl font-bold text-amber-700">RM {financeLoading ? '...' : (needReceiptApplications * averageAidAmount).toLocaleString()}</p>
                    <p className="text-xs text-slate-600">{needReceiptApplications} pending receipts</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">Average Aid Amount</p>
                    <p className="text-xl font-bold text-blue-700">RM {financeLoading ? '...' : averageAidAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-600">Per approved application</p>
                  </div>
                </div>

                <div className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/stats')}
                    className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                  >
                    View detailed report →
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

export default AdminDashboard;