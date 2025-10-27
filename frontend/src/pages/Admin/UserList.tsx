import { LogOut, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/use-auth';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUserManagement } from '@/lib/api/hooks/use-user-management';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
const unikLogo = '/rcmp.png';

interface UpdateUserForm {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
}

const UserList = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'student' | 'committee'>('all');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { users, isLoading, updateUser, deleteUser } = useUserManagement();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<UpdateUserForm>();

  // Initialize form with selected user data
  useEffect(() => {
    if (selectedUser) {
      reset({
        name: selectedUser.name,
        email: selectedUser.email,
        password: '',
        password_confirmation: ''
      });
    }
  }, [selectedUser, reset]);

  const filteredUsers = users?.filter(user => 
    userTypeFilter === 'all' ? true : user.type === userTypeFilter
  );

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const closeDialogs = () => {
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const onEditSubmit = async (data: UpdateUserForm) => {
    try {
      if (!selectedUser) return;
      
      const adminEmail = localStorage.getItem('admin_email');
      if (!adminEmail) {
        toast({
          title: "Error",
          description: "Admin authentication not found. Please login again.",
          variant: "destructive"
        });
        return;
      }
      
      // Only include password fields if a new password was provided
      const payload = {
        id: selectedUser.id,
        userType: selectedUser.type,
        name: data.name,
        email: data.email,
        ...(data.password ? {
          password: data.password,
          password_confirmation: data.password_confirmation
        } : {})
      };

      await updateUser(payload);
      closeDialogs();
      toast({
        title: "Success",
        description: "User details updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedUser) return;
      await deleteUser({ id: selectedUser.id, userType: selectedUser.type });
      closeDialogs();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-purple-50">
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
                <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
                <p className="text-slate-600">System Users</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-lg bg-white">
          <div className="p-6">
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">All System Users</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/dashboard')}
                  className="ml-4"
                >
                  Back to Dashboard
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={userTypeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('all')}
                >
                  All Users
                </Button>
                <Button
                  variant={userTypeFilter === 'student' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('student')}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Students
                </Button>
                <Button
                  variant={userTypeFilter === 'committee' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('committee')}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Committee Members
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">User Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Created At</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers?.map((user, index) => (
                      <tr key={`${user.id}-${user.type}-${index}`} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900">{user.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-900">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-900">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.type === 'committee' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.type === 'committee' ? 'Committee' : 'Student'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 flex justify-end space-x-2">
                          <button
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            onClick={() => openEditDialog(user)}
                          >
                            Edit
                          </button>
                          {user.type !== 'committee' && (
                            <button
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                              onClick={() => openDeleteDialog(user)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      <Footer />

      {/* Edit Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Make changes to the user's profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  defaultValue={selectedUser?.name}
                  className="col-span-3"
                  {...register('name', { required: true })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={selectedUser?.email}
                  className="col-span-3"
                  {...register('email', { required: true })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password_confirmation" className="text-right">
                  Confirm
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="pr-10"
                    {...register('password_confirmation')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              You are about to delete <span className="font-semibold text-slate-900">{selectedUser?.name}</span>'s account.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserList;