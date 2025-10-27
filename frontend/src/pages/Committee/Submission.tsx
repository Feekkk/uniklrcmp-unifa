import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useGetCommitteeApplications } from '@/lib/api/hooks';
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
  ChevronDown,
  SortAsc,
  ThumbsUp
} from 'lucide-react';
// Using the new logo from public path as per memory
const unikLogo = '/rcmp.png';
import { Footer } from '@/components/Footer';

const CommitteeSubmission = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const { data, isLoading, isError, error } = useGetCommitteeApplications();

  const handleApprove = (application: any) => {
    setSelectedApplication(application);
    setShowApprovalDialog(true);
  };

  const confirmApproval = () => {
    setShowApprovalDialog(false);
    setSelectedApplication(null);
  };

  const applications = useMemo(() => {
    const list = data?.data?.applications ?? [];
    return list.map((app: any) => {
      const rawStatus = (app.status || '').toString();
      const normalized = rawStatus.toLowerCase();
      // Map backend statuses to UI buckets
      const statusMap: Record<string, string> = {
        submitted: 'pending',
        'under_review': 'under_review',
        pending: 'pending',
        admin_suggested: 'under_review',
        committee_reviewing: 'under_review',
        committee_approved: 'approved',
        committee_rejected: 'rejected',
        approved: 'approved',
        rejected: 'rejected',
      };
      const uiStatus = statusMap[normalized] ?? 'pending';
      
      // Map category ID to display type
      const getApplicationType = (categoryId: string) => {
        switch (categoryId) {
          case 'CAT-ILLNESS-INPATIENT':
            return 'In-patient Treatment';
          case 'CAT-ILLNESS-OUTPATIENT':
            return 'Out-patient Treatment';
          case 'CAT-ILLNESS-CHRONIC':
            return 'Chronic Illness Treatment';
          case 'CAT-EMERGENCY-NATURAL':
            return 'Natural Disaster Emergency';
          case 'CAT-EMERGENCY-FAMILY':
            return 'Family Emergency';
          case 'CAT-EMERGENCY-OTHERS':
            return 'Other Emergency';
          case 'CAT-BEREAVEMENT':
            return 'Bereavement (Khairat)';
          default:
            return app.type || 'Financial Aid Application';
        }
      };
      
      return ({
      id: app.id,
      studentName: app.studentName,
      studentId: app.studentId,
      studentEmail: app.studentEmail,
      course: app.course,
      type: getApplicationType(app.categoryDetails?.fundCategory || app.categoryId || ''),
      amount: Number(app.requestedAmount ?? app.suggestedAmount ?? 0),
      status: uiStatus,
      submittedDate: app.submittedDate,
      lastUpdated: app.lastUpdated,
      reviewer: app.adminReviewer,
      reason: app.purpose ?? app.justification ?? '',
      familyIncome: 'N/A',
      cgpa: app.cgpa ?? 'N/A',
      approvedAmount: app.suggestedAmount,
      disbursementDate: null,
    });
    });
  }, [data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
      case 'under_review':
        return <Eye className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
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
      case 'under_review':
        return 'Under Review';
      case 'pending':
        return 'Pending Review';
      default:
        return 'Unknown';
    }
  };

  // Filter and search applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const ApplicationCard = ({ application }: { application: any }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-900">{application.studentName}</h3>
            </div>
            <p className="text-sm text-slate-600 mb-1">
              {application.studentId} • {application.course}
            </p>
            <p className="text-sm text-slate-500">{application.studentEmail}</p>
          </div>
          <Badge className={`${getStatusColor(application.status)} border`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(application.status)}
              <span>{formatStatus(application.status)}</span>
            </div>
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">APPLICATION TYPE</p>
            <p className="text-sm font-semibold text-slate-900">{application.type}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">REQUESTED AMOUNT</p>
            <p className="text-sm font-semibold text-slate-900">RM {application.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">SUBMITTED</p>
            <p className="text-sm font-semibold text-slate-900">{new Date(application.submittedDate).toLocaleDateString()}</p>
          </div>
        </div>

        {application.status === 'approved' && application.approvedAmount && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">Approved: RM {application.approvedAmount.toLocaleString()}</p>
                <p className="text-green-600 text-sm">Disbursement: {new Date(application.disbursementDate).toLocaleDateString()}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        )}

        {application.status === 'rejected' && application.rejectionReason && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
            <div className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Rejection Reason</p>
                <p className="text-red-600 text-sm">{application.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500 font-medium mb-2">APPLICATION REASON</p>
          <p className="text-sm text-slate-700 mb-4">{application.reason}</p>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/committee/review/${application.id}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Review Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    underReview: applications.filter(app => app.status === 'under_review').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/committee/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <img 
                src={unikLogo} 
                alt="UniKL Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Application Management</h1>
                <p className="text-slate-600">Review and manage In-patient Treatment and Other Emergency applications</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-green-100 text-green-700">CU</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-900">Committee Portal</p>
                <p className="text-xs text-slate-500">Application Review</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Committee Scope Notice */}
        <Card className="border-0 shadow-md mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Committee Review Scope</h3>
                <p className="text-sm text-blue-700">
                  You can review applications for: <strong>In-patient Treatment</strong> and <strong>Other Emergency</strong> categories only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Applications</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-slate-600">Pending Review</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
              <p className="text-sm text-slate-600">Under Review</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-slate-600">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-sm text-slate-600">Rejected</p>
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
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Submitted</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {isLoading ? (
          <Card className="border-0 shadow-md">
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Applications</h3>
              <p className="text-slate-600">Please wait while we fetch the applications...</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filteredApplications.filter(app => app.status === 'pending').map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {filteredApplications.filter(app => app.status === 'approved').map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {filteredApplications.filter(app => app.status === 'rejected').map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>
        </Tabs>
        )}

        {isError && (
          <Card className="border-0 shadow-md">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Applications</h3>
              <p className="text-slate-600 mb-4">There was an error loading the applications. Please try again.</p>
              <p className="text-sm text-slate-500">Error: {error?.message || 'Unknown error'}</p>
            </CardContent>
          </Card>
        )}

        {!isError && filteredApplications.length === 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Applications Found</h3>
              <p className="text-slate-600">No applications match your current search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this application?
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900">{selectedApplication.studentName}</h4>
                <p className="text-sm text-slate-600">{selectedApplication.studentId}</p>
                <p className="text-sm text-slate-600">
                  {selectedApplication.type} - RM {selectedApplication.amount.toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmApproval} className="bg-green-500 hover:bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Approval
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default CommitteeSubmission;