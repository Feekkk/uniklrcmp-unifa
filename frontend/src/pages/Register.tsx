import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCircle, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, GraduationCap, ArrowLeft, Building2, CreditCard, UserCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '@/lib/api/hooks';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const register = useRegister();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    bankName: '',
    customBankName: '',
    bankNumber: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '',
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    let label = '';
    let color = '';
    
    if (score === 0) {
      label = '';
      color = '';
    } else if (score <= 2) {
      label = 'Weak';
      color = 'text-red-500';
    } else if (score <= 3) {
      label = 'Fair';
      color = 'text-orange-500';
    } else if (score <= 4) {
      label = 'Good';
      color = 'text-yellow-500';
    } else {
      label = 'Strong';
      color = 'text-green-500';
    }

    setPasswordStrength({
      score,
      label,
      color,
      checks
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.bankName) {
      newErrors.bankName = 'Bank name is required';
    } else if (formData.bankName === 'others' && !formData.customBankName.trim()) {
      newErrors.bankName = 'Please enter your bank name';
    }

    if (!formData.bankNumber.trim()) {
      newErrors.bankNumber = 'Bank account number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Calculate password strength when password field changes
    if (field === 'password') {
      calculatePasswordStrength(value);
    }
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBankSelect = (value: string) => {
    setFormData(prev => ({
      ...prev,
      bankName: value
    }));
    if (errors.bankName) {
      setErrors(prev => ({
        ...prev,
        bankName: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeToTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "Please agree to the Terms of Service and Privacy Policy to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      await register.mutateAsync({
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        bankName: formData.bankName === 'others' ? formData.customBankName : formData.bankName,
        bankAccount: formData.bankNumber,
        password: formData.password,
        password_confirmation: formData.confirmPassword
      });

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Please login to continue.",
        variant: "default"
      });

      navigate('/login');
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred during registration. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Only student registration is allowed
  const roleConfig = {
    icon: UserCircle,
    title: 'Student Registration',
    description: 'Create your account to apply for student welfare fund',
    color: 'bg-gradient-to-r from-blue-600 to-blue-700',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  };

  const Icon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 bg-[size:2rem_2rem] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/30 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-200/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}} />
      
      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-10 flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-all duration-300 group"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="font-medium group-hover:translate-x-1 transition-transform duration-300">Back to Home</span>
      </Link>
      
      <div className="relative w-full max-w-6xl z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="hidden lg:flex lg:flex-col lg:justify-center items-center my-auto space-y-8">
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <img 
                    src="/rcmp.png" 
                    alt="RCMP Logo" 
                    className="w-44 h-20 object-contain"
                  />
                </div>
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">RCMP UniFA</h1>
                  <p className="text-slate-600 text-lg">UniKL RCMP Student Welfare Fund</p>
                </div>
              </div>
              
              <div className="space-y-4 text-center">
                <h2 className="text-2xl font-semibold text-slate-800">Join Our Platform!</h2>
                <p className="text-slate-600 leading-relaxed max-w-md mx-auto text-lg">
                  Create your student account to access our comprehensive student welfare fund management system. 
                  Apply for financial assistance and track your application status with ease.
                </p>
              </div>
            </div>

            {/* Enhanced Registration Benefits */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 text-lg text-center">What You'll Get:</h3>
              <div className="grid gap-3">
                <div className="flex items-center justify-center space-x-3 text-slate-600 bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  <span>Apply for student welfare fund online</span>
                </div>
                <div className="flex items-center justify-center space-x-3 text-slate-600 bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                  <span>Track application status in real-time</span>
                </div>
                <div className="flex items-center justify-center space-x-3 text-slate-600 bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
                  <span>Secure document uploads</span>
                </div>
                <div className="flex items-center justify-center space-x-3 text-slate-600 bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}} />
                  <span>Receive instant notifications</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Enhanced Registration Form */}
          <div className="w-full">
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
              <CardHeader className="space-y-6 pb-8 bg-gradient-to-r from-slate-50 to-blue-50/50">
                <div className="text-center space-y-4">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl ${roleConfig.lightColor} transition-all duration-500 hover:scale-105 shadow-lg`}>
                    <Icon className={`w-10 h-10 ${roleConfig.textColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
                      {roleConfig.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-lg">
                      {roleConfig.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-8">
                {/* Enhanced Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username */}
                  <div className="space-y-3">
                    <Label htmlFor="username" className="text-sm font-semibold text-slate-700">
                      Username
                    </Label>
                    <div className="relative group">
                      <UserCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={handleInputChange('username')}
                        placeholder="Enter your username"
                        className={`pl-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300 ${
                          errors.username ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                    {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                  </div>

                  {/* Full Name */}
                  <div className="space-y-3">
                    <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
                      Full Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange('fullName')}
                        placeholder="Enter your full name"
                        className={`pl-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300 ${
                          errors.fullName ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                    {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        placeholder="Enter your email"
                        className={`pl-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300 ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>

                  {/* Bank Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="bankName" className="text-sm font-semibold text-slate-700">
                        Bank Name
                      </Label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                        {formData.bankName === 'others' ? (
                          <div className="relative">
                            <Input
                              id="otherBankName"
                              type="text"
                              value={formData.customBankName}
                              onChange={handleInputChange('customBankName')}
                              placeholder="Enter your bank name"
                              className={`pl-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300 ${
                                errors.bankName ? 'border-red-500' : ''
                              }`}
                            />
                          </div>
                        ) : (
                          <Select value={formData.bankName} onValueChange={handleBankSelect}>
                            <SelectTrigger 
                              className={`pl-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300 ${
                                errors.bankName ? 'border-red-500' : ''
                              }`}
                            >
                              <SelectValue 
                                placeholder="Select your bank" 
                                className="text-slate-700 text-lg"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="maybank">Maybank</SelectItem>
                              <SelectItem value="cimb">CIMB Bank</SelectItem>
                              <SelectItem value="public">Public Bank</SelectItem>
                              <SelectItem value="rhb">RHB Bank</SelectItem>
                              <SelectItem value="hong-leong">Hong Leong Bank</SelectItem>
                              <SelectItem value="ambank">AmBank</SelectItem>
                              <SelectItem value="bank-islam">Bank Islam</SelectItem>
                              <SelectItem value="bsn">Bank Simpanan Nasional</SelectItem>
                              <SelectItem value="others">Others</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {errors.bankName && <p className="text-sm text-red-500">{errors.bankName}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="bankNumber" className="text-sm font-semibold text-slate-700">
                        Bank Account Number
                      </Label>
                      <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          id="bankNumber"
                          type="text"
                          value={formData.bankNumber}
                          onChange={handleInputChange('bankNumber')}
                          placeholder="Enter account number"
                          className={`pl-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300 ${
                            errors.bankNumber ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                      {errors.bankNumber && <p className="text-sm text-red-500">{errors.bankNumber}</p>}
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                        Password
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange('password')}
                          placeholder="Create password"
                          className={`pl-12 pr-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300 ${
                            errors.password ? 'border-red-500' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                      
                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Password Strength:</span>
                            <span className={`text-xs font-medium ${passwordStrength.color}`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          
                          {/* Strength Bar */}
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                passwordStrength.score <= 2 ? 'bg-red-500' :
                                passwordStrength.score <= 3 ? 'bg-orange-500' :
                                passwordStrength.score <= 4 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          
                          {/* Password Requirements */}
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            <div className={`flex items-center space-x-2 ${
                              passwordStrength.checks.length ? 'text-green-600' : 'text-slate-400'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                passwordStrength.checks.length ? 'bg-green-500' : 'bg-slate-300'
                              }`} />
                              <span>At least 8 characters</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${
                              passwordStrength.checks.uppercase ? 'text-green-600' : 'text-slate-400'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                passwordStrength.checks.uppercase ? 'bg-green-500' : 'bg-slate-300'
                              }`} />
                              <span>One uppercase letter</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${
                              passwordStrength.checks.lowercase ? 'text-green-600' : 'text-slate-400'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                passwordStrength.checks.lowercase ? 'bg-green-500' : 'bg-slate-300'
                              }`} />
                              <span>One lowercase letter</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${
                              passwordStrength.checks.number ? 'text-green-600' : 'text-slate-400'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                passwordStrength.checks.number ? 'bg-green-500' : 'bg-slate-300'
                              }`} />
                              <span>One number</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${
                              passwordStrength.checks.special ? 'text-green-600' : 'text-slate-400'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                passwordStrength.checks.special ? 'bg-green-500' : 'bg-slate-300'
                              }`} />
                              <span>One special character</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                        Confirm Password
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleInputChange('confirmPassword')}
                          placeholder="Confirm password"
                          className={`pl-12 pr-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300 ${
                            errors.confirmPassword ? 'border-red-500' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                      
                      {/* Password Match Indicator */}
                      {formData.confirmPassword && (
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formData.password === formData.confirmPassword ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-xs ${
                            formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={agreeToTerms}
                      onCheckedChange={checked => setAgreeToTerms(checked === true)}
                      className="mt-1 w-5 h-5 border-slate-300 focus:ring-blue-400 transition-all duration-300"
                    />
                    <Label 
                      htmlFor="terms" 
                      className="text-sm text-slate-600 leading-relaxed cursor-pointer hover:text-blue-600 transition-colors duration-300"
                    >
                      I agree that the information provided is accurate and truthful.
                    </Label>
                  </div>

                  <Button 
                    type="submit"
                    className={`w-full h-14 text-white font-semibold text-lg ${roleConfig.color} hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50`}
                    disabled={!agreeToTerms || register.isPending}
                  >
                    {register.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-3" />
                        Create Student Account
                      </>
                    )}
                  </Button>
                </form>

                {/* Enhanced Role Badge */}
                <div className="text-center">
                  <Badge variant="secondary" className={`${roleConfig.lightColor} ${roleConfig.textColor} border-0 px-4 py-2 text-sm font-medium`}>
                    <Icon className="w-4 h-4 mr-2" />
                    Student Registration
                  </Badge>
                </div>

                {/* Enhanced Login Link */}
                <div className="text-center space-y-4 pt-6 border-t border-slate-100">
                  <p className="text-slate-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline">
                      Sign in here
                    </Link>
                  </p>
                  <div className="flex justify-center space-x-6 text-sm">
                    <span className="text-slate-300">•</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;