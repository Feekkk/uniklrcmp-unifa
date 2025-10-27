import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useGetAllApplications } from '@/lib/api/hooks';
import { useExportApplications } from '@/lib/api/hooks/use-application-export';
import { getUserEmailFromToken, getUserRoleFromToken, getStoredToken } from '@/lib/jwt-utils';
import { applicationHelpers, ApplicationExportFilters } from '@/lib/api/services/applications';
const unikLogo = '/rcmp.png';
import { useAuth } from '@/hooks/use-auth';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  DollarSign,
  User,
  MoreHorizontal,
  Shield,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Loader,
  FileSpreadsheet,
  FileImage,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
// Using RCMP logo from public

const AdminSubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [exportPeriod, setExportPeriod] = useState<string>('1_month');
  
  // Export functionality
  const { exportCsv, exportPdf, isExporting } = useExportApplications();
  
  // Debug logs for authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
    }
  }, [isAuthenticated, authLoading, user]);
  
  // Fetch applications from API with automatic refetching
  const { data, isLoading, isError, error, refetch } = useGetAllApplications();

  // Auto-refetch when window regains focus (in case changes were made in another tab)
  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Data Refreshed",
        description: "Application data has been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh application data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Log detailed error if any
  useEffect(() => {
    if (isError) {
    }
  }, [isError, error]);
  
  // Show toast if there's an error
  if (isError) {
    toast({
      title: "Error fetching applications",
      description: "Please try again later or contact support.",
      variant: "destructive",
    });
  }
  
  // Map API data to our application format
  const applications = React.useMemo(() => {
    if (!data || !data.data) return [];
    
    return data.data.map((app: any) => {
      // Normalize status to lowercase for consistent comparison
      const normalizedStatus = app.applicationStatus?.toLowerCase() || 'submitted';
      
      return {
        id: app.applicationId,
        studentName: app.user?.fullName || 'Unknown Student',
        studentId: app.user?.studentId || app.studentId || 'No ID',
        studentEmail: app.user?.email || 'No Email',
        course: app.user?.program || app.course || 'Not specified',
        semester: app.user?.semester?.toString() || app.semester || 'Not specified',
        type: app.purpose || app.category?.name || 'Financial Aid',
        categoryId: app.categoryId || app.category?.categoryId || '',
        requestedAmount: parseFloat(app.amountRequested || '0'),
        committeeApprovedAmount: app.committee ? parseFloat(app.approvedAmount || '0') : 0,
        status: normalizedStatus,
        submittedDate: app.submittedAt || new Date().toISOString(),
        committeeApprovedDate: app.committeeReviewedAt || null,
        committeeReviewer: app.committee?.fullName || 'Committee Member',
        lastUpdated: app.updatedAt || app.submittedAt,
        adminReviewer: app.admin?.fullName || null,
        adminApprovedDate: app.adminReviewedAt || null,
        documents: app.documents?.map((doc: any) => doc.fileName) || [],
        reason: app.justification || 'No reason provided',
        committeeComments: app.committeeComments || 'No comments',
        adminComments: app.adminComments || null,
        finalApprovedAmount: normalizedStatus === 'approved' ? parseFloat(app.approvedAmount || '0') : null,
        disbursementDate: null, // This might need to be updated based on actual data model
        adminRejectionReason: normalizedStatus === 'rejected' ? app.adminComments : null,
        // Add status flags for easier conditional rendering
        hasCommitteeApproval: normalizedStatus === 'committee_approved' || normalizedStatus === 'approved' || normalizedStatus === 'rejected',
        hasAdminApproval: normalizedStatus === 'approved',
        hasAdminRejection: normalizedStatus === 'rejected',
        isSpecialCategory: ['CAT-EMERGENCY-OTHERS', 'CAT-ILLNESS-INPATIENT'].includes(app.categoryId || app.category?.categoryId || ''),
      };
    });
  }, [data]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'committee_approved':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'committee_approved':
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'committee_approved':
        return 'Awaiting Receipt Upload';
      default:
        return 'Unknown';
    }
  };

  // Export handlers
  const handleExportCsv = () => {
    const filters: ApplicationExportFilters = {
      export_period: exportPeriod,
    };
    
    // Map UI status to API status
    if (filterStatus !== 'all') {
      filters.status = applicationHelpers.mapStatusToApi(filterStatus);
    }
    
    // Show toast with current filter info
    const statusText = filterStatus === 'all' ? 'All Applications' : applicationHelpers.getStatusDisplayName(filterStatus);
    const periodText = exportPeriod === '1_month' ? 'Last 1 Month' : 
                      exportPeriod === '3_months' ? 'Last 3 Months' : 'Last 1 Year';
    toast({
      title: "Exporting Applications",
      description: `Exporting ${statusText} for ${periodText} to CSV format...`,
      variant: "default",
    });
    
    exportCsv(filters);
  };

  const handleExportPdf = () => {
    const filters: ApplicationExportFilters = {
      export_period: exportPeriod,
    };
    
    // Map UI status to API status
    if (filterStatus !== 'all') {
      filters.status = applicationHelpers.mapStatusToApi(filterStatus);
    }
    
    // Show toast with current filter info
    const statusText = filterStatus === 'all' ? 'All Applications' : applicationHelpers.getStatusDisplayName(filterStatus);
    const periodText = exportPeriod === '1_month' ? 'Last 1 Month' : 
                      exportPeriod === '3_months' ? 'Last 3 Months' : 'Last 1 Year';
    toast({
      title: "Exporting Applications",
      description: `Exporting ${statusText} for ${periodText} to PDF format...`,
      variant: "default",
    });
    
    exportPdf(filters);
  };



  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      (app.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (app.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (app.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (app.type?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (app.course?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    let statusFilter = true;
    if (filterStatus !== 'all') {
      if (filterStatus === 'committee_approved') {
        // Show applications that are committee approved and awaiting admin review
        statusFilter = app.status === 'committee_approved' || app.status === 'submitted';
      } else {
        statusFilter = app.status === filterStatus;
      }
    }
    
    return matchesSearch && statusFilter;
  });

  const ApplicationCard = ({ application }: { application: any }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow relative">
      {/* Status Indicator Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-lg ${
        application.status === 'approved' ? 'bg-green-500' :
        application.status === 'rejected' ? 'bg-red-500' :
        application.status === 'committee_approved' ? 'bg-blue-500' :
        'bg-gray-400'
      }`}></div>
      
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-900">{application.studentName}</h3>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              application.status === 'approved' ? 'bg-green-100 text-green-700' :
              application.status === 'rejected' ? 'bg-red-100 text-red-700' :
              application.status === 'committee_approved' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {getStatusIcon(application.status)}
              <span>{formatStatus(application.status)}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">
            {application.studentId} • {application.course} • {application.semester}
          </p>
          <p className="text-sm text-slate-500">{application.studentEmail}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">APPLICATION TYPE</p>
            <p className="text-sm font-semibold text-slate-900">{application.type}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">REQUESTED / {application.isSpecialCategory ? 'ADMIN APPROVED' : 'COMMITTEE APPROVED'}</p>
            <p className="text-sm font-semibold text-slate-900">
              RM {application.requestedAmount.toLocaleString()} / RM {application.committeeApprovedAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{application.isSpecialCategory ? 'ADMIN APPROVED DATE' : 'COMMITTEE APPROVED DATE'}</p>
            <p className="text-sm font-semibold text-slate-900">
              {application.committeeApprovedDate ? new Date(application.committeeApprovedDate).toLocaleDateString() : 'Not approved yet'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{application.isSpecialCategory ? 'ADMIN REVIEWER' : 'COMMITTEE REVIEWER'}</p>
            <p className="text-sm font-semibold text-slate-900">{application.committeeReviewer}</p>
          </div>
        </div>


        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500 font-medium mb-2">APPLICATION REASON</p>
          <p className="text-sm text-slate-700 mb-4">{application.reason}</p>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="default"
              size="sm"
              onClick={() => navigate(`/admin/review/${application.id}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const stats = {
    total: applications.length,
    awaitingAdmin: applications.filter(app => app.status === 'committee_approved' || app.status === 'submitted').length,
    adminApproved: applications.filter(app => app.status === 'approved').length,
    adminRejected: applications.filter(app => app.status === 'rejected').length
  };
  
  // Map status from API to UI status
  const mapStatusToUIStatus = (status: string) => {
    if (status.includes('committee_approved')) return 'committee_approved';
    if (status.includes('approved')) return 'approved';
    if (status.includes('rejected')) return 'rejected';
    return status.toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <img 
                src={unikLogo} 
                alt="UniKL Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Final Application Approval</h1>
                <p className="text-slate-600">Review committee-approved applications for final authorization</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isExporting}
                    className="flex items-center space-x-2"
                  >
                    {isExporting ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Export</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold text-slate-700 border-b">
                    Export Period
                  </div>
                  <div className="p-2">
                    <Select value={exportPeriod} onValueChange={setExportPeriod}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1_month">Last 1 Month</SelectItem>
                        <SelectItem value="3_months">Last 3 Months</SelectItem>
                        <SelectItem value="1_year">Last 1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="px-2 py-1.5 text-sm font-semibold text-slate-700 border-b">
                    Export Format
                  </div>
                  <DropdownMenuItem onClick={handleExportCsv} disabled={isExporting}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting}>
                    <FileImage className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Avatar>
                <AvatarFallback className="bg-purple-100 text-purple-700">AD</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-900">Admin Portal</p>
                <p className="text-xs text-slate-500">Final Approval</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Applications</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.awaitingAdmin}</p>
              <p className="text-sm text-slate-600">Awaiting Admin Approval</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.adminApproved}</p>
              <p className="text-sm text-slate-600">Admin Approved</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.adminRejected}</p>
              <p className="text-sm text-slate-600">Admin Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by student name, ID, or application type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Filter by admin status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="committee_approved">Awaiting Admin Approval</SelectItem>
                  <SelectItem value="approved">Admin Approved</SelectItem>
                  <SelectItem value="rejected">Admin Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {isLoading ? (
          <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Applications</h3>
              <p className="text-slate-600">Please wait while we fetch the applications data...</p>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="border-0 shadow-md">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Applications</h3>
              <p className="text-slate-600">There was a problem loading the applications data. Please try again later.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="committee_approved">Awaiting Approval ({stats.awaitingAdmin})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({stats.adminApproved})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({stats.adminRejected})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))
                ) : (
                  <Card className="border-0 shadow-md">
                    <CardContent className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No Applications Found</h3>
                      <p className="text-slate-600">No applications match your current search criteria.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="committee_approved" className="space-y-4">
                {filteredApplications.filter(app => app.status === 'committee_approved' || app.status === 'submitted').length > 0 ? (
                  filteredApplications.filter(app => app.status === 'committee_approved' || app.status === 'submitted').map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))
                ) : (
                  <Card className="border-0 shadow-md">
                    <CardContent className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No Pending Applications</h3>
                      <p className="text-slate-600">There are no applications awaiting admin approval.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4">
                {filteredApplications.filter(app => app.status === 'approved').length > 0 ? (
                  filteredApplications.filter(app => app.status === 'approved').map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))
                ) : (
                  <Card className="border-0 shadow-md">
                    <CardContent className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No Approved Applications</h3>
                      <p className="text-slate-600">There are no applications approved by admin.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4">
                {filteredApplications.filter(app => app.status === 'rejected').length > 0 ? (
                  filteredApplications.filter(app => app.status === 'rejected').map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))
                ) : (
                  <Card className="border-0 shadow-md">
                    <CardContent className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No Rejected Applications</h3>
                      <p className="text-slate-600">There are no applications rejected by admin.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminSubmission;