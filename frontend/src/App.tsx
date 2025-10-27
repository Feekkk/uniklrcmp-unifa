import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ReportBug from "./pages/ReportBug";

// Student pages
import StudentDashboard from "./pages/Students/Dashboard";
import StudentForm from "./pages/Students/Form";
import StudentSubmission from "./pages/Students/Submission";
import EditProfile from "./pages/Students/EditProfile";
import EditApplication from "./pages/Students/EditApplication";

// Committee pages
import CommitteeDashboard from "./pages/Committee/Dashboard";
import CommitteeSubmission from "./pages/Committee/Submission";
import Review from "./pages/Committee/Review";
import CommitteeEditProfile from "./pages/Committee/EditProfile";

// Admin pages
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminSubmission from "./pages/Admin/Submission";
import AdminReview from "./pages/Admin/Review";
import AdminEditProfile from "./pages/Admin/EditProfile";
import UserList from "./pages/Admin/UserList";
import FinanceOverview from "./pages/Admin/Finance";
import AllTransactions from "./pages/Admin/AllTransactions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Student routes */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/form" element={<StudentForm />} />
            <Route path="/student/submission" element={<StudentSubmission />} />
            <Route path="/student/editprofile" element={<EditProfile />} />
            <Route path="/student/edit-application/:id" element={<EditApplication />} />
            
            {/* Committee routes */}
            <Route path="/committee/dashboard" element={<CommitteeDashboard />} />
            <Route path="/committee/submission" element={<CommitteeSubmission />} />
            <Route path="/committee/review/:id" element={<Review />} />
            <Route path="/committee/edit-profile" element={<CommitteeEditProfile />} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/submission" element={
              <ProtectedRoute>
                <AdminSubmission />
              </ProtectedRoute>
            } />
            <Route path="/admin/review/:id" element={
              <ProtectedRoute>
                <AdminReview />
              </ProtectedRoute>
            } />
            <Route path="/admin/edit-profile" element={
              <ProtectedRoute>
                <AdminEditProfile />
              </ProtectedRoute>
            } />
            <Route path="/admin/userlist" element={
              <ProtectedRoute>
                <UserList />
              </ProtectedRoute>
            } />

            <Route path="/admin/stats" element={
              <ProtectedRoute>
                <FinanceOverview />
              </ProtectedRoute>
            } />
            <Route path="/admin/finance" element={
              <ProtectedRoute>
                <FinanceOverview />
              </ProtectedRoute>
            } />
            <Route path="/admin/transactions" element={
              <ProtectedRoute>
                <AllTransactions />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
            <Route path="/report-bug" element={<ReportBug />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
