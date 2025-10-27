import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, FileText, Clock, Shield, XCircle, Users, CheckCircle, Download, Eye, Calendar, Receipt, DollarSign, Send, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetAdminApplication, useApproveApplication, useRejectApplication, type ApproveApplicationData } from '@/lib/api/hooks/use-admin-applications';
import { toast } from 'sonner';
import { isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const AdminReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFixedAmount, setIsFixedAmount] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<'approve' | 'reject' | null>(null);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  const { data: applicationData, isLoading: loadingData, error } = useGetAdminApplication(id || '');
  
  useEffect(() => {
    if (applicationData) {
      
      const maxAmount = applicationData.category?.maxAmount || 0;
      const categoryId = applicationData.category?.categoryId || '';

      // Do not set fixed amounts - admins should be able to enter any amount
      setIsFixedAmount(false);
      setAmount('');

      setApplication({
        id: applicationData.applicationId,
        studentName: applicationData.user?.name || 'Unknown Student',
        studentId: applicationData.user?.studentId || 'N/A',
        studentEmail: applicationData.user?.email || 'N/A',
        semester: applicationData.user?.semester ? `Semester ${applicationData.user.semester}` : 'N/A',
        course: applicationData.user?.course || applicationData.course || 'Not specified',
        type: applicationData.category?.name || applicationData.purpose || 'Financial Aid',
        categoryId,
        maxAmount,
        requestedAmount: applicationData.requestedAmount || applicationData.amountRequested || 0,
        approvedAmount: applicationData.approvedAmount || applicationData.finalAmount || 0,
        finalAmount: applicationData.finalAmount || 0,
        status: applicationData.applicationStatus,
        submittedAt: applicationData.submittedAt,
        adminReviewedAt: applicationData.adminReviewedAt,
        adminComments: applicationData.adminComments,
        committeeReviewedAt: applicationData.committeeReviewedAt || null, 
        committeeComments: applicationData.committeeComments || null, 
        justification: applicationData.justification || null, 
        documents: applicationData.documents?.map(doc => ({
          id: doc.documentId,
          name: doc.fileName,
          type: doc.documentType,
          size: `${(doc.fileSize / 1024).toFixed(2)} KB`,
          documentType: 'document'
        })) || [],
        receipts: applicationData.receipts?.map((receipt: any) => ({
          id: receipt.receiptId,
          name: receipt.fileName,
          type: receipt.fileType || 'pdf',
          size: `${(receipt.fileSize / 1024).toFixed(2)} KB`,
          amount: receipt.amount,
          dateIssued: receipt.dateIssued,
          receiptNumber: receipt.receiptNumber,
          documentType: 'receipt'
        })) || [],
        timeline: applicationData.statusLogs?.map(log => ({
          date: log.changedAt,
          status: log.newStatus.toLowerCase(),
          description: log.remarks,
          changedBy: log.changedBy
        })) || []
      });
      setLoading(false);
    }
  }, [applicationData]);

  useEffect(() => {
    if (error) {
      toast.error('Failed to load application details');
    }
  }, [error]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      reviewing: { color: 'bg-blue-100 text-blue-800', icon: Eye },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn("flex items-center gap-1.5", config.color)}>
        <Icon className="w-3.5 h-3.5" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  // Use mutation hooks
  const approveMutation = useApproveApplication();
  const rejectMutation = useRejectApplication();

  const handleApproval = async () => {
    try {
      setSubmitting(true);

      // Check if this is a special category that requires committee approval
      const isSpecialCategory = ['CAT-EMERGENCY-OTHERS', 'CAT-ILLNESS-INPATIENT'].includes(application.categoryId);
      
      // Validate receipt file (required for all approvals)
      if (!receiptFile) {
        toast.error('Please upload the bank transfer receipt');
        return;
      }

      // Validate receipt file size
      if (receiptFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Receipt file size must be less than 10MB');
        return;
      }

      // For special categories, only receipt is required
      // For regular categories, amount is also required
      if (!isSpecialCategory) {
        if (!amount?.trim()) {
          toast.error('Please enter the approved amount');
          return;
        }

        const approvedAmount = parseFloat(amount);
        if (isNaN(approvedAmount) || approvedAmount <= 0) {
          toast.error('Please enter a valid amount');
          return;
        }
      }

      // Submit the data
      const formData = new FormData();
      
      // Only add approvedAmount for regular categories
      if (!isSpecialCategory) {
        formData.append('approvedAmount', amount);
      }
      
      formData.append('receipt', receiptFile);
      formData.append('comments', comments.trim() || (isSpecialCategory ? 'Receipt uploaded - application finalized' : 'Application approved'));

      await approveMutation.mutateAsync({
        id: id || '',
        data: formData,
      });

      toast.success(isSpecialCategory ? 'Receipt uploaded and application finalized successfully' : 'Application approved successfully');
      navigate('/admin/submission');
    } catch (error: any) {
      const message = error.response?.data?.errors
        ? Object.values(error.response.data.errors)[0][0]
        : error.response?.data?.message || 'Failed to approve application';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejection = async () => {
    if (!comments.trim()) {
      toast.error('Please provide rejection comments');
      return;
    }

    setSubmitting(true);
    
    try {
      await rejectMutation.mutateAsync({
        id: id || '',
        data: { comments: comments.trim() }
      });
      
      toast.success('Application rejected successfully');
      navigate('/admin/submission');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = (doc: any) => {
    setViewingDocument(doc);
    setIsDocumentModalOpen(true);
  };

  const handleDownloadDocument = (doc: any) => {
    // Create a temporary link and click it to download
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingData || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/submission')}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Application Review</h1>
                <p className="text-sm text-slate-500">#{application.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(application.status)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="col-span-2 space-y-6">
            {/* Student Information Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-sm text-slate-500">Full Name</Label>
                  <p className="font-medium">{application.studentName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-slate-500">Student ID</Label>
                  <p className="font-medium">{application.studentId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-slate-500">Email</Label>
                  <p className="font-medium">{application.studentEmail}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-slate-500">Course/Program</Label>
                  <p className="font-medium">{application.course || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-slate-500">Current Semester</Label>
                  <p className="font-medium">{application.semester}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-slate-500">Submitted Date</Label>
                  <p className="font-medium">
                    {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Application Details Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">Requested Amount</span>
                    </div>
                    <p className="text-2xl font-semibold text-purple-900">
                      RM {application.requestedAmount ? application.requestedAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 }) : '0.00'}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Category</span>
                    </div>
                    <p className="text-lg font-medium text-blue-900">{application.type}</p>
                  </div>
                </div>


                {/* Committee Approval Info (if available) */}
                {application.committeeReviewedAt && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Committee Approval</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-1">
                      <strong>Approved Amount:</strong> RM {application.approvedAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-blue-600 mb-1">
                      <strong>Date:</strong> {new Date(application.committeeReviewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {application.committeeComments && (
                      <p className="text-sm text-blue-700">
                        <strong>Comments:</strong> {application.committeeComments}
                      </p>
                    )}
                  </div>
                )}

                {/* Admin Decision Info (if available) */}
                {application.adminReviewedAt && (
                  <>
                  </>
                )}

                <Separator />

                {/* Documents Section */}
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-4">Supporting Documents</h3>
                  <div className="grid gap-4">
                    {application.documents.map((doc: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                            <p className="text-xs text-slate-500">{doc.size}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600"
                          onClick={() => handleViewDocument(doc)}
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipts Section */}
                {application.receipts && application.receipts.length > 0 && (
                  <div>
                    <Separator className="my-4" />
                    <h3 className="text-sm font-medium text-slate-900 mb-4">Bank Transfer Receipts</h3>
                    <div className="grid gap-4">
                      {application.receipts.map((receipt: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{receipt.name}</p>
                              <p className="text-xs text-slate-500">{receipt.size}</p>
                              {receipt.amount && (
                                <p className="text-xs text-green-700 mt-1">
                                  <strong>Amount:</strong> RM {parseFloat(receipt.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600"
                            onClick={() => handleViewDocument(receipt)}
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Action Panel */}
          <div className="space-y-6">
            <Card className="sticky top-[5.5rem]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Review Decision
                </CardTitle>
                <CardDescription>
                  Select your decision and provide the required details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Application Approved - Simple Message */}
                {(application.status.toLowerCase() === 'approved') && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800 text-lg">Application Approved ✓</h4>
                        <p className="text-sm text-green-700 mt-1">
                          This application has been successfully approved and finalized.
                        </p>
                        {application.adminReviewedAt && (
                          <p className="text-xs text-green-600 mt-2">
                            Approved on {new Date(application.adminReviewedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                      <p className="text-xs text-slate-600">
                        <strong>Note:</strong> To view the receipt, please refer to the <span className="text-green-700 font-semibold">Supporting Documents</span> section below.
                      </p>
                    </div>
                  </div>
                )}

                {!['approved', 'rejected'].includes(application.status.toLowerCase()) && (
                  <>
                    {/* Step 1: Decision Selection */}
                    {!selectedDecision && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-sm font-medium text-slate-700 mb-4">Choose your decision:</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={() => setSelectedDecision('approve')}
                            className="h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-200 transition-all duration-200"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Approve</span>
                            </div>
                          </Button>
                          <Button
                            onClick={() => setSelectedDecision('reject')}
                            variant="outline"
                            className="h-16 border-red-200 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 hover:text-red-800 shadow-lg hover:shadow-red-100 transition-all duration-200"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <XCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Reject</span>
                            </div>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Approval Form */}
                    {selectedDecision === 'approve' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <h3 className="text-sm font-medium text-green-800">Approval Details</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDecision(null)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            Change Decision
                          </Button>
                        </div>

                        {/* Show amount field for all categories */}
                        <div className="space-y-2">
                          <Label htmlFor="amount" className="text-sm font-medium">Approved Amount (RM)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="Enter approved amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="border-green-200 focus:border-green-400 focus:ring-green-200"
                          />
                        </div>

                        {/* Show committee approval info for special categories */}
                        {['CAT-EMERGENCY-OTHERS', 'CAT-ILLNESS-INPATIENT'].includes(application.categoryId) && application.status === 'committee_approved' && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <h4 className="text-sm font-medium text-blue-800">Committee Approved Amount</h4>
                            </div>
                            <p className="text-lg font-semibold text-blue-900">
                              RM {application.approvedAmount?.toLocaleString('en-MY', { minimumFractionDigits: 2 }) || '0.00'}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              This amount was approved by the committee. You only need to upload the receipt to finalize the approval.
                            </p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="receipt" className="text-sm font-medium">Bank Transfer Receipt</Label>
                            <Input
                              id="receipt"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                              className="border-green-200 focus:border-green-400 focus:ring-green-200"
                            />
                            <p className="text-xs text-green-600">PDF, JPG, PNG up to 10MB</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="approval-comments" className="text-sm font-medium">Approval Comments (Optional)</Label>
                            <Textarea
                              id="approval-comments"
                              placeholder="Add approval comments..."
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              className="h-20 border-green-200 focus:border-green-400 focus:ring-green-200 resize-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={handleApproval}
                            disabled={submitting}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-200 transition-all duration-200 h-11"
                          >
                            {submitting ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </div>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Application
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Rejection Form */}
                    {selectedDecision === 'reject' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <h3 className="text-sm font-medium text-red-800">Rejection Details</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDecision(null)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            Change Decision
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="rejection-comments" className="text-sm font-medium">Rejection Reason *</Label>
                            <Textarea
                              id="rejection-comments"
                              placeholder="Please provide a clear reason for rejection..."
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              className="h-24 border-red-200 focus:border-red-400 focus:ring-red-200 resize-none"
                              required
                            />
                            <p className="text-xs text-red-600">Required for rejection</p>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={handleRejection}
                            disabled={submitting}
                            variant="outline"
                            className="flex-1 border-red-300 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 hover:text-red-800 shadow-lg hover:shadow-red-100 transition-all duration-200 h-11"
                          >
                            {submitting ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                <span>Processing...</span>
                              </div>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Application
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {application.status.toLowerCase() === 'approved' && (!application.receipts || application.receipts.length === 0) && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-800">Application Approved</h4>
                        <p className="text-sm text-green-600">
                          This application has been successfully approved
                          {application.adminReviewedAt && (
                            <span> on {new Date(application.adminReviewedAt).toLocaleDateString()}</span>
                          )}
                        </p>
                        {application.adminComments && (
                          <p className="text-sm text-green-700 mt-1">
                            <strong>Admin Comments:</strong> {application.adminComments}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {application.status.toLowerCase() === 'rejected' && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <h4 className="font-medium text-red-800">Application Rejected</h4>
                        <p className="text-sm text-red-600">
                          This application has been rejected
                          {application.adminReviewedAt && (
                            <span> on {new Date(application.adminReviewedAt).toLocaleDateString()}</span>
                          )}
                        </p>
                        {application.adminComments && (
                          <p className="text-sm text-red-700 mt-1">
                            <strong>Rejection Reason:</strong> {application.adminComments}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Document Viewer Modal */}
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>{viewingDocument?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Viewing document for application
            </DialogDescription>
          </DialogHeader>
          
          {viewingDocument && (
            <div className="flex-1 overflow-hidden">
              {(() => {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const endpoint = viewingDocument.documentType === 'receipt' 
                  ? `/applications/receipts/${viewingDocument.id}/view` 
                  : `/applications/documents/${viewingDocument.id}/view`;
                const adminEmail = localStorage.getItem('admin_email') || '';
                const fullUrl = `${baseUrl}${endpoint}${adminEmail ? `?email=${encodeURIComponent(adminEmail)}` : ''}`;
                
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

export default AdminReview;
