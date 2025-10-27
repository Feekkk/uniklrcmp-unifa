import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Users, Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLogin } from '@/lib/api/hooks';
import { useAuth } from '@/lib/auth';
const unikLogo = '/rcmp.png';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();

  const roleConfig = {
    student: {
      icon: UserCircle,
      title: 'Student Portal',
      description: 'Access your student welfare fund applications and status',
      color: 'bg-gradient-to-r from-blue-600 to-blue-700',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    staff: {
      icon: Users,
      title: 'Staff Portal',
      description: 'Access student welfare fund committee and administrative functions',
      color: 'bg-gradient-to-r from-green-600 to-green-700',
      lightColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    }
  };

  const currentRole = roleConfig[selectedRole as keyof typeof roleConfig];
  const Icon = currentRole.icon;

  const { mutateAsync: login } = useLogin();

    const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      const { access_token, role, refresh_token } = response;
      
      
      // Store the token for fallback authentication
      authLogin(access_token, refresh_token);
      
      // Store role-specific email for fallback authentication
      if (role === 'admin') {
        localStorage.setItem('admin_email', email);
      } else if (role === 'committee') {
        localStorage.setItem('committee_email', email);
      } else if (role === 'user') {
        localStorage.setItem('student_email', email);
      }
      
      const mappedRole = role === 'user' ? 'student' : role;
      
      const isStaff = mappedRole === 'admin' || mappedRole === 'committee';
      const selectedIsStaff = selectedRole === 'staff';
      
      if ((isStaff && !selectedIsStaff) || (!isStaff && selectedIsStaff)) {
        toast({
          title: 'Incorrect Role Selected',
          description: `You signed in with a ${isStaff ? 'staff' : 'student'} account. Please select the "${isStaff ? 'Staff' : 'Student'}" role tab before signing in.`,
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      let dashboardRoute = '';
      let welcomeMessage = '';

      switch (mappedRole) {
        case 'student':
          dashboardRoute = '/student/dashboard';
          welcomeMessage = 'Welcome to your student dashboard.';
          break;
        case 'committee':
          dashboardRoute = '/committee/dashboard';
          welcomeMessage = 'Welcome to your committee dashboard.';
          break;
        case 'admin':
          dashboardRoute = '/admin/dashboard';
          welcomeMessage = 'Welcome to your admin dashboard.';
          break;
        default:
          dashboardRoute = '/student/dashboard';
          welcomeMessage = 'Welcome to your student dashboard.';
      }

      toast({
        title: 'Login Successful! 🎉',
        description: welcomeMessage,
      });
      
      navigate(dashboardRoute);
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || error.response?.data?.error || 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      
      <div className="relative w-full max-w-5xl z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Enhanced Branding */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={unikLogo} 
                    alt="UniKL Logo" 
                    className="w-16 h-16 object-contain"
                  />
                  <div className="absolute -inset-2 bg-blue-100/50 rounded-full blur-sm" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">UniKL RCMP</h1>
                  <p className="text-slate-600 text-lg">Student Welfare Fund System</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-800">Welcome Back!</h2>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Streamline your student welfare fund process with our comprehensive management platform. 
                  Access applications, track progress, and manage funding efficiently.
                </p>
              </div>
            </div>

            {/* Enhanced Role Features */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 text-lg">Platform Features:</h3>
              <div className="grid gap-3">
                <div className="flex items-center space-x-3 text-slate-600 bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  <span>Real-time application tracking</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600 bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                  <span>Secure document management</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600 bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
                  <span>Automated workflow processing</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600 bg-white/50 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}} />
                  <span>Instant notifications & updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Enhanced Login Form */}
          <div className="w-full">
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
              <CardHeader className="space-y-6 pb-8 bg-gradient-to-r from-slate-50 to-blue-50/50">
                <div className="text-center space-y-4">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl ${currentRole.lightColor} transition-all duration-500 hover:scale-105 shadow-lg`}>
                    <Icon className={`w-10 h-10 ${currentRole.textColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
                      {currentRole.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-lg">
                      {currentRole.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8 p-8">
                {/* Enhanced Role Selection */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Select Your Role</Label>
                  <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 h-14">
                      <TabsTrigger 
                        value="student" 
                        className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                      >
                        <UserCircle className="w-5 h-5 mr-2" />
                        Student
                      </TabsTrigger>
                      <TabsTrigger 
                        value="staff" 
                        className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Staff
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Enhanced Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-slate-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className={`w-full h-14 text-white font-semibold text-lg ${currentRole.color} hover:opacity-90 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-3" />
                        Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                      </>
                    )}
                  </Button>
                </form>

                {/* Enhanced Role Badge */}
                <div className="text-center">
                  <Badge variant="secondary" className={`${currentRole.lightColor} ${currentRole.textColor} border-0 px-4 py-2 text-sm font-medium`}>
                    <Icon className="w-4 h-4 mr-2" />
                    {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Access
                  </Badge>
                </div>

                {/* Enhanced Additional Links */}
                <div className="text-center space-y-4 pt-6 border-t border-slate-100">
                  <p className="text-slate-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline">
                      Register here
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

export default Login;
