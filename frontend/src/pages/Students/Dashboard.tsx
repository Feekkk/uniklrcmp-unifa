import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
const unikLogo = '/rcmp.png';
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  Bell,
  ArrowRight,
  Loader2,
  Edit,
  User,
  Clock,
  Send,
  Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetUserProfile } from '@/lib/api/hooks';
// Using RCMP logo from public
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/use-auth';
import { NotificationCenter } from '@/components/NotificationCenter';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: profile, isLoading, error } = useGetUserProfile();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-slate-900 font-medium">Failed to load dashboard data</p>
          <p className="text-sm text-slate-600">Error: {error.message}</p>
          <div className="space-x-3">
            <Button onClick={() => window.location.reload()}>Retry</Button>
            <Button variant="outline" onClick={() => navigate('/login')}>Return to Login</Button>
          </div>
        </div>
      </div>
    );
  }

  const studentInfo = {
    name: profile?.fullName || profile?.name || "-",
    studentId: profile?.id || "-",
    email: profile?.email || "-",
    program: profile?.program || "-",
    semester: profile?.semester ? 
      (profile?.program === 'SARJANA MUDA PERUBATAN DAN SARJANA MUDA PEMBEDAHAN (MBBS)' ? 
        `Year ${profile.semester}` : 
        `Semester ${profile.semester}`) 
      : "-",
    semesterLabel: profile?.program === 'SARJANA MUDA PERUBATAN DAN SARJANA MUDA PEMBEDAHAN (MBBS)' ? 'Year' : 'Semester',
    bankName: profile?.bankName || "-",
    bankAccount: profile?.bankAccount || "-",
    phoneNo: profile?.phoneNo || "-",
    icNo: profile?.icNo || "-",
    address: profile?.address || "-"
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
                <h1 className="text-2xl font-bold text-slate-900">Student Portal</h1>
                <p className="text-slate-600">Financial Aid Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter />
              
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {studentInfo.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-900">{studentInfo.name}</p>
                  <p className="text-xs text-slate-500">Student</p>
                </div>
              </div>

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
            Welcome back, {studentInfo.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-slate-600">
            Manage your financial aid applications and track your progress.
          </p>
        </div>

        {/* Application Process */}
        <Card className="border-0 shadow-lg bg-white mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Application Process</CardTitle>
            <CardDescription>
              Understanding how your financial aid application flows through our system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">1. Submit Application</h3>
                <p className="text-sm text-slate-600">
                  Fill out the application form with required documents and submit for review.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">2. Committee Review</h3>
                <p className="text-sm text-slate-600">
                  The committee reviews your application and makes an initial assessment.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">3. Admin Approval</h3>
                <p className="text-sm text-slate-600">
                  Admin finalizes the approval and processes the disbursement.
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">4. Disbursement</h3>
                <p className="text-sm text-slate-600">
                  Funds are disbursed to your registered bank account.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Important Notes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Regular Categories:</strong> Go directly to admin review after submission</li>
                <li>• <strong>Special Categories:</strong> (Emergency, In-patient Treatment) require committee approval first</li>
                <li>• <strong>Processing Time:</strong> Usually takes 5-10 business days for complete processing</li>
                <li>• <strong>Status Updates:</strong> You'll receive notifications at each step of the process</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Quick Actions</CardTitle>
                <CardDescription>
                  Access your most important features
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <Link 
                  to="/student/form" 
                  className="group block p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-transparent hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Application Form</h3>
                  <p className="text-blue-700 text-sm">
                    Complete your financial aid application with our step-by-step form
                  </p>
                </Link>

                <Link 
                  to="/student/submission" 
                  className="group block p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-transparent hover:border-green-300 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-2">View Applications</h3>
                  <p className="text-green-700 text-sm">
                    Track the status and progress of your submitted applications
                  </p>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Profile Sidebar */}
          <div>
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-900">Profile</CardTitle>
                  <Link to="/student/editprofile">
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                      {studentInfo.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-slate-900">{studentInfo.name}</h3>
                  <p className="text-sm text-slate-600">Student</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Program</span>
                    <span className="text-sm font-medium text-slate-900">{studentInfo.program}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{studentInfo.semesterLabel}</span>
                    <span className="text-sm font-medium text-slate-900">{studentInfo.semester}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Email</span>
                    <span className="text-xs font-medium text-slate-900">{studentInfo.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Phone</span>
                    <span className="text-sm font-medium text-slate-900">{studentInfo.phoneNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">IC Number</span>
                    <span className="text-sm font-medium text-slate-900">{studentInfo.icNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Bank</span>
                    <span className="text-sm font-medium text-slate-900">{studentInfo.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Account No.</span>
                    <span className="text-sm font-medium text-slate-900">{studentInfo.bankAccount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Address</span>
                    <span className="text-xs font-medium text-slate-900 text-right">{studentInfo.address}</span>
                  </div>
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

export default StudentDashboard;