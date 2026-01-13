import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/Api";

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [graduates, setGraduates] = useState([]);
  const [timesheet, setTimesheet] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportRes, graduatesRes, attendanceRes] = await Promise.all([
          api.admin.getReports({ page: 1, limit: 50 }),
          api.admin.getUsers({ role: "graduate", page: 1, limit: 100 }),
          api.attendance.getAll({ page: 1, limit: 500 }),
        ]);

        setReports(reportRes.data || []);
        setGraduates(graduatesRes.data || []);
        
        // Handle attendance response - could be { data: [] } or direct array
        const attendanceArray = Array.isArray(attendanceRes?.data) 
          ? attendanceRes.data 
          : Array.isArray(attendanceRes) 
            ? attendanceRes 
            : [];
        setTimesheet(attendanceArray);
      } catch (error) {
        console.error("Failed to load admin dashboard data", error);
      }
    };

    loadData();
  }, []);

  const stats = {
    totalReports: reports.length,
    withFeedback: reports.filter((r) => r.reviewComment).length,
    awaitingFeedback: reports.filter((r) => !r.reviewComment && r.status === "Submitted").length,
    totalGraduates: graduates.length,
  };

  // Match Graduate Timesheet totals logic:
  // - Count only closed sessions
  // - Prefer backend numeric duration (ms)
  // - Fallback to parsing formatted strings
  const parseDurationToHours = (entry) => {
    if (typeof entry?.duration === "number") {
      return entry.duration / (1000 * 60 * 60);
    }

    const formatted =
      (typeof entry?.durationFormatted === "string" && entry.durationFormatted) ||
      (typeof entry?.duration === "string" && entry.duration) ||
      "";

    if (formatted) {
      const parts = formatted.split(" ");
      const hours = parseInt(parts[0]?.replace(/\D/g, "")) || 0;
      const minutes = parseInt(parts[1]?.replace(/\D/g, "")) || 0;
      return hours + minutes / 60;
    }

    return 0;
  };

  const closedEntries = Array.isArray(timesheet)
    ? timesheet.filter((e) => Boolean(e?.clockOut) || e?.isClosed === true)
    : [];

  const totalHours = closedEntries.reduce(
    (acc, entry) => acc + parseDurationToHours(entry),
    0
  );

  // Log breakdown so we can trace what contributes to the total.
  // (Safe in production, but you can remove later.)
  useEffect(() => {
    if (!Array.isArray(closedEntries) || closedEntries.length === 0) return;

    const breakdown = closedEntries
      .map((e) => {
        const hours = parseDurationToHours(e);
        return {
          id: e?._id,
          userId: e?.userId?._id || e?.userId,
          userName: e?.userId?.name,
          clockIn: e?.clockIn,
          clockOut: e?.clockOut,
          isClosed: e?.isClosed,
          duration: e?.duration,
          durationFormatted: e?.durationFormatted,
          breakDuration: e?.breakDuration,
          hours,
        };
      })
      .filter((x) => x.hours > 0)
      .sort((a, b) => b.hours - a.hours);

    const top = breakdown.slice(0, 20);
    const sumTop = top.reduce((a, x) => a + x.hours, 0);
    const sumAll = breakdown.reduce((a, x) => a + x.hours, 0);

    console.groupCollapsed(
      `[AdminDashboard] Total hours debug | entries=${closedEntries.length} (closed only) | hours=${totalHours.toFixed(
        2
      )}`
    );
    console.log("sumAll(hours>0):", sumAll.toFixed(2), "sumTop20:", sumTop.toFixed(2));
    console.table(top);
    console.groupEnd();
  }, [closedEntries, totalHours]);

  const recentReports = reports.slice(0, 5);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle mt-1">Manage graduates and view reports</p>
          </div>
          <Link to="/admin/reports" className="btn-primary">
            <InboxIcon className="w-4 h-4" />
            View Reports
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
            <span className="stat-label">Total Hours (sample)</span>
            <span className="stat-value text-brand-red">{totalHours.toFixed(0)}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <span className="stat-label">Total Reports</span>
            <span className="stat-value text-blue-400">{stats.totalReports}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card"
          >
            <span className="stat-label">With Feedback</span>
            <span className="stat-value text-emerald-400">{stats.withFeedback}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-card col-span-2 lg:col-span-1"
          >
            <span className="stat-label">Awaiting Feedback</span>
            <span className="stat-value text-amber-400">{stats.awaitingFeedback}</span>
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
                    key={report._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                        <DocumentIcon className="w-5 h-5 text-brand-red" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">
                          Weekly Report
                        </p>
                        <p className="text-xs text-white/50">
                          {report.userId?.name || "Graduate"} •
                          {" "}
                          {new Date(report.weekStart).toLocaleDateString()} - {new Date(report.weekEnd).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
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
                    key={graduate._id}
                    to={`/admin/graduates/${graduate._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {graduate.name?.charAt(0) || "G"}
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