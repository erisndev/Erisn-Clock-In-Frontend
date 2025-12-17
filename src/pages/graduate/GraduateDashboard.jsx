import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import LiveClock from "../../components/LiveClock";
import api from "../../services/Api";
import toast from "react-hot-toast";

export default function GraduateDashboard() {
  const [timesheet, setTimesheet] = useState([]);
  const [reports, setReports] = useState([]);
  const [clockStatus, setClockStatus] = useState("clocked-out");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statusResponse, historyResponse, reportsData] = await Promise.all([
          api.attendance.getStatus(),
          api.attendance.getHistory({ limit: 5 }),
          api.reports.getMyReports(),
        ]);
        
        // Set clock status from backend
        setClockStatus(statusResponse.status || "clocked-out");
        
        // Ensure historyResponse.data is an array
        const attendanceArray = Array.isArray(historyResponse?.data) 
          ? historyResponse.data 
          : Array.isArray(historyResponse) 
            ? historyResponse 
            : [];
        setTimesheet(attendanceArray);
        
        // Ensure reportsData.data is an array
        const reportsArray = Array.isArray(reportsData?.data) ? reportsData.data : [];
        setReports(reportsArray);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const totalHours = Array.isArray(timesheet) ? timesheet.reduce((acc, entry) => {
    // Handle duration as number (milliseconds)
    if (typeof entry.duration === "number") {
      return acc + entry.duration / (1000 * 60 * 60);
    }
    
    // Handle duration as formatted string like "8h 30m"
    if (typeof entry.duration === "string") {
      const parts = entry.duration.split(" ");
      const hours = parseInt(parts[0]?.replace(/\D/g, "")) || 0;
      const minutes = parseInt(parts[1]?.replace(/\D/g, "")) || 0;
      return acc + hours + minutes / 60;
    }
    
    // Try durationFormatted if duration is not usable
    if (entry.durationFormatted && typeof entry.durationFormatted === "string") {
      const parts = entry.durationFormatted.split(" ");
      const hours = parseInt(parts[0]?.replace(/\D/g, "")) || 0;
      const minutes = parseInt(parts[1]?.replace(/\D/g, "")) || 0;
      return acc + hours + minutes / 60;
    }
    
    return acc;
  }, 0) : 0;

  const pendingReports = Array.isArray(reports) ? reports.filter(
    (r) => r.status === "Submitted" || r.status === "Reviewed"
  ).length : 0;
  
  const approvedReports = Array.isArray(reports) ? reports.filter(
    (r) => r.status === "Approved"
  ).length : 0;

  const recentEntries = Array.isArray(timesheet) ? timesheet.slice(0, 5) : [];

  // Helper function to format duration
  const formatDuration = (record) => {
    if (!record.clockOut) return "In Progress";
    
    // Use durationFormatted if available (from backend)
    if (record.durationFormatted) {
      return record.durationFormatted;
    }
    
    // If duration is a number (milliseconds), format it
    if (typeof record.duration === "number") {
      const totalSeconds = Math.floor(record.duration / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    
    // If duration is already a string, return it
    if (typeof record.duration === "string") {
      return record.duration;
    }
    
    return "0h 0m";
  };

  const statusConfig = {
    "clocked-out": { color: "bg-white/20", label: "Clocked Out" },
    "clocked-in": { color: "bg-emerald-500", label: "Clocked In" },
    "on-break": { color: "bg-amber-500", label: "On Break" },
  };

  if (loading) {
    return (
      <DashboardLayout role="graduate">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/50">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="graduate">
      <div className="space-y-6">
        {/* Header with Clock */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div>
              <h1 className="page-title">Welcome back! 👋</h1>
              <p className="page-subtitle mt-1">
                Here's an overview of your activity
              </p>
            </div>
          </div>
          
          {/* Live Clock Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card px-6 py-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-brand-red" />
            </div>
            <LiveClock showDate={false} size="small" className="text-left" />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card"
          >
            <span className="stat-label">Current Status</span>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-2.5 h-2.5 rounded-full ${statusConfig[clockStatus].color}`}
              />
              <span className="text-lg font-semibold text-white">
                {statusConfig[clockStatus].label}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="stat-card"
          >
            <span className="stat-label">Total Hours (Recent)</span>
            <span className="stat-value text-brand-red">
              {totalHours.toFixed(1)}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <span className="stat-label">Pending Reports</span>
            <span className="stat-value text-amber-400">{pendingReports}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card"
          >
            <span className="stat-label">Approved Reports</span>
            <span className="stat-value text-emerald-400">
              {approvedReports}
            </span>
          </motion.div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Recent Activity</h2>
              <Link
                to="/attendance"
                className="text-sm text-brand-red hover:underline"
              >
                View all
              </Link>
            </div>

            {recentEntries.length === 0 ? (
              <div className="py-8 text-center text-white/40">
                <ClockIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No clock-in entries yet</p>
                <Link
                  to="/clock"
                  className="text-brand-red hover:underline text-sm mt-2 inline-block"
                >
                  Clock in now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEntries.map((entry) => {
                  return (
                    <div
                      key={entry._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                          <CalendarIcon className="w-5 h-5 text-brand-red" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {new Date(entry.clockIn).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                          <p className="text-xs text-white/50">
                            {new Date(entry.clockIn).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                            {entry.clockOut && (
                              <>
                                {" - "}
                                {new Date(entry.clockOut).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          entry.clockOut ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {formatDuration(entry)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-6"
          >
            <h2 className="section-title mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/clock"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <ClockIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Clock In/Out</p>
                  <p className="text-xs text-white/50">Manage your time</p>
                </div>
              </Link>

              <Link
                to="/attendance"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <CalendarIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    View Timesheet
                  </p>
                  <p className="text-xs text-white/50">Check your history</p>
                </div>
              </Link>

              <Link
                to="/reports"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center group-hover:bg-brand-red/20 transition-colors">
                  <DocumentIcon className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Submit Report
                  </p>
                  <p className="text-xs text-white/50">Weekly progress</p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Icons
function ClockIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function DocumentIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}
