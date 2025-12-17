import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Graduate pages
import GraduateDashboard from "./pages/graduate/GraduateDashboard";
import GraduateClockPage from "./pages/graduate/GraduateClockPage";
import GraduateTimesheetPage from "./pages/graduate/GraduateTimesheetPage";
import GraduateReportsPage from "./pages/graduate/GraduateReportsPage";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NewReport from "./pages/Reports/NewReport";

// Admin pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminReportsPage from "./pages/Admin/AdminReportsPage";
import AdminGraduatesPage from "./pages/Admin/AdminGraduatesPage";
import AdminGraduateDetailPage from "./pages/Admin/AdminGraduateDetailPage";
import AdminExport from "./pages/admin/AdminExport";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Toaster />
        <div className="min-h-screen bg-[#111111] text-white">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected graduate routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <GraduateDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clock" 
                element={
                  <ProtectedRoute>
                    <GraduateClockPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/attendance" 
                element={
                  <ProtectedRoute>
                    <GraduateTimesheetPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <GraduateReportsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports/new" 
                element={
                  <ProtectedRoute>
                    <NewReport />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } 
              />

              {/* Protected admin routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/reports" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminReportsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/graduates" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminGraduatesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/graduates/:id" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminGraduateDetailPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/export" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminExport />
                  </ProtectedRoute>
                } 
              />

              {/* Default redirect */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;