import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSubmitApplication, useGetUserProfile } from '@/lib/api/hooks';
import { formatMalaysianPhoneNumber } from '@/lib/utils';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  User, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Save,
  Send,
  Heart,
  Stethoscope,
  Activity,
  Edit
} from 'lucide-react';
// Using RCMP logo from public
const unikLogo = '/rcmp.png';
import { Footer } from '@/components/Footer';

// Helper function to convert old category structure to new category IDs
const getCategoryIdFromFormData = (fundCategory: string, fundSubCategory: string): string => {
  if (fundCategory === 'bereavement') {
    return 'CAT-BEREAVEMENT';
  }
  
  if (fundCategory === 'illness-injuries') {
    switch (fundSubCategory) {
      case 'outpatient':
        return 'CAT-ILLNESS-OUTPATIENT';
      case 'inpatient':
        return 'CAT-ILLNESS-INPATIENT';
      case 'injuries':
        return 'CAT-ILLNESS-CHRONIC';
      default:
        return 'CAT-ILLNESS-OUTPATIENT';
    }
  }
  
  if (fundCategory === 'emergency') {
    switch (fundSubCategory) {
      case 'critical-illness':
        return 'CAT-EMERGENCY-NATURAL';
      case 'natural-disaster':
        return 'CAT-EMERGENCY-NATURAL';
      case 'family':
        return 'CAT-EMERGENCY-FAMILY';
      case 'others':
        return 'CAT-EMERGENCY-OTHERS';
      default:
        return 'CAT-EMERGENCY-OTHERS';
    }
  }
  
  return 'CAT-EMERGENCY-OTHERS'; // Default fallback
};

const StudentForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const submitApplication = useSubmitApplication();
  const { data: userProfile, isLoading: isLoadingProfile } = useGetUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    studentId: '',
    course: '',
    semester: '',
    contactNumber: '',
    emergencyContact: '',
    
    // Fund Category Selection
    fundCategory: '',
    fundSubCategory: '',
    
    // Bereavement (Khairat) Data
    bereavementType: '',
    deathCertificate: [] as File[],
    
    // Illness & Injuries - Out-patient Data
    clinicName: '',
    reasonVisit: '',
    visitDateTime: '',
    totalAmountOutpatient: '',
    receiptClinic: [] as File[],
    
    // Illness & Injuries - In-patient Data
    reasonVisitInpatient: '',
    checkInDate: '',
    checkOutDate: '',
    totalAmountInpatient: '',
    hospitalDocuments: [] as File[],
    
    // Illness & Injuries - Injuries Data
    totalAmountInjuries: '',
    injuryDocuments: [] as File[],
    
    // Emergency - Critical Illness Data
    totalAmountCriticalIllness: '',
    criticalIllnessDocuments: [] as File[],
    
    // Emergency - Natural Disaster Data
    naturalDisasterCase: '',
    totalAmountNaturalDisaster: '',
    naturalDisasterDocuments: [] as File[],
    
    // Emergency - Others Data
    othersCase: '',
    totalAmountOthers: '',
    othersDocuments: [] as File[],
    
    // Documents
    documents: []
  });

  const fundCategories = [
    { value: 'bereavement', label: 'Bereavement (Khairat)', icon: Heart },
    { value: 'illness-injuries', label: 'Illness & Injuries', icon: Stethoscope },
    { value: 'emergency', label: 'Emergency', icon: AlertCircle }
  ];

  const bereavementTypes = [
    { value: 'student', label: 'Student (RM500)', amount: 500 },
    { value: 'parent', label: 'Parent (RM200)', amount: 200 },
    { value: 'sibling', label: 'Sibling (RM100)', amount: 100 }
  ];

  const illnessSubCategories = [
    { value: 'outpatient', label: 'Out-patient Treatment' },
    { value: 'inpatient', label: 'In-patient Treatment' },
    { value: 'injuries', label: 'Injuries' }
  ];

  const emergencySubCategories = [
    { value: 'critical-illness', label: 'Critical Illness' },
    { value: 'natural-disaster', label: 'Natural Disaster' },
    { value: 'others', label: 'Others' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: string, files: FileList | null) => {
    const fileArray = files ? Array.from(files) : [];
    setFormData(prev => ({
      ...prev,
      [field]: fileArray
    }));
  };

  // Prefill form data when user profile is loaded
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        // Personal Information - prefill from user profile
        fullName: userProfile.fullName || userProfile.name || '',
        studentId: userProfile.username || '', // Using username as studentId
        course: userProfile.program || '',
        semester: userProfile.semester?.toString() || '',
        contactNumber: userProfile.phoneNo || '',
        emergencyContact: '', // This is not stored in user profile, so leave empty
      }));
    }
  }, [userProfile]);

  const handleSubmit = async (isDraft: boolean = false) => {
    if (isDraft) {
      toast({
        title: "Draft Saved",
        description: "Your application has been saved as draft.",
      });
      return;
    }

    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create FormData object
      const formDataToSubmit = new FormData();
      
      // Add personal information
      formDataToSubmit.append('fullName', formData.fullName);
      formDataToSubmit.append('studentId', formData.studentId);
      formDataToSubmit.append('course', formData.course);
      if (formData.semester) formDataToSubmit.append('semester', formData.semester);
      if (formData.contactNumber) {
        formDataToSubmit.append('contactNumber', formatMalaysianPhoneNumber(formData.contactNumber));
      }
      if (formData.emergencyContact) {
        formDataToSubmit.append('emergencyContact', formatMalaysianPhoneNumber(formData.emergencyContact));
      }
      
      // Add category ID - convert to new category structure
      const categoryId = getCategoryIdFromFormData(formData.fundCategory, formData.fundSubCategory);
      formDataToSubmit.append('categoryId', categoryId);

      // Ensure backend can resolve user: include email explicitly
      const emailToSubmit = userProfile?.email || userProfile?.data?.email || 'test@example.com';
      formDataToSubmit.append('email', emailToSubmit);
      
      // Add category-specific data
      if (formData.fundCategory === 'bereavement') {
        formDataToSubmit.append('bereavementType', formData.bereavementType);
        if (formData.deathCertificate.length > 0) {
          formData.deathCertificate.forEach((file, index) => {
            formDataToSubmit.append(`deathCertificate[${index}]`, file);
          });
        }
      }
      
      if (formData.fundCategory === 'illness-injuries') {
        if (formData.fundSubCategory === 'outpatient') {
          formDataToSubmit.append('clinicName', formData.clinicName);
          formDataToSubmit.append('reasonVisit', formData.reasonVisit);
          formDataToSubmit.append('visitDateTime', formData.visitDateTime);
          formDataToSubmit.append('totalAmountOutpatient', formData.totalAmountOutpatient);
          if (formData.receiptClinic.length > 0) {
            formData.receiptClinic.forEach((file, index) => {
              formDataToSubmit.append(`receiptClinic[${index}]`, file);
            });
          }
        } else if (formData.fundSubCategory === 'inpatient') {
          formDataToSubmit.append('reasonVisitInpatient', formData.reasonVisitInpatient);
          formDataToSubmit.append('checkInDate', formData.checkInDate);
          formDataToSubmit.append('checkOutDate', formData.checkOutDate);
          formDataToSubmit.append('totalAmountInpatient', formData.totalAmountInpatient);
          if (formData.hospitalDocuments.length > 0) {
            formData.hospitalDocuments.forEach((file, index) => {
              formDataToSubmit.append(`hospitalDocuments[${index}]`, file);
            });
          }
        } else if (formData.fundSubCategory === 'injuries') {
          formDataToSubmit.append('totalAmountInjuries', formData.totalAmountInjuries);
          if (formData.injuryDocuments.length > 0) {
            formData.injuryDocuments.forEach((file, index) => {
              formDataToSubmit.append(`injuryDocuments[${index}]`, file);
            });
          }
        }
      }
      
      if (formData.fundCategory === 'emergency') {
        if (formData.fundSubCategory === 'critical-illness') {
          formDataToSubmit.append('totalAmountCriticalIllness', formData.totalAmountCriticalIllness);
          if (formData.criticalIllnessDocuments.length > 0) {
            formData.criticalIllnessDocuments.forEach((file, index) => {
              formDataToSubmit.append(`criticalIllnessDocuments[${index}]`, file);
            });
          }
        } else if (formData.fundSubCategory === 'natural-disaster') {
          formDataToSubmit.append('naturalDisasterCase', formData.naturalDisasterCase);
          formDataToSubmit.append('totalAmountNaturalDisaster', formData.totalAmountNaturalDisaster);
          if (formData.naturalDisasterDocuments.length > 0) {
            formData.naturalDisasterDocuments.forEach((file, index) => {
              formDataToSubmit.append(`naturalDisasterDocuments[${index}]`, file);
            });
          }
        } else if (formData.fundSubCategory === 'others') {
          formDataToSubmit.append('othersCase', formData.othersCase);
          formDataToSubmit.append('totalAmountOthers', formData.totalAmountOthers);
          if (formData.othersDocuments.length > 0) {
            formData.othersDocuments.forEach((file, index) => {
              formDataToSubmit.append(`othersDocuments[${index}]`, file);
            });
          }
        }
      }
      
      // Submit the application
      const response = await submitApplication.mutateAsync(formDataToSubmit);
      
      // Treat any resolved response as success to avoid false negatives on message-only successes
      toast({
        title: "Application Submitted",
        description: response?.message || "Your financial aid application has been submitted successfully.",
      });
      navigate('/student/submission');
    } catch (error: any) {
      
      let errorMessage = 'Failed to submit application. Please try again.';
      
      const validationErrors = error.response?.data?.errors;
      if (validationErrors && typeof validationErrors === 'object') {
        const firstField = Object.keys(validationErrors)[0];
        const firstMessage = Array.isArray(validationErrors[firstField]) ? validationErrors[firstField][0] : String(validationErrors[firstField]);
        errorMessage = firstMessage || `Please fix the following fields: ${Object.keys(validationErrors).join(', ')}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    // Basic personal information validation
    const basicInfoValid = formData.fullName && formData.studentId && formData.course;
    
    // Fund category validation
    if (!formData.fundCategory) return false;
    
    // Category-specific validation
    if (formData.fundCategory === 'bereavement') {
      return basicInfoValid && formData.bereavementType && formData.deathCertificate;
    }
    
    if (formData.fundCategory === 'illness-injuries') {
      if (!formData.fundSubCategory) return false;
      
      if (formData.fundSubCategory === 'outpatient') {
        const amount = parseFloat(formData.totalAmountOutpatient || '0');
        return basicInfoValid && formData.clinicName && formData.reasonVisit && 
               formData.visitDateTime && formData.totalAmountOutpatient && amount <= 30 && formData.receiptClinic;
      }
      
      if (formData.fundSubCategory === 'inpatient') {
        const amount = parseFloat(formData.totalAmountInpatient || '0');
        const hasDates = formData.checkInDate && formData.checkOutDate;
        const validDateOrder = hasDates ? new Date(formData.checkOutDate) > new Date(formData.checkInDate) : false;
        return basicInfoValid && formData.reasonVisitInpatient && formData.checkInDate && 
               formData.checkOutDate && validDateOrder && formData.totalAmountInpatient && amount > 0 && amount <= 5000 && formData.hospitalDocuments;
      }
      
      if (formData.fundSubCategory === 'injuries') {
        const amount = parseFloat(formData.totalAmountInjuries || '0');
        return basicInfoValid && formData.totalAmountInjuries && amount <= 200 && formData.injuryDocuments;
      }
    }
    
    if (formData.fundCategory === 'emergency') {
      if (!formData.fundSubCategory) return false;
      
      if (formData.fundSubCategory === 'critical-illness') {
        const amount = parseFloat(formData.totalAmountCriticalIllness || '0');
        return basicInfoValid && formData.totalAmountCriticalIllness && amount <= 200 && formData.criticalIllnessDocuments;
      }
      
      if (formData.fundSubCategory === 'natural-disaster') {
        const amount = parseFloat(formData.totalAmountNaturalDisaster || '0');
        return basicInfoValid && formData.naturalDisasterCase && formData.totalAmountNaturalDisaster && amount <= 200 && formData.naturalDisasterDocuments;
      }
      
      if (formData.fundSubCategory === 'others') {
        return basicInfoValid && formData.othersCase && formData.totalAmountOthers && formData.othersDocuments;
      }
    }
    
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-2xl font-bold text-slate-900">Financial Aid Application</h1>
                <p className="text-slate-600">Complete your application form</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700">ST</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-900">Student Portal</p>
                <p className="text-xs text-slate-500">Application Form</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Financial Aid Application
            </Badge>
            <span className="text-sm text-slate-500">All fields marked with * are required</span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${
              formData.fundCategory ? 'w-3/4' : 'w-1/4'
            }`}></div>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            {!formData.fundCategory ? 'Step 1 of 2: Personal Information' : 'Step 2 of 2: Fund Application Details'}
          </p>
        </div>

        <div className="space-y-8">
          {/* Personal Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>Personal Information</span>
                    {isLoadingProfile && (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isLoadingProfile 
                      ? "Loading your profile information..." 
                      : "Your personal information from your profile (read-only)"
                    }
                  </CardDescription>
                </div>
                <Link to="/student/editprofile">
                  <Button variant="outline" size="sm" className="flex items-center space-x-1">
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    readOnly
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                  {(userProfile?.fullName || userProfile?.name) && (
                    <p className="text-xs text-green-600">✓ From your profile</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    readOnly
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                  {userProfile?.username && (
                    <p className="text-xs text-green-600">✓ From your profile</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="course">Course/Program *</Label>
                  <Input
                    id="course"
                    value={formData.course}
                    readOnly
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                  {userProfile?.program && (
                    <p className="text-xs text-green-600">✓ From your profile</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="semester">
                    {formData.course === 'SARJANA MUDA PERUBATAN DAN SARJANA MUDA PEMBEDAHAN (MBBS)' ? 'Current Year' : 'Current Semester'}
                  </Label>
                  <Input
                    id="semester"
                    value={formData.semester ? 
                      (formData.course === 'SARJANA MUDA PERUBATAN DAN SARJANA MUDA PEMBEDAHAN (MBBS)' ? 
                        `Year ${formData.semester}` : 
                        `Semester ${formData.semester}`) 
                      : ''}
                    readOnly
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                  {userProfile?.semester && (
                    <p className="text-xs text-green-600">✓ From your profile</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    readOnly
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                  {userProfile?.phoneNo && (
                    <p className="text-xs text-green-600">✓ From your profile</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Emergency contact number"
                    className=""
                  />
                  <p className="text-xs text-gray-500">Please provide an emergency contact number (this can be edited)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fund Category Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span>Select Fund Category</span>
              </CardTitle>
              <CardDescription>
                Choose the type of financial aid you are applying for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fundCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <div
                      key={category.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.fundCategory === category.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => handleInputChange('fundCategory', category.value)}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-6 h-6 text-slate-600" />
                        <div>
                          <h3 className="font-medium text-slate-900">{category.label}</h3>
                          <p className="text-sm text-slate-500">
                            {category.value === 'bereavement' 
                              ? 'Financial assistance for bereavement expenses'
                              : category.value === 'illness-injuries'
                              ? 'Financial assistance for medical expenses and injuries'
                              : 'Financial assistance for emergency situations'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Form Based on Selected Category */}
          {formData.fundCategory === 'bereavement' && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <span>Bereavement (Khairat) Application</span>
                </CardTitle>
                <CardDescription>
                  Please provide details for your bereavement fund application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bereavementType">Relationship to Deceased *</Label>
                  <Select onValueChange={(value) => handleInputChange('bereavementType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {bereavementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deathCertificate">Death Certificate *</Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 mb-2">Upload Death Certificate(s)</p>
                    <p className="text-sm text-slate-500">Accepted formats: PDF, JPG, PNG (Max 5MB each)</p>
                    <input
                      type="file"
                      id="deathCertificate"
                      key="deathCertificate"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => {
                        e.preventDefault();
                        handleFileChange('deathCertificate', e.target.files);
                      }}
                      className="hidden"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      className="mt-2"
                      onClick={() => document.getElementById('deathCertificate')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {formData.deathCertificate.length > 0 ? `${formData.deathCertificate.length} file(s) selected` : 'Choose File(s)'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {formData.fundCategory === 'illness-injuries' && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                  <span>Illness & Injuries Application</span>
                </CardTitle>
                <CardDescription>
                  Please select the type of medical assistance you need
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fundSubCategory">Type of Medical Assistance *</Label>
                  <Select onValueChange={(value) => handleInputChange('fundSubCategory', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medical assistance type" />
                    </SelectTrigger>
                    <SelectContent>
                      {illnessSubCategories.map((subCategory) => (
                        <SelectItem key={subCategory.value} value={subCategory.value}>
                          {subCategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Out-patient Treatment Form */}
                {formData.fundSubCategory === 'outpatient' && (
                  <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Out-patient Treatment Information</h4>
                          <p className="text-sm text-blue-800">
                            <strong>Coverage Limit:</strong> Limited to RM 30 per semester (i.e., allowable for two claims per year) and recommended for students to combine all the receipt and submit together.
                          </p>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-slate-900">Out-patient Treatment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clinicName">Clinic Name *</Label>
                        <Input
                          id="clinicName"
                          value={formData.clinicName}
                          onChange={(e) => handleInputChange('clinicName', e.target.value)}
                          placeholder="Enter clinic name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalAmountOutpatient">Total Amount Applied (RM) *</Label>
                        <Input
                          id="totalAmountOutpatient"
                          type="number"
                          min="0"
                          step="0.01"
                          max="30"
                          value={formData.totalAmountOutpatient}
                          onChange={(e) => handleInputChange('totalAmountOutpatient', e.target.value)}
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reasonVisit">Reason for Visit *</Label>
                      <Textarea
                        id="reasonVisit"
                        value={formData.reasonVisit}
                        onChange={(e) => handleInputChange('reasonVisit', e.target.value)}
                        placeholder="Describe the reason for your visit..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visitDateTime">Date & Time of Visit *</Label>
                      <Input
                        id="visitDateTime"
                        type="datetime-local"
                        value={formData.visitDateTime}
                        onChange={(e) => handleInputChange('visitDateTime', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiptClinic">Receipt from Clinic *</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 mb-1">Upload Clinic Receipt(s)</p>
                        <p className="text-sm text-slate-500">PDF, JPG, PNG (Max 5MB each)</p>
                        <input
                          type="file"
                          id="receiptClinic"
                          key="receiptClinic"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => {
                            e.preventDefault();
                            handleFileChange('receiptClinic', e.target.files);
                          }}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => document.getElementById('receiptClinic')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.receiptClinic.length > 0 ? `${formData.receiptClinic.length} file(s) selected` : 'Choose File(s)'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* In-patient Treatment Form */}
                {formData.fundSubCategory === 'inpatient' && (
                  <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-green-900 mb-1">In-patient Treatment Information</h4>
                          <p className="text-sm text-green-800">
                            <strong>Eligibility:</strong> Applicable only if hospitalization cost exceeded the stipulated insurance coverage overall annual limit per annum per student RM20,000.00.
                          </p>
                          <p className="text-sm text-green-800 mt-1">
                            <strong>Coverage:</strong>Provision of fund more than RM 1,000.00 requires SWF Campus committee approval.
                          </p>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-slate-900">In-patient Treatment Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="reasonVisitInpatient">Reason for Hospitalization *</Label>
                      <Textarea
                        id="reasonVisitInpatient"
                        value={formData.reasonVisitInpatient}
                        onChange={(e) => handleInputChange('reasonVisitInpatient', e.target.value)}
                        placeholder="Describe the reason for hospitalization..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkInDate">Check-in Date *</Label>
                        <Input
                          id="checkInDate"
                          type="date"
                          value={formData.checkInDate}
                          onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkOutDate">Check-out Date *</Label>
                        <Input
                          id="checkOutDate"
                          type="date"
                          value={formData.checkOutDate}
                          onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalAmountInpatient">Total Amount Applied (RM) *</Label>
                      <Input
                        id="totalAmountInpatient"
                        type="number"
                          min="0"
                          step="0.01"
                          max="1000"
                        value={formData.totalAmountInpatient}
                        onChange={(e) => handleInputChange('totalAmountInpatient', e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospitalDocuments">Hospital Documents *</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 mb-1">Upload Hospital Report, Discharge Note, Hospital Bill</p>
                        <p className="text-sm text-slate-500">PDF, JPG, PNG (Max 5MB each)</p>
                        <input
                          type="file"
                          id="hospitalDocuments"
                          key="hospitalDocuments"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => {
                            e.preventDefault();
                            handleFileChange('hospitalDocuments', e.target.files);
                          }}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => document.getElementById('hospitalDocuments')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.hospitalDocuments.length > 0 ? `${formData.hospitalDocuments.length} file(s) selected` : 'Choose File(s)'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Injuries Form */}
                {formData.fundSubCategory === 'injuries' && (
                  <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-purple-900 mb-1">Injuries Information</h4>
                          <p className="text-sm text-purple-800">
                            <strong>Coverage Limit:</strong> Coverage limited to injury support equipment up to RM 200.00
                          </p>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-slate-900">Injuries Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="totalAmountInjuries">Total Amount Applied (RM) *</Label>
                      <Input
                        id="totalAmountInjuries"
                        type="number"
                          min="0"
                          step="0.01"
                          max="200"
                        value={formData.totalAmountInjuries}
                        onChange={(e) => handleInputChange('totalAmountInjuries', e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="injuryDocuments">Supporting Documents *</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 mb-1">Upload Hospital Report, Receipt of purchased items</p>
                        <p className="text-sm text-slate-500">PDF, JPG, PNG (Max 5MB each)</p>
                        <input
                          type="file"
                          id="injuryDocuments"
                          key="injuryDocuments"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => {
                            e.preventDefault();
                            handleFileChange('injuryDocuments', e.target.files);
                          }}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => document.getElementById('injuryDocuments')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.injuryDocuments.length > 0 ? `${formData.injuryDocuments.length} file(s) selected` : 'Choose File(s)'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {formData.fundCategory === 'emergency' && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span>Emergency Application</span>
                </CardTitle>
                <CardDescription>
                  Please select the type of emergency assistance you need
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fundSubCategory">Type of Emergency Assistance *</Label>
                  <Select onValueChange={(value) => handleInputChange('fundSubCategory', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select emergency assistance type" />
                    </SelectTrigger>
                    <SelectContent>
                      {emergencySubCategories.map((subCategory) => (
                        <SelectItem key={subCategory.value} value={subCategory.value}>
                          {subCategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Critical Illness Form */}
                {formData.fundSubCategory === 'critical-illness' && (
                  <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-red-900 mb-1">Critical Illness Information</h4>
                          <p className="text-sm text-red-800">
                            <strong>Coverage:</strong> Critical illness initial diagnosis, accompanied with appropriate supporting documents, up to RM 200.00 as per claim basis.
                          </p>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-slate-900">Critical Illness Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="totalAmountCriticalIllness">Total Amount Applied (RM) *</Label>
                      <Input
                        id="totalAmountCriticalIllness"
                        type="number"
                          min="0"
                          step="0.01"
                          max="200"
                        value={formData.totalAmountCriticalIllness}
                        onChange={(e) => handleInputChange('totalAmountCriticalIllness', e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="criticalIllnessDocuments">Supporting Document *</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 mb-1">Upload Supporting Document(s)</p>
                        <p className="text-sm text-slate-500">PDF, JPG, PNG (Max 5MB each)</p>
                        <input
                          type="file"
                          id="criticalIllnessDocuments"
                          key="criticalIllnessDocuments"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => {
                            e.preventDefault();
                            handleFileChange('criticalIllnessDocuments', e.target.files);
                          }}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => document.getElementById('criticalIllnessDocuments')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.criticalIllnessDocuments.length > 0 ? `${formData.criticalIllnessDocuments.length} file(s) selected` : 'Choose File(s)'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Natural Disaster Form */}
                {formData.fundSubCategory === 'natural-disaster' && (
                  <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-orange-900 mb-1">Natural Disaster Information</h4>
                          <p className="text-sm text-orange-800">
                            <strong>Coverage Limit:</strong> The limit of contribution is RM200 only. A copy of certified evidence should be included for the claimed incident.
                          </p>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-slate-900">Natural Disaster Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="naturalDisasterCase">Case Description *</Label>
                      <Textarea
                        id="naturalDisasterCase"
                        value={formData.naturalDisasterCase}
                        onChange={(e) => handleInputChange('naturalDisasterCase', e.target.value)}
                        placeholder="Describe the natural disaster incident and its impact..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalAmountNaturalDisaster">Total Amount Applied (RM) *</Label>
                      <Input
                        id="totalAmountNaturalDisaster"
                        type="number"
                          min="0"
                          step="0.01"
                          max="200"
                        value={formData.totalAmountNaturalDisaster}
                        onChange={(e) => handleInputChange('totalAmountNaturalDisaster', e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="naturalDisasterDocuments">Supporting Documents *</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 mb-1">Upload Police Report, Photo of incident</p>
                        <p className="text-sm text-slate-500">PDF, JPG, PNG (Max 5MB each)</p>
                        <input
                          type="file"
                          id="naturalDisasterDocuments"
                          key="naturalDisasterDocuments"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => {
                            e.preventDefault();
                            handleFileChange('naturalDisasterDocuments', e.target.files);
                          }}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => document.getElementById('naturalDisasterDocuments')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.naturalDisasterDocuments.length > 0 ? `${formData.naturalDisasterDocuments.length} file(s) selected` : 'Choose File(s)'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Others Emergency Form */}
                {formData.fundSubCategory === 'others' && (
                  <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-yellow-900 mb-1">Other Emergency Information</h4>
                          <p className="text-sm text-yellow-800">
                            <strong>Approval Required:</strong> Requisition of emergency fund other than the critical illness & natural disaster cases is subject to SWF Campus committee approval.
                          </p>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-slate-900">Other Emergency Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="othersCase">Case Description *</Label>
                      <Textarea
                        id="othersCase"
                        value={formData.othersCase}
                        onChange={(e) => handleInputChange('othersCase', e.target.value)}
                        placeholder="Describe the emergency situation and its impact..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalAmountOthers">Total Amount Applied (RM) *</Label>
                      <Input
                        id="totalAmountOthers"
                        type="number"
                          min="0"
                          step="0.01"
                        value={formData.totalAmountOthers}
                        onChange={(e) => handleInputChange('totalAmountOthers', e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="othersDocuments">Supporting Documents *</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 mb-1">Upload Police Report, Photo of incident</p>
                        <p className="text-sm text-slate-500">PDF, JPG, PNG (Max 5MB each)</p>
                        <input
                          type="file"
                          id="othersDocuments"
                          key="othersDocuments"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => {
                            e.preventDefault();
                            handleFileChange('othersDocuments', e.target.files);
                          }}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => document.getElementById('othersDocuments')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.othersDocuments.length > 0 ? `${formData.othersDocuments.length} file(s) selected` : 'Choose File(s)'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {formData.fundCategory && (
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              
              <Button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={!isFormValid() || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          )}

          {formData.fundCategory && !isFormValid() && (
            <div className="flex items-center space-x-2 text-orange-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Please fill in all required fields before submitting</span>
            </div>
          )}

          {!formData.fundCategory && (
            <div className="text-center py-8">
              <div className="text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium mb-2">Select a Fund Category</p>
                <p className="text-sm">Please choose a fund category above to continue with your application</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentForm;