import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Save,
  Heart,
  Stethoscope,
  Activity,
  Trash2,
  X
} from 'lucide-react';
import { Footer } from '@/components/Footer';

// Using RCMP logo from public
const unikLogo = '/rcmp.png';

interface Application {
  id: string;
  applicationId: string;
  status: string;
  categoryId: string;
  fundingCategory: {
    name: string;
  };
  documents: Array<{
    id: string;
    fileName: string;
    documentType: string;
    uploadedAt: string;
  }>;
  submittedAt: string;
  amount: number;
}

const EditApplication = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deathCertificate: [] as File[],
    receiptClinic: [] as File[],
    hospitalDocuments: [] as File[],
    injuryDocuments: [] as File[],
    criticalIllnessDocuments: [] as File[],
    naturalDisasterDocuments: [] as File[],
    othersDocuments: [] as File[],
  });

  // Fetch application details
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const token = localStorage.getItem('access_token');
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${baseUrl}/applications/${id}/edit`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setApplication(data.data);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to load application",
            variant: "destructive",
          });
          navigate('/student/submission');
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        
        let errorMessage = "Failed to load application";
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = "Request timed out. Please try again.";
          } else if (error.message.includes('fetch')) {
            errorMessage = "Network error. Please check your connection.";
          }
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        navigate('/student/submission');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchApplication();
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Any cleanup if needed
    };
  }, [id, navigate, toast]);

  const handleFileChange = (field: string, files: FileList | null) => {
    const fileArray = files ? Array.from(files) : [];
    setFormData(prev => ({
      ...prev,
      [field]: fileArray
    }));
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!application || !application.applicationId) return;

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/applications/${application.applicationId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Document deleted successfully",
          variant: "default",
        });
        // Refresh application data
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const token = localStorage.getItem('access_token');
          const refreshResponse = await fetch(`${baseUrl}/applications/${id}/edit`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              setApplication(refreshData.data);
            }
          }
        } catch (refreshError) {
          console.error('Error refreshing application data:', refreshError);
          // Don't show error to user as the main operation succeeded
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete document",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSubmit = new FormData();
      let hasFiles = false;
      
      // Add files for the specific category
      if (application?.categoryId === 'CAT-BEREAVEMENT' && formData.deathCertificate.length > 0) {
        formData.deathCertificate.forEach((file, index) => {
          formDataToSubmit.append(`deathCertificate[${index}]`, file);
          hasFiles = true;
        });
      }
      
      if (application?.categoryId === 'CAT-ILLNESS-OUTPATIENT' && formData.receiptClinic.length > 0) {
        formData.receiptClinic.forEach((file, index) => {
          formDataToSubmit.append(`receiptClinic[${index}]`, file);
          hasFiles = true;
        });
      }
      
      if (application?.categoryId === 'CAT-ILLNESS-INPATIENT' && formData.hospitalDocuments.length > 0) {
        formData.hospitalDocuments.forEach((file, index) => {
          formDataToSubmit.append(`hospitalDocuments[${index}]`, file);
          hasFiles = true;
        });
      }
      
      if (application?.categoryId === 'CAT-ILLNESS-CHRONIC' && formData.injuryDocuments.length > 0) {
        formData.injuryDocuments.forEach((file, index) => {
          formDataToSubmit.append(`injuryDocuments[${index}]`, file);
          hasFiles = true;
        });
      }
      
      if (application?.categoryId === 'CAT-EMERGENCY-FAMILY' && formData.criticalIllnessDocuments.length > 0) {
        formData.criticalIllnessDocuments.forEach((file, index) => {
          formDataToSubmit.append(`criticalIllnessDocuments[${index}]`, file);
          hasFiles = true;
        });
      }
      
      if (application?.categoryId === 'CAT-EMERGENCY-NATURAL' && formData.naturalDisasterDocuments.length > 0) {
        formData.naturalDisasterDocuments.forEach((file, index) => {
          formDataToSubmit.append(`naturalDisasterDocuments[${index}]`, file);
          hasFiles = true;
        });
      }
      
      if (application?.categoryId === 'CAT-EMERGENCY-OTHERS' && formData.othersDocuments.length > 0) {
        formData.othersDocuments.forEach((file, index) => {
          formDataToSubmit.append(`othersDocuments[${index}]`, file);
          hasFiles = true;
        });
      }

      // If no files selected, just refresh the page
      if (!hasFiles) {
        toast({
          title: "Info",
          description: "No new files to upload",
          variant: "default",
        });
        return;
      }

      console.log('Submitting files:', {
        categoryId: application?.categoryId,
        hasFiles,
        formData: {
          deathCertificate: formData.deathCertificate.length,
          receiptClinic: formData.receiptClinic.length,
          hospitalDocuments: formData.hospitalDocuments.length,
          injuryDocuments: formData.injuryDocuments.length,
          criticalIllnessDocuments: formData.criticalIllnessDocuments.length,
          naturalDisasterDocuments: formData.naturalDisasterDocuments.length,
          othersDocuments: formData.othersDocuments.length,
        }
      });

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('access_token');
      
      // Use POST instead of PUT for better file upload support
      const xhr = new XMLHttpRequest();
      
      return new Promise<void>((resolve, reject) => {
        xhr.open('POST', `${baseUrl}/applications/${id}/documents`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');
        // DO NOT set Content-Type - let browser set it automatically with boundary
        
        xhr.onload = () => {
          let data;
          try {
            data = JSON.parse(xhr.responseText);
          } catch (e) {
            data = { success: false, message: 'Invalid JSON response' };
          }
          
          if (data.success) {
            toast({
              title: "Success",
              description: "Documents updated successfully",
              variant: "default",
            });
            navigate('/student/submission');
          } else {
            toast({
              title: "Error",
              description: data.message || "Failed to update documents",
              variant: "destructive",
            });
          }
          resolve();
        };
        
        xhr.onerror = () => {
          toast({
            title: "Error",
            description: "Network error",
            variant: "destructive",
          });
          reject(new Error('Network error'));
        };
        
                 xhr.send(formDataToSubmit);
       });
    } catch (error) {
      console.error('Error updating documents:', error);
      toast({
        title: "Error",
        description: "Failed to update documents",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending_documents': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'CAT-BEREAVEMENT': return <Heart className="w-5 h-5" />;
      case 'CAT-ILLNESS-OUTPATIENT':
      case 'CAT-ILLNESS-INPATIENT':
      case 'CAT-ILLNESS-CHRONIC': return <Stethoscope className="w-5 h-5" />;
      case 'CAT-EMERGENCY-NATURAL':
      case 'CAT-EMERGENCY-FAMILY':
      case 'CAT-EMERGENCY-OTHERS': return <Activity className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const renderFileInput = (field: string, label: string, description: string) => {
    const files = formData[field as keyof typeof formData] as File[];
    
    return (
      <div className="space-y-2">
        <Label htmlFor={field}>{label}</Label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-600 mb-1">{description}</p>
          <p className="text-sm text-slate-500">PDF, JPG, PNG (Max 5MB each)</p>
          <input
            type="file"
            id={field}
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={(e) => {
              e.preventDefault();
              handleFileChange(field, e.target.files);
            }}
            className="hidden"
          />
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => document.getElementById(field)?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {files.length > 0 ? `${files.length} file(s) selected` : 'Choose File(s)'}
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Not Found</h2>
          <p className="text-slate-600 mb-4">The application you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/student/submission')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img src={unikLogo} alt="UniKL RCMP" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Edit Application Documents</h1>
                <p className="text-sm text-slate-600">Add or remove supporting documents</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/student/submission')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Current Documents */}
        {application.documents?.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Current Documents</CardTitle>
              <CardDescription>
                You can delete existing documents by clicking the trash icon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {application.documents?.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-900">{doc.fileName}</p>
                        <p className="text-sm text-slate-500">
                          {doc.documentType} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Documents</CardTitle>
            <CardDescription>
              You can upload additional supporting documents for your application. 
              Only upload files that are relevant to your case.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category-specific file inputs */}
              {application.categoryId && application.categoryId === 'CAT-BEREAVEMENT' && (
                <div key="bereavement" className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Bereavement Documents</h3>
                  {renderFileInput('deathCertificate', 'Death Certificate(s)', 'Upload additional death certificates or related documents')}
                </div>
              )}

              {application.categoryId && application.categoryId === 'CAT-ILLNESS-OUTPATIENT' && (
                <div key="outpatient" className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Outpatient Documents</h3>
                  {renderFileInput('receiptClinic', 'Clinic Receipt(s)', 'Upload additional clinic receipts or medical documents')}
                </div>
              )}

              {application.categoryId && application.categoryId === 'CAT-ILLNESS-INPATIENT' && (
                <div key="inpatient" className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Inpatient Documents</h3>
                  {renderFileInput('hospitalDocuments', 'Hospital Documents', 'Upload additional hospital reports, discharge notes, or bills')}
                </div>
              )}

              {application.categoryId && application.categoryId === 'CAT-ILLNESS-CHRONIC' && (
                <div key="chronic" className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Injury Documents</h3>
                  {renderFileInput('injuryDocuments', 'Injury Documents', 'Upload additional injury reports or medical documents')}
                </div>
              )}

              {application.categoryId && application.categoryId === 'CAT-EMERGENCY-FAMILY' && (
                <div key="family" className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Critical Illness Documents</h3>
                  {renderFileInput('criticalIllnessDocuments', 'Critical Illness Documents', 'Upload additional supporting documents')}
                </div>
              )}

              {application.categoryId && application.categoryId === 'CAT-EMERGENCY-NATURAL' && (
                <div key="natural" className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Natural Disaster Documents</h3>
                  {renderFileInput('naturalDisasterDocuments', 'Natural Disaster Documents', 'Upload additional police reports or incident photos')}
                </div>
              )}

              {application.categoryId && application.categoryId === 'CAT-EMERGENCY-OTHERS' && (
                <div key="others" className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Emergency Documents</h3>
                  {renderFileInput('othersDocuments', 'Emergency Documents', 'Upload additional supporting documents')}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/student/submission')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Documents
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default EditApplication;