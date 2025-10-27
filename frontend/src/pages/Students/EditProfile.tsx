import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  MapPin, 
  GraduationCap,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetUserProfile, useUpdateProfile, useChangePassword } from '@/lib/api/hooks';
// Using RCMP logo from public
const unikLogo = '/rcmp.png';
import { Footer } from '@/components/Footer';

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading, error: profileError } = useGetUserProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNo: '',
    icNo: '',
    address: '',
    bankName: '',
    customBankName: '',
    bankAccount: '',
    program: '',
    semester: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Bank options
  const bankOptions = [
    'Maybank',
    'CIMB Bank',
    'Public Bank',
    'RHB Bank',
    'Hong Leong Bank',
    'AmBank',
    'Bank Islam',
    'Affin Bank',
    'Bank Muamalat',
    'BSN (Bank Simpanan Nasional)',
    'Agro Bank',
    'Other'
  ];

  // Program options
  const programOptions = [
    'ASASI DALAM SAINS PERUBATAN',
    'DIPLOMA FARMASI',
    'DIPLOMA KEJURURAWATAN',
    'DIPLOMA DALAM FISIOTERAPI',
    'DIPLOMA PENGIMEJAN PERUBATAN',
    'SARJANA MUDA FARMASI (KEPUJIAN)',
    'SARJANA MUDA FISIOTERAPI (KEPUJIAN)',
    'SARJANA MUDA SAINS  PSIKOLOGI (KEPUJIAN)',
    'SARJANA MUDA SAINS KEJURURAWATAN (KEPUJIAN)',
    'SARJANA MUDA SAINS (KEPUJIAN) DALAM TEKNOLOGI FARMASEUTIKAL',
    'SARJANA MUDA PERUBATAN DAN SARJANA MUDA PEMBEDAHAN (MBBS)',
    'SARJANA SAINS (FARMASI)',
    'SARJANA SAINS PERUBATAN',
    'SARJANA KESIHATAN AWAM',
    'SARJANA SAINS DALAM KESIHATAN AWAM',
    'DOKTOR FALSAFAH (FARMASI)',
    'DOKTOR FALSAFAH (SAINS PERUBATAN)',
  ];

  // Semester options
  const semesterOptions = Array.from({ length: 8 }, (_, i) => i + 1);
  
  // Year options for MBBS program
  const yearOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  
  // Check if selected program is MBBS
  const isMBBSProgram = formData.program === 'SARJANA MUDA PERUBATAN DAN SARJANA MUDA PEMBEDAHAN (MBBS)';

  // Load profile data when component mounts
  useEffect(() => {
    if (profile) {
      const initialData = {
        fullName: profile.fullName || profile.name || '',
        email: profile.email || '',
        phoneNo: profile.phoneNo || '',
        icNo: profile.icNo || '',
        address: profile.address || '',
        bankName: profile.bankName || '',
        customBankName: profile.bankName === 'Other' ? (profile.customBankName || '') : '',
        bankAccount: profile.bankAccount || '',
        program: profile.program || '',
        semester: profile.semester ? profile.semester.toString() : ''
      };
      setFormData(initialData);
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const hasAnyChanges = Object.keys(formData).some(key => {
        const currentValue = formData[key as keyof typeof formData];
        const originalValue = key === 'semester' 
          ? (profile[key as keyof typeof profile]?.toString() || '')
          : (profile[key as keyof typeof profile] || '');
        return currentValue !== originalValue;
      });
      setHasChanges(hasAnyChanges);
    }
  }, [formData, profile]);

  // Clear semester/year when program changes between MBBS and non-MBBS
  useEffect(() => {
    // Only clear if we're switching between MBBS and non-MBBS programs
    const wasMBBS = formData.program === 'SARJANA MUDA PERUBATAN DAN SARJANA MUDA PEMBEDAHAN (MBBS)';
    
    // If semester value exists and program type changed, clear the semester
    if (formData.semester && formData.program) {
      const currentIsMBBS = formData.program === 'SARJANA MUDA PERUBATAN DAN SARJANA MUDA PEMBEDAHAN (MBBS)';
      
      // Only reset if there's a mismatch (e.g., MBBS program with semester > 5, or non-MBBS with year > 8)
      const semesterNum = parseInt(formData.semester);
      const shouldReset = (currentIsMBBS && semesterNum > 5) || (!currentIsMBBS && semesterNum > 8);
      
      if (shouldReset) {
        setFormData(prev => ({
          ...prev,
          semester: ''
        }));
      }
    }
  }, [formData.program]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^(\+?6?01)[0-9]\d{7,8}$/;
    if (!formData.phoneNo.trim()) {
      newErrors.phoneNo = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNo.replace(/\s/g, ''))) {
      newErrors.phoneNo = 'Please enter a valid Malaysian phone number';
    }

    // IC Number validation
    const icRegex = /^\d{6}-\d{2}-\d{4}$|^\d{12}$/;
    if (!formData.icNo.trim()) {
      newErrors.icNo = 'IC Number is required';
    } else if (!icRegex.test(formData.icNo.replace(/\s/g, ''))) {
      newErrors.icNo = 'Please enter a valid IC number (12 digits or XXXXXX-XX-XXXX)';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Please provide a complete address';
    }

    // Bank validation
    if (!formData.bankName) {
      newErrors.bankName = 'Bank name is required';
    }

    // Custom bank name validation when "Other" is selected
    if (formData.bankName === 'Other' && !formData.customBankName.trim()) {
      newErrors.customBankName = 'Please specify your bank name';
    }

    // Bank Account validation
    if (!formData.bankAccount.trim()) {
      newErrors.bankAccount = 'Bank account number is required';
    } else if (!/^\d{8,20}$/.test(formData.bankAccount.replace(/\s/g, ''))) {
      newErrors.bankAccount = 'Bank account number must be 8-20 digits';
    }

    // Program validation
    if (!formData.program) {
      newErrors.program = 'Program is required';
    }

    // Semester validation
    if (!formData.semester) {
      newErrors.semester = isMBBSProgram ? 'Year is required' : 'Semester is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    // Current password validation
    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is different from current
    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateProfile.mutateAsync({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNo: formData.phoneNo.trim(),
        icNo: formData.icNo.trim(),
        address: formData.address.trim(),
        bankName: formData.bankName === 'Other' ? formData.customBankName.trim() : formData.bankName,
        bankAccount: formData.bankAccount.trim(),
        program: formData.program,
        semester: parseInt(formData.semester)
      });

      toast({
        title: "Profile Updated Successfully! 🎉",
        description: "Your profile has been updated successfully.",
      });

      navigate('/student/dashboard');
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred while updating your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-slate-900 font-medium">Failed to load profile</p>
          <Button onClick={() => navigate('/student/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
                <p className="text-slate-600">Update your personal information</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/student/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                {formData.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{formData.fullName || 'Your Name'}</h2>
              <p className="text-slate-600">Student Profile Information</p>
            </div>
          </div>

          {hasChanges && (
            <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">You have unsaved changes</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your basic personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`transition-all duration-200 ${errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 transition-all duration-200 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNo" className="text-sm font-medium text-slate-700">
                    Phone Number *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phoneNo"
                      type="tel"
                      value={formData.phoneNo}
                      onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                      className={`pl-10 transition-all duration-200 ${errors.phoneNo ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                      placeholder="e.g., 012-3456789"
                    />
                  </div>
                  {errors.phoneNo && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.phoneNo}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icNo" className="text-sm font-medium text-slate-700">
                    IC Number *
                  </Label>
                  <Input
                    id="icNo"
                    value={formData.icNo}
                    onChange={(e) => handleInputChange('icNo', e.target.value)}
                    className={`transition-all duration-200 ${errors.icNo ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    placeholder="e.g., 123456-78-9012"
                  />
                  {errors.icNo && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.icNo}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                  Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`pl-10 min-h-[100px] transition-all duration-200 ${errors.address ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    placeholder="Enter your complete address"
                  />
                </div>
                {errors.address && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-green-600" />
                Academic Information
              </CardTitle>
              <CardDescription>
                Update your academic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="program" className="text-sm font-medium text-slate-700">
                    Program *
                  </Label>
                  <Select value={formData.program} onValueChange={(value) => handleInputChange('program', value)}>
                    <SelectTrigger className={`transition-all duration-200 ${errors.program ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}>
                      <SelectValue placeholder="Select your program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programOptions.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.program && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.program}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester" className="text-sm font-medium text-slate-700">
                    {isMBBSProgram ? 'Year *' : 'Semester *'}
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Select value={formData.semester} onValueChange={(value) => handleInputChange('semester', value)}>
                      <SelectTrigger className={`pl-10 transition-all duration-200 ${errors.semester ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}>
                        <SelectValue placeholder={isMBBSProgram ? "Select year" : "Select semester"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isMBBSProgram ? (
                          yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              Year {year}
                            </SelectItem>
                          ))
                        ) : (
                          semesterOptions.map((semester) => (
                            <SelectItem key={semester} value={semester.toString()}>
                              Semester {semester}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.semester && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.semester}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                Banking Information
              </CardTitle>
              <CardDescription>
                Update your banking details for financial aid disbursements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="text-sm font-medium text-slate-700">
                    Bank Name *
                  </Label>
                  <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                    <SelectTrigger className={`transition-all duration-200 ${errors.bankName ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankOptions.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bankName && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.bankName}
                    </p>
                  )}
                </div>

                {/* Custom Bank Name Field - Show only when "Other" is selected */}
                {formData.bankName === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="customBankName" className="text-sm font-medium text-slate-700">
                      Bank Name *
                    </Label>
                    <Input
                      id="customBankName"
                      value={formData.customBankName}
                      onChange={(e) => handleInputChange('customBankName', e.target.value)}
                      className={`transition-all duration-200 ${errors.customBankName ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                      placeholder="Enter your bank name"
                    />
                    {errors.customBankName && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.customBankName}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bankAccount" className="text-sm font-medium text-slate-700">
                    Bank Account Number *
                  </Label>
                  <Input
                    id="bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                    className={`transition-all duration-200 ${errors.bankAccount ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    placeholder="Enter account number"
                  />
                  {errors.bankAccount && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.bankAccount}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-orange-600" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password for security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
                    Current Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className={`pl-10 pr-10 transition-all duration-200 ${passwordErrors.currentPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                    New Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className={`pl-10 pr-10 transition-all duration-200 ${passwordErrors.newPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {passwordErrors.newPassword}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Password must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                    Confirm New Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className={`pl-10 pr-10 transition-all duration-200 ${passwordErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!validatePasswordForm()) {
                      toast({
                        title: "Validation Error",
                        description: "Please check the password form for errors and try again.",
                        variant: "destructive"
                      });
                      return;
                    }

                    try {
                      await changePassword.mutateAsync({
                        current_password: passwordData.currentPassword,
                        new_password: passwordData.newPassword,
                        confirm_password: passwordData.confirmPassword
                      });

                      toast({
                        title: "Password Changed Successfully! 🔒",
                        description: "Your password has been updated successfully.",
                      });
                      
                      // Clear password form
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    } catch (error: any) {
                      const errorMessage = error?.response?.data?.error || 
                                         error?.response?.data?.errors?.new_password?.[0] ||
                                         error?.response?.data?.errors?.current_password?.[0] ||
                                         error?.response?.data?.errors?.confirm_password?.[0] ||
                                         "An error occurred while changing your password. Please try again.";
                      
                      toast({
                        title: "Password Change Failed",
                        description: errorMessage,
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={changePassword.isPending || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {changePassword.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link to="/student/dashboard">
              <Button type="button" variant="outline" size="lg">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              size="lg" 
              disabled={updateProfile.isPending || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default EditProfile;
