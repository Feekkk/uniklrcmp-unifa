import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  ThumbsDown,
  Download,
  ThumbsUp,
  Users,
  GraduationCap,
  ArrowLeft,
  FileText,
  ExternalLink
} from 'lucide-react';

import { useGetCommitteeApplication, useApproveCommitteeApplication, useRejectCommitteeApplication } from '@/lib/api/hooks';
import { useToast } from '@/hooks/use-toast';
const unikLogo = '/rcmp.png';

interface Application {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  course: string;
  semester: string;
  status: string;
  type?: string;
  requestedAmount: number;
  suggestedAmount: number;
  reason: string;
  purpose?: string;
  justification?: string;
  contactNumber?: string;
  emergencyContact?: string;
  submittedDate?: string;
  lastUpdated?: string;
  committeeComments?: string;
  categoryDetails: {
    fundCategory: string;
    fundSubCategory: string;
    totalAmount: number;
    specificDetails?: {
      clinicName?: string;
      visitDateTime?: string;
      reason?: string;
      case?: string;
      checkInDate?: string;
      checkOutDate?: string;
      hospitalDocuments?: string;
      documents?: string;
    };
  };
  documents: Array<{
    id?: string;
    filename?: string;
    filePath?: string;
    documentType?: string;
  }>;
}

const CommitteeReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | ''>('');
  const [viewingDocument, setViewingDocument] = useState<{id: string, name: string, type: string} | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useGetCommitteeApplication(id || '');
  const { mutateAsync: approve } = useApproveCommitteeApplication();
  const { mutateAsync: reject } = useRejectCommitteeApplication();

  // Function to handle viewing documents
  const handleViewDocument = (documentId: string, documentName: string, documentType: string) => {
    setViewingDocument({ id: documentId, name: documentName, type: documentType });
  };

  // Function to handle downloading documents
  const handleDownloadDocument = (documentId: string, documentName: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const committeeEmail = localStorage.getItem('committee_email') || '';
    const downloadUrl = `${baseUrl}/applications/documents/${documentId}/download${committeeEmail ? `?email=${encodeURIComponent(committeeEmail)}` : ''}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!data?.data) return;
    const a = data.data;
    // Normalize status labels to UI
    const rawStatus = (a.status || '').toString().toLowerCase();
    const statusMap: Record<string, string> = {
      submitted: 'pending',
      'under_review': 'under_review',
      pending: 'pending',
      committee_reviewing: 'under_review',
      committee_approved: 'committee_approved',
      committee_rejected: 'committee_rejected',
      approved: 'committee_approved',
      rejected: 'committee_rejected',
    };
    const uiStatus = statusMap[rawStatus] ?? 'pending';
    setApplication({
      id: a.id,
      studentId: a.studentId,
      studentName: a.studentName,
      studentEmail: a.studentEmail,
      course: a.course,
      semester: a.semester,
      type: a.type,
      requestedAmount: Number(a.requestedAmount) || 0,
      suggestedAmount: Number(a.suggestedAmount) || 0,
      status: uiStatus,
      submittedDate: a.submittedDate,
      lastUpdated: a.lastUpdated,
      committeeComments: a.committeeComments,
      contactNumber: a.contactNumber,
      emergencyContact: a.emergencyContact,
      documents: (a.documents ?? []).map((d: any) => ({
        id: d.documentId,
        filename: d.fileName,
        filePath: d.filePath,
        documentType: d.documentType
      })),
      reason: a.purpose ?? a.justification ?? '',
      purpose: a.purpose,
      justification: a.justification,
      categoryDetails: a.categoryDetails ?? {
        fundCategory: '',
        fundSubCategory: '',
        totalAmount: 0,
        specificDetails: {}
      }
    });
    setLoading(false);
  }, [isLoading, data]);

  const handleConfirmAction = async () => {
    if (!application) return;
    
    // Validate comments length (minimum 10 characters as required by backend)
    if (!comment.trim() || comment.trim().length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Comments must be at least 10 characters long.',
        variant: 'destructive',
      });
      return;
    }

    // Validate amount for approval
    if (action === 'approve' && (!amount || Number(amount) <= 0)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid approval amount.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (action === 'approve') {
        await approve({ id: application.id, finalAmount: Number(amount), comments: comment.trim() });
        toast({
          title: 'Application approved',
          description: 'The application has been approved successfully.',
        });
      } else if (action === 'reject') {
        await reject({ id: application.id, comments: comment.trim() });
        toast({
          title: 'Application rejected',
          description: 'The application has been rejected successfully.',
        });
      }
      setShowConfirmDialog(false);
      navigate('/committee/submission');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while processing your request.',
        variant: 'destructive',
      });
    }
  };

  const handleAction = (selectedAction: 'approve' | 'reject') => {
    setAction(selectedAction);
  };

  const handleConfirmDecision = () => {
    if (!application) return;
    
    // Validate comments length (minimum 10 characters as required by backend)
    if (!comment.trim() || comment.trim().length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Comments must be at least 10 characters long.',
        variant: 'destructive',
      });
      return;
    }

    // Validate amount for approval
    if (action === 'approve' && (!amount || Number(amount) <= 0)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid approval amount.',
        variant: 'destructive',
      });
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toString().toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'committee_approved':
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'committee_rejected':
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    const s = (status || '').toString().toLowerCase();
    if (s === 'committee_approved' || s === 'approved') return <CheckCircle className="w-4 h-4" />;
    if (s === 'committee_rejected' || s === 'rejected') return <XCircle className="w-4 h-4" />;
    if (s === 'under_review') return <Clock className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  // Loading or not found state
  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/committee/dashboard')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <img src={unikLogo} alt="UniKL Logo" className="h-10 w-10 object-contain" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Application Management</h1>
                  <p className="text-slate-600">Loading application details...</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-slate-900 mb-2">Loading Application</h2>
            <p className="text-slate-600">Please wait while we fetch the application details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-green-50">
      <header className="bg-white shadow-sm border-b border-slate-200 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/committee/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <img src={unikLogo} alt="UniKL Logo" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Application Management</h1>
                <p className="text-slate-600">Review and manage all student applications</p>
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

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        {application.studentName}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span className="flex items-center">
                          <GraduationCap className="w-4 h-4 mr-1" />
                          {application.course}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {application.semester}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(application.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(application.status)}
                        <span>Application Status</span>
                      </div>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-xs font-medium text-purple-600 mb-1">REQUESTED AMOUNT</p>
                      <p className="text-lg font-semibold text-purple-900">RM {application.requestedAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs font-medium text-green-600 mb-1">SUGGESTED AMOUNT</p>
                      <p className="text-lg font-semibold text-green-900">RM {application.suggestedAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="p-4 rounded-lg border bg-white">
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Category Details</h3>
                      <div className="text-sm text-slate-700 space-y-1">
                        <p><span className="text-slate-500">Fund Category:</span> {application.categoryDetails.fundCategory}</p>
                        <p><span className="text-slate-500">Sub-category:</span> {application.categoryDetails.fundSubCategory}</p>
                        <p><span className="text-slate-500">Total Amount:</span> RM {application.categoryDetails.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white">
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact Details</h3>
                      <div className="text-sm text-slate-700 space-y-1">
                        <p><span className="text-slate-500">Student Email:</span> {application.studentEmail}</p>
                        <p><span className="text-slate-500">Contact Number:</span> {application.contactNumber || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Tabs defaultValue="details">
                      <TabsList className="w-full">
                        <TabsTrigger value="details">Application Details</TabsTrigger>
                        <TabsTrigger value="documents">Supporting Documents</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details">
                        <div className="space-y-6 mt-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Reason for Application</h3>
                            <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">
                              {application.reason}
                            </p>
                          </div>
                          {application.categoryDetails.fundCategory === 'CAT-ILLNESS-INPATIENT' && (
                            <div className="grid grid-cols-1 gap-4">
                              <div className="p-3 rounded border bg-white">
                                <p className="text-xs text-slate-500">Reason for Inpatient Treatment</p>
                                <p className="text-sm text-slate-800">{application.categoryDetails.specificDetails?.reason || '-'}</p>
                              </div>
                              <div className="p-3 rounded border bg-white">
                                <p className="text-xs text-slate-500">Check-in Date</p>
                                <p className="text-sm text-slate-800">{application.categoryDetails.specificDetails?.checkInDate || '-'}</p>
                              </div>
                              <div className="p-3 rounded border bg-white">
                                <p className="text-xs text-slate-500">Check-out Date</p>
                                <p className="text-sm text-slate-800">{application.categoryDetails.specificDetails?.checkOutDate || '-'}</p>
                              </div>
                            </div>
                          )}
                          {application.categoryDetails.fundCategory === 'CAT-EMERGENCY-OTHERS' && (
                            <div className="grid grid-cols-1 gap-4">
                              <div className="p-3 rounded border bg-white">
                                <p className="text-xs text-slate-500">Case Description</p>
                                <p className="text-sm text-slate-800">{application.categoryDetails.specificDetails?.case || '-'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="documents">
                        <div className="space-y-4 mt-4">
                          {/* Document Summary Card */}
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-blue-900">Supporting Documents</h3>
                                  <p className="text-sm text-blue-700">
                                    {application.documents.length} document{application.documents.length !== 1 ? 's' : ''} uploaded by student
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  if (application.documents.length > 0) {
                                    const firstDoc = application.documents[0];
                                    handleViewDocument(firstDoc.id, firstDoc.filename || 'document', firstDoc.documentType || 'file');
                                  }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={application.documents.length === 0}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Documents
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span>Committee Decision</span>
                  </CardTitle>
                  <CardDescription>Make your final decision on this application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Decision Selection */}
                  {!action && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose Your Decision</h3>
                        <p className="text-sm text-slate-600">Select whether to approve or reject this application</p>
                      </div>
                      
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full h-10 border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 text-green-700 hover:text-green-800"
                          onClick={() => setAction('approve')}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="w-full h-10 border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-700 hover:text-red-800"
                          onClick={() => setAction('reject')}
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Decision Details */}
                  {action && (
                    <div className="space-y-6">
                      {/* Decision Header */}
                      <div className={`p-4 rounded-lg border-2 ${action === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center space-x-2">
                          {action === 'approve' ? (
                            <ThumbsUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <ThumbsDown className="w-5 h-5 text-red-600" />
                          )}
                          <h3 className={`font-semibold ${action === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                            {action === 'approve' ? 'Approving Application' : 'Rejecting Application'}
                          </h3>
                        </div>
                        <p className={`text-sm mt-1 ${action === 'approve' ? 'text-green-700' : 'text-red-700'}`}>
                          {action === 'approve' 
                            ? 'You are about to approve this financial aid application. Please provide the final amount and comments below.'
                            : 'You are about to reject this application. Please provide your reasons below.'
                          }
                        </p>
                      </div>

                      {/* Approve Details */}
                  {action === 'approve' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-semibold text-slate-900 mb-3">Approval Details</h4>
                            <div className="grid grid-cols-1 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Requested Amount:</span>
                                <span className="font-semibold">RM {application.requestedAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Admin Suggested:</span>
                                <span className="font-semibold text-blue-600">RM {application.suggestedAmount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                              Final Approved Amount (RM) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter final approved amount"
                        min={0}
                              step="0.01"
                              className="text-lg font-semibold"
                      />
                            <div className="text-xs space-y-1">
                              <p className="text-green-600 font-medium">
                                ✓ Committee has unlimited approval authority for special categories
                      </p>
                              <p className="text-slate-500">
                        Suggested amount: RM {application.suggestedAmount.toLocaleString()}
                      </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reject Details */}
                      {action === 'reject' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-semibold text-slate-900 mb-3">Application Summary</h4>
                            <div className="grid grid-cols-1 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Requested Amount:</span>
                                <span className="font-semibold">RM {application.requestedAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Category:</span>
                                <span className="font-semibold">{application.categoryDetails.fundCategory}</span>
                              </div>
                            </div>
                          </div>
                    </div>
                  )}

                      {/* Comments Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                          Committee Comments <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                          placeholder={
                            action === 'approve' 
                              ? "Provide your approval comments (minimum 10 characters)..."
                              : "Provide your rejection reasons (minimum 10 characters)..."
                          }
                      rows={4}
                      className={comment.trim().length > 0 && comment.trim().length < 10 ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">
                        Minimum 10 characters required
                      </p>
                      <p className={`text-xs ${comment.trim().length >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                        {comment.trim().length}/10 characters
                      </p>
                    </div>
                    {application.committeeComments && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                            <p className="font-medium text-amber-800">Previous committee comments:</p>
                            <p className="text-amber-700">{application.committeeComments}</p>
                          </div>
                    )}
                  </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                    <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setAction('')}
                        >
                          Back to Decision
                    </Button>
                    <Button
                          className={`flex-1 ${action === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                          onClick={handleConfirmDecision}
                          disabled={comment.trim().length < 10 || (action === 'approve' && (!amount || Number(amount) <= 0))}
                        >
                          {action === 'approve' ? (
                            <>
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Confirm Approval
                            </>
                          ) : (
                            <>
                      <ThumbsDown className="w-4 h-4 mr-2" />
                              Confirm Rejection
                            </>
                          )}
                    </Button>
                  </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {action === 'reject' ? 'Rejection' : 'Approval'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {action} this application?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {comment.trim().length < 10 && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded">
                ⚠️ Comments must be at least 10 characters long. Current: {comment.trim().length} characters.
              </div>
            )}
            {action === 'approve' && (!amount || Number(amount) <= 0) && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded">
                ⚠️ Please enter a valid approval amount.
              </div>
            )}
            <div className="text-xs text-slate-600 bg-amber-50 border border-amber-200 p-3 rounded">
              Note: For In-patient Treatment and Other Emergency categories, once the committee approves, the admin will receive this application to upload the official receipt and finalize the approval.
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={comment.trim().length < 10 || (action === 'approve' && (!amount || Number(amount) <= 0))}
                className={action === 'reject' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
              >
                Confirm {action === 'reject' ? 'Rejection' : 'Approval'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>{viewingDocument?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Viewing document for application review
            </DialogDescription>
          </DialogHeader>
          
          {viewingDocument && (
            <div className="flex-1 overflow-hidden">
              {(() => {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const endpoint = viewingDocument.type === 'receipt' 
                  ? `/applications/receipts/${viewingDocument.id}/view` 
                  : `/applications/documents/${viewingDocument.id}/view`;
                const committeeEmail = localStorage.getItem('committee_email') || '';
                const fullUrl = `${baseUrl}${endpoint}${committeeEmail ? `?email=${encodeURIComponent(committeeEmail)}` : ''}`;
                
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

      <footer className="w-full mt-auto">
        <Footer />
      </footer>
    </div>
  );
};

export default CommitteeReview;