import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useGetCommitteeProfile, useUpdateCommitteeProfile } from '@/lib/api/hooks';
import { useChangeCommitteePassword } from '@/lib/api/hooks/use-change-password';
import { Loader2, ArrowLeft, Bell, LogOut, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
// Using RCMP logo from public
import { getUserEmailFromToken } from '@/lib/jwt-utils';
import { useAuth } from '@/hooks/use-auth';

// Using RCMP logo from public
const unikLogo = '/rcmp.png';

const CommitteeEditProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: profile, isLoading } = useGetCommitteeProfile();
  const update = useUpdateCommitteeProfile();
  const changePassword = useChangeCommitteePassword();

  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const email = getUserEmailFromToken() || '';

  // Mock committee member data - you can replace this with actual data from your API
  const committeeInfo = {
    name: "Dr. Sarah Johnson",
    employeeId: "C2023001",
    email: email || "sarah.johnson@unikl.edu.my",
    department: "Financial Aid Committee",
    position: "Committee Member"
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
    }
  }, [profile]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({ username });
      toast.success('Profile updated successfully');
      navigate('/committee/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
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
                <h1 className="text-2xl font-bold text-slate-900">Committee Portal</h1>
                <p className="text-slate-600">Edit Profile</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
              
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <Avatar>
                  <AvatarFallback className="bg-green-100 text-green-700">
                    {committeeInfo.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-900">{committeeInfo.name}</p>
                  <p className="text-xs text-slate-500">{committeeInfo.position}</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" className="mb-4" onClick={() => navigate('/committee/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">Edit Committee Profile</CardTitle>
            <CardDescription>Update your display information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <Input 
                  id="email"
                  value={email} 
                  disabled 
                  readOnly 
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">Email address cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">Display Name</Label>
                <Input 
                  id="username"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Enter your display name" 
                />
                <p className="text-xs text-slate-500">This name will be displayed in the system</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/committee/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white mt-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onPasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
                  Current Password
                </Label>
                <div className="relative">
                  <Input 
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    placeholder="Enter your current password"
                    required 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                  New Password
                </Label>
                <div className="relative">
                  <Input 
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Enter your new password"
                    required 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Password must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm your new password"
                    required 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CommitteeEditProfile;

