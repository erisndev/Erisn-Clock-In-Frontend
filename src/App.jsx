import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ScrollToTop from "./components/ScrollToTop";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Graduate dashboard pages
import GraduateDashboard from "./pages/graduate/GraduateDashboard";
import GraduateClockPage from "./pages/graduate/GraduateClockPage";
import GraduateTimesheetPage from "./pages/graduate/GraduateTimesheetPage";
import GraduateReportsPage from "./pages/graduate/GraduateReportsPage";

// Admin dashboard pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminReportsPage from "./pages/Admin/AdminReportsPage";
import AdminGraduatesPage from "./pages/Admin/AdminGraduatesPage";
import AdminGraduateDetailPage from "./pages/Admin/AdminGraduateDetailPage";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-[#111111] text-white">
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Graduate dashboard routes */}
            <Route path="/graduate" element={<GraduateDashboard />} />
            <Route path="/graduate/clock" element={<GraduateClockPage />} />
            <Route path="/graduate/timesheet" element={<GraduateTimesheetPage />} />
            <Route path="/graduate/reports" element={<GraduateReportsPage />} />

            {/* Admin dashboard routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/graduates" element={<AdminGraduatesPage />} />
            <Route path="/admin/graduates/:id" element={<AdminGraduateDetailPage />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;
