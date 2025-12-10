import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [graduates, setGraduates] = useState([]);
  const [timesheet, setTimesheet] = useState([]);

  useEffect(() => {
    // Seed demo data if empty
    let users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.length === 0) {
      users = [
        { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "graduate" },
        { id: 2, name: "Bob Smith", email: "bob@example.com", role: "graduate" },
        { id: 3, name: "Carol Lee", email: "carol@example.com", role: "graduate" },
      ];
      localStorage.setItem("users", JSON.stringify(users));
    }

    const storedReports = JSON.parse(localStorage.getItem("reports") || "[]");
    const ts = JSON.parse(localStorage.getItem("timesheet") || "[]");

    setGraduates(users.filter((u) => u.role === "graduate"));
    setReports(storedReports);
    setTimesheet(ts);
  }, []);

  const stats = {
    pending: reports.filter((r) => r.status === "pending").length,
    approved: reports.filter((r) => r.status === "approved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
    totalGraduates: graduates.length,
  };

  const totalHours = timesheet.reduce((acc, entry) => {
    if (entry.clockOut) return acc + (entry.clockOut - entry.clockIn);
    return acc;
  }, 0) / 3600000;

  const recentReports = reports.slice(-5).reverse();

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle mt-1">Manage graduates and review reports</p>
          </div>
          <Link to="/admin/reports" className="btn-primary">
            <InboxIcon className="w-4 h-4" />
            Review Reports
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card"
          >
            <span className="stat-label">Total Graduates</span>
            <span className="stat-value">{stats.totalGraduates}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="stat-card"
          >
            <span className="stat-label">Total Hours</span>
            <span className="stat-value text-brand-red">{totalHours.toFixed(0)}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <span className="stat-label">Pending</span>
            <span className="stat-value text-amber-400">{stats.pending}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card"
          >
            <span className="stat-label">Approved</span>
            <span className="stat-value text-emerald-400">{stats.approved}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-card col-span-2 lg:col-span-1"
          >
            <span className="stat-label">Rejected</span>
            <span className="stat-value text-red-400">{stats.rejected}</span>
          </motion.div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Recent Reports</h2>
              <Link to="/admin/reports" className="text-sm text-brand-red hover:underline">
                View all
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="py-8 text-center text-white/40">
                <InboxIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No reports submitted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                        <DocumentIcon className="w-5 h-5 text-brand-red" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">
                          {report.type} Report
                        </p>
                        <p className="text-xs text-white/50">
                          {report.startDate} - {report.endDate}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        report.status === "approved"
                          ? "badge-approved"
                          : report.status === "rejected"
                          ? "badge-rejected"
                          : "badge-pending"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Graduates List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Graduates</h2>
              <Link to="/admin/graduates" className="text-sm text-brand-red hover:underline">
                View all
              </Link>
            </div>

            {graduates.length === 0 ? (
              <div className="py-8 text-center text-white/40">
                <UsersIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No graduates registered</p>
              </div>
            ) : (
              <div className="space-y-3">
                {graduates.slice(0, 5).map((graduate) => (
                  <Link
                    key={graduate.id}
                    to={`/admin/graduates/${graduate.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {graduate.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {graduate.name}
                      </p>
                      <p className="text-xs text-white/50 truncate">{graduate.email}</p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-white/30" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Icons
function InboxIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  );
}

function DocumentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
