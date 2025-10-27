import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Edit
} from 'lucide-react';
// Using RCMP logo from public
const unikLogo = '/rcmp.png';
import { Footer } from '@/components/Footer';
import { useGetApplications } from '@/lib/api/hooks';

const StudentSubmission = () => {
  const navigate = useNavigate();
  const [viewingDocument, setViewingDocument] = useState<{id: string, name: string, type: string} | null>(null);
  
  const { data: appsResponse, isLoading, isError } = useGetApplications();

  // Function to handle viewing documents
  const handleViewDocument = (documentId: string, documentName: string, documentType: string) => {
    setViewingDocument({ id: documentId, name: documentName, type: documentType });
  };

  // Function to handle downloading documents
  const handleDownloadDocument = (documentId: string, documentName: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const studentEmail = localStorage.getItem('student_email') || '';
    const downloadUrl = `${baseUrl}/applications/documents/${documentId}/download${studentEmail ? `?email=${encodeURIComponent(studentEmail)}` : ''}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle downloading receipts
  const handleDownloadReceipt = (receiptId: string, receiptName: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const studentEmail = localStorage.getItem('student_email') || '';
    const downloadUrl = `${baseUrl}/applications/receipts/${receiptId}/download${studentEmail ? `?email=${encodeURIComponent(studentEmail)}` : ''}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = receiptName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Normalize backend data to UI shape
  const applications = useMemo(() => {
    const raw = appsResponse?.data || [];
    
    const mapped = raw.map((a: any) => {
      const status = (a.applicationStatus || a.status || 'under_review').toString().toLowerCase();
      const docs = Array.isArray(a.documents)
        ? a.documents.map((d: any) => ({
            id: d.documentId || d.id,
            name: d.filename || d.fileName || d.documentType || 'document',
            type: d.documentType || 'unknown',
            fileType: d.fileType || 'unknown'
          }))
        : [];
      const receipts = Array.isArray(a.receipts)
        ? a.receipts.map((r: any) => ({
            id: r.receiptId || r.id,
            name: r.fileName || 'receipt',
            fileType: r.fileType || 'application/pdf',
            number: r.receiptNumber,
            dateIssued: r.dateIssued
          }))
        : [];
      const comments = Array.isArray(a.statusLogs)
        ? a.statusLogs.map((l: any) => ({
            date: l.changedAt || l.created_at || a.updatedAt || a.submittedAt,
            author: 'System',
            message: `${l.newStatus || l.status}` + (l.remarks || l.comments ? ` - ${l.remarks || l.comments}` : ''),
          }))
        : [];
      
      // Better category type mapping based on backend structure
      let type = 'Financial Aid Application';
      if (a.categoryId) {
        const categoryMap: Record<string, string> = {
          'CAT-ILLNESS-INPATIENT': 'In-patient Treatment',
          'CAT-ILLNESS-OUTPATIENT': 'Out-patient Treatment',
          'CAT-ILLNESS-CHRONIC': 'Chronic Illness Treatment',
          'CAT-EMERGENCY-NATURAL': 'Natural Disaster Emergency',
          'CAT-EMERGENCY-FAMILY': 'Family Emergency',
          'CAT-EMERGENCY-OTHERS': 'Other Emergency',
          'CAT-BEREAVEMENT': 'Bereavement (Khairat)',
        };
        type = categoryMap[a.categoryId] || a.categoryId;
      } else if (a.category?.name) {
        type = a.category.name;
      } else if (a.purpose) {
        type = a.purpose;
      }
      
      return {
        id: a.applicationId || a.id,
        type,
        amount: Number(a.amountRequested ?? a.amount ?? 0),
        status,
        submittedDate: a.submittedAt || a.created_at || new Date().toISOString(),
        lastUpdated: a.updatedAt || a.updated_at || a.submittedAt,
        reviewedBy: a.admin?.name || a.committee?.name || '',
        approvedAmount: a.approvedAmount,
        documents: docs,
        receipts,
        comments,
        rejectionReason: a.adminComments || a.committeeComments,
      };
    });
    return mapped;
  }, [appsResponse]);
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
      case 'admin_rejected':
      case 'committee_rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'under_review':
      case 'submitted':
      case 'pending':
      case 'admin_suggested':
      case 'committee_approved':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
      case 'admin_rejected':
      case 'committee_rejected':
        return <XCircle className="w-4 h-4" />;
      case 'under_review':
      case 'submitted':
      case 'pending':
      case 'admin_suggested':
      case 'committee_approved':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'rejected':
      case 'admin_rejected':
        return 'Rejected';
      case 'committee_rejected':
        return 'Committee Rejected';
      case 'under_review':
        return 'Under Review';
      case 'submitted':
        return 'Submitted';
      case 'pending':
        return 'Pending';
      case 'admin_suggested':
        return 'Admin Suggested';
      case 'committee_approved':
        return 'Committee Approved';
      default:
        return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  const ApplicationCard = ({ application }: { application: any }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{application.type}</CardTitle>
            <CardDescription>Application ID: {application.id}</CardDescription>
          </div>
          <Badge className={`${getStatusColor(application.status)} border`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(application.status)}
              <span>{formatStatus(application.status)}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Requested Amount</p>
            <p className="font-semibold">RM {application.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-500">Submitted</p>
            <p className="font-semibold">{new Date(application.submittedDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-slate-500">Last Updated</p>
            <p className="font-semibold">{new Date(application.lastUpdated).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-slate-500">Reviewed By</p>
            <p className="font-semibold text-xs">{application.reviewedBy}</p>
          </div>
        </div>

        {application.status === 'approved' && application.approvedAmount && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">Approved Amount: RM {application.approvedAmount.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        )}

        {application.status === 'rejected' && application.rejectionReason && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Rejection Reason</p>
                <p className="text-red-600 text-sm">{application.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Application Details</DialogTitle>
                <DialogDescription>
                  Detailed information about your application ID: {application.id}
                </DialogDescription>
              </DialogHeader>
              <ApplicationDetails application={application} />
            </DialogContent>
          </Dialog>
          
          {/* Edit Documents Button - Only show for certain statuses */}
          {(['submitted', 'under_review', 'pending_documents'].includes(application.status.toLowerCase())) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/student/edit-application/${application.id}`)}
              className="text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Documents
            </Button>
          )}
          {(['approved'].includes(application.status.toLowerCase())) && Array.isArray(application.receipts) && application.receipts.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Receipt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>Receipt</span>
                  </DialogTitle>
                  <DialogDescription>
                    Receipt for your approved application ID: {application.id}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {application.receipts.map((rc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium">{rc.name}{rc.number ? ` (#${rc.number})` : ''}</p>
                          {rc.dateIssued && <p className="text-xs text-slate-500">Issued: {new Date(rc.dateIssued).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {rc.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingDocument({ id: rc.id, name: rc.name || 'receipt', type: 'receipt' })}
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {rc.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReceipt(rc.id, rc.name || 'receipt')}
                            title="Download Receipt"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ApplicationDetails = ({ application }: { application: any }) => (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Application Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Application ID</p>
                <p className="font-semibold">{application.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Type of Aid</p>
                <p className="font-semibold">{application.type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Requested Amount</p>
                <p className="font-semibold">RM {application.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge className={`${getStatusColor(application.status)} border`}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(application.status)}
                    <span>{formatStatus(application.status)}</span>
                  </div>
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Submitted Date</p>
                <p className="font-semibold">{new Date(application.submittedDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Reviewed By</p>
                <p className="font-semibold">{application.reviewedBy}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span>Submitted Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {application.documents.map((doc: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium">{doc.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.id && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDocument(doc.id, doc.name, doc.type)}
                      title="View Document"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {doc.id && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadDocument(doc.id, doc.name)}
                      title="Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Receipt Section (visible when approved and receipt exists) */}
      {(application.status === 'approved') && Array.isArray(application.receipts) && application.receipts.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Receipt</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {application.receipts.map((rc: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium">{rc.name}{rc.number ? ` (#${rc.number})` : ''}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {rc.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingDocument({ id: rc.id, name: rc.name || 'receipt', type: 'receipt' })}
                        title="View Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {rc.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/applications/receipts/${rc.id}/download`;
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = rc.name || 'receipt';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        title="Download Receipt"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <img 
                src={unikLogo} 
                alt="UniKL Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Application Status</h1>
                <p className="text-slate-600">Track your financial aid applications</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700">ST</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-900">Student Portal</p>
                <p className="text-xs text-slate-500">Application Tracking</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="max-w-7xl mx-auto">
          {isLoading && (
            <div className="text-center py-12 text-slate-600">Loading applications...</div>
          )}
          {isError && (
            <div className="text-center py-12 text-red-600">Failed to load applications.</div>
          )}
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold text-green-900">
                    {applications.filter(app => ['approved'].includes(app.status.toLowerCase())).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Under Review</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {applications.filter(app => ['under_review','submitted','pending','admin_suggested','committee_approved'].includes(app.status.toLowerCase())).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">
                    {applications.filter(app => ['rejected','admin_rejected','committee_rejected'].includes(app.status.toLowerCase())).length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-4">
              <TabsTrigger value="all">All Applications</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="under_review">Under Review</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            
            <Button onClick={() => navigate('/student/form')} className="bg-blue-600 hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </div>

          <TabsContent value="all" className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {applications.filter(app => ['approved'].includes(app.status.toLowerCase())).map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>

          <TabsContent value="under_review" className="space-y-4">
            {applications.filter(app => ['under_review','submitted','pending','admin_suggested','committee_approved'].includes(app.status.toLowerCase())).map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {applications.filter(app => ['rejected','admin_rejected','committee_rejected'].includes(app.status.toLowerCase())).map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>
        </Tabs>

        {applications.length === 0 && !isLoading && (
          <Card className="border-0 shadow-md">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Applications Yet</h3>
              <p className="text-slate-600 mb-6">You haven't submitted any financial aid applications.</p>
              <Button onClick={() => navigate('/student/form')} className="bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                Submit Your First Application
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
      
      {/* Document Viewer Modal */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>{viewingDocument?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Viewing document for your application
            </DialogDescription>
          </DialogHeader>
          
          {viewingDocument && (
            <div className="flex-1 overflow-hidden">
              {(() => {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const endpoint = viewingDocument.type === 'receipt' 
                  ? `/applications/receipts/${viewingDocument.id}/view` 
                  : `/applications/documents/${viewingDocument.id}/view`;
                const studentEmail = localStorage.getItem('student_email') || '';
                const fullUrl = `${baseUrl}${endpoint}${studentEmail ? `?email=${encodeURIComponent(studentEmail)}` : ''}`;
                
                return (
                  <iframe
                    src={fullUrl}
                    className="w-full h-[70vh] border rounded-lg"
                    title={viewingDocument.name}
                  />
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      
      <Footer />
    </div>
  );
};

export default StudentSubmission;