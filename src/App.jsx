import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import ReportsPage from "./pages/reports/ReportsPage";
import ReportNew from "./pages/reports/ReportNew";
import ReportDetail from "./pages/reports/ReportDetail";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />

      {/* ALL ROUTES MUST BE INSIDE <Routes> */}
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* Weekly Reports Pages */}
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <ReportsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/reports/new"
          element={
            <RequireAuth>
              <ReportNew />
            </RequireAuth>
          }
        />

        <Route
          path="/reports/:id"
          element={
            <RequireAuth>
              <ReportDetail />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
