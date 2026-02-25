import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import useScrollLock from "../../hooks/useScrollLock";
import api from "../../services/Api";
import logger from "./../../utils/logger";
import toast from "react-hot-toast";

// Helper functions for week calculations
function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);
  return { monday, friday };
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function getWeekLabel(monday, friday) {
  const options = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString(
    "en-US",
    options,
  )} - ${friday.toLocaleDateString("en-US", options)}`;
}

function getDefaultWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay();

  if (dayOfWeek >= 5 || dayOfWeek === 0) {
    return getWeekDates(today);
  } else {
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    return getWeekDates(lastWeek);
  }
}

function generateWeekOptions() {
  const weeks = [];
  const today = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i * 7);
    const { monday, friday } = getWeekDates(date);
    weeks.push({
      value: formatDate(monday),
      label: getWeekLabel(monday, friday),
      monday,
      friday,
    });
  }

  return weeks;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [feedbackReport, setFeedbackReport] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const defaultWeekValue = useMemo(() => {
    const { monday } = getDefaultWeek();
    return formatDate(monday);
  }, []);

  const [selectedWeek, setSelectedWeek] = useState(defaultWeekValue);
  const [actionLoading, setActionLoading] = useState(false);

  useScrollLock(!!viewReport || !!feedbackReport);

  const weekOptions = useMemo(() => generateWeekOptions(), []);

  // Load reports from API
  const loadReports = async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setContentLoading(true);
    }
    try {
      const params = {};

      // Add status filter
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      // Add week filter
      if (selectedWeek !== "all") {
        const weekOption = weekOptions.find((w) => w.value === selectedWeek);
        if (weekOption) {
          params.startDate = formatDate(weekOption.monday);
          params.endDate = formatDate(weekOption.friday);
        }
      }

      const response = await api.admin.getReports(params);
      // Handle both { data: [...] } and direct array response
      const reportsArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setReports(reportsArray);
      logger.log("Admin reports loaded:", response);
    } catch (error) {
      logger.error("Failed to load reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setInitialLoading(false);
      setContentLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadReports(true);
  }, []);

  // Auto-filter on filter changes (skip initial)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadReports();
  }, [statusFilter, selectedWeek]);

  // Filter reports by search query
  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((report) => {
        const userName = (report.userId?.name || "").toLowerCase();
        const userEmail = (report.userId?.email || "").toLowerCase();
        return userName.includes(query) || userEmail.includes(query);
      });
    }

    return filtered;
  }, [reports, searchQuery]);

  const handleOpenFeedback = (report) => {
    setFeedbackReport(report);
    setFeedback(report.reviewComment || "");
  };

  const handleApprove = async (reportId) => {
    setActionLoading(true);
    try {
      await api.admin.approveReport(reportId, {
        reviewComment: feedback || undefined,
      });
      toast.success("Report approved");
      loadReports();
      setFeedbackReport(null);
      setFeedback("");
    } catch (error) {
      toast.error(error.message || "Failed to approve report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reportId) => {
    if (!feedback.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionLoading(true);
    try {
      await api.admin.rejectReport(reportId, { reviewComment: feedback });
      toast.success("Report rejected");
      loadReports();
      setFeedbackReport(null);
      setFeedback("");
    } catch (error) {
      toast.error(error.message || "Failed to reject report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReviewed = async (reportId) => {
    setActionLoading(true);
    try {
      await api.admin.markReportReviewed(reportId, {
        reviewComment: feedback || undefined,
      });
      toast.success("Report marked as reviewed");
      loadReports();
      setFeedbackReport(null);
      setFeedback("");
    } catch (error) {
      toast.error(error.message || "Failed to mark report as reviewed");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: "bg-gray-500/20 text-gray-400",
      Submitted: "bg-blue-500/20 text-blue-400",
      Reviewed: "bg-yellow-500/20 text-yellow-400",
      Approved: "bg-emerald-500/20 text-emerald-400",
      Rejected: "bg-red-500/20 text-red-400",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400";
  };

  const currentWeekLabel =
    weekOptions.find((w) => w.value === selectedWeek)?.label || "All Weeks";

  // Stats
  const stats = useMemo(
    () => ({
      total: reports.length,
      submitted: reports.filter((r) => r.status === "Submitted").length,
      reviewed: reports.filter((r) => r.status === "Reviewed").length,
      approved: reports.filter((r) => r.status === "Approved").length,
      rejected: reports.filter((r) => r.status === "Rejected").length,
    }),
    [reports],
  );

  return (
    <>
      <DashboardLayout role="admin">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="page-title">Weekly Reports</h1>
              <p className="page-subtitle mt-1">
                Review and manage graduate weekly reports
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 flex-1 sm:max-w-xs">
                <SearchIcon className="w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search by graduate name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 rounded hover:bg-white/10 transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5 text-white/40" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none px-4 py-2.5 pr-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white outline-none focus:border-brand-red/50 cursor-pointer min-w-[140px]"
                >
                  <option value="all" className="bg-[#1a1a1a]">
                    All Status
                  </option>
                  <option value="Submitted" className="bg-[#1a1a1a]">
                    Submitted
                  </option>
                  <option value="Reviewed" className="bg-[#1a1a1a]">
                    Reviewed
                  </option>
                  <option value="Approved" className="bg-[#1a1a1a]">
                    Approved
                  </option>
                  <option value="Rejected" className="bg-[#1a1a1a]">
                    Rejected
                  </option>
                </select>
                <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Week Filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSelectedWeek((prev) =>
                      prev === "all" ? defaultWeekValue : "all",
                    )
                  }
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedWeek === "all"
                      ? "bg-brand-red text-white"
                      : "bg-white/[0.05] text-white/60 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  All Weeks
                </button>
                <div className="relative">
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="appearance-none px-4 py-2.5 pr-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white outline-none focus:border-brand-red/50 cursor-pointer min-w-[180px]"
                  >
                    {weekOptions.map((week) => (
                      <option
                        key={week.value}
                        value={week.value}
                        className="bg-[#1a1a1a]"
                      >
                        {week.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="glass-card px-4 py-3">
              <p className="text-xs text-white/50">Total</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="glass-card px-4 py-3">
              <p className="text-xs text-white/50">Submitted</p>
              <p className="text-xl font-bold text-blue-400">
                {stats.submitted}
              </p>
            </div>
            <div className="glass-card px-4 py-3">
              <p className="text-xs text-white/50">Reviewed</p>
              <p className="text-xl font-bold text-yellow-400">
                {stats.reviewed}
              </p>
            </div>
            <div className="glass-card px-4 py-3">
              <p className="text-xs text-white/50">Approved</p>
              <p className="text-xl font-bold text-emerald-400">
                {stats.approved}
              </p>
            </div>
            <div className="glass-card px-4 py-3">
              <p className="text-xs text-white/50">Rejected</p>
              <p className="text-xl font-bold text-red-400">{stats.rejected}</p>
            </div>
          </div>

          {/* Reports Grid */}
          {initialLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
                      <div className="h-3 w-40 rounded bg-white/[0.06] animate-pulse" />
                    </div>
                    <div className="h-6 w-16 rounded-full bg-white/[0.06] animate-pulse" />
                  </div>
                  <div className="h-12 rounded bg-white/[0.06] animate-pulse mb-4" />
                  <div className="h-3 w-32 rounded bg-white/[0.06] animate-pulse mb-4" />
                  <div className="flex gap-2">
                    <div className="flex-1 h-9 rounded-lg bg-white/[0.06] animate-pulse" />
                    <div className="flex-1 h-9 rounded-lg bg-white/[0.06] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredReports.length === 0 && !contentLoading ? (
            <div className="glass-card p-12 text-center">
              <InboxIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No reports found
              </h3>
              <p className="text-white/50">
                {searchQuery
                  ? `No reports found for "${searchQuery}"`
                  : "No reports match the current filters"}
              </p>
            </div>
          ) : (
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentLoading && (
                <div className="fixed inset-0 z-10 bg-black/30 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                  <div className="flex items-center gap-3 text-white/70">
                    <Spinner className="w-5 h-5" />
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                </div>
              )}
              {filteredReports.map((report, index) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {report.userId?.name || "Graduate"}
                      </h3>
                      <p className="text-sm text-white/50">
                        {new Date(report.weekStart).toLocaleDateString()} -{" "}
                        {new Date(report.weekEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        report.status,
                      )}`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <p className="text-sm text-white/60 line-clamp-3 mb-4">
                    {report.summary}
                  </p>

                  <p className="text-xs text-white/40 mb-4">
                    Submitted {new Date(report.createdAt).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewReport(report)}
                      className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                    >
                      View
                    </button>
                    {report.status === "Submitted" && (
                      <button
                        onClick={() => handleOpenFeedback(report)}
                        className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>

                  {report.reviewComment && (
                    <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-xs text-white/50 mb-1">Feedback:</p>
                      <p className="text-sm text-white/70 line-clamp-2">
                        {report.reviewComment}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </DashboardLayout>

      {/* View Report Modal */}
      <AnimatePresence>
        {viewReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              // exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewReport(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-card p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {viewReport.userId?.name}'s Report
                  </h2>
                  <p className="text-sm text-white/50">
                    {new Date(viewReport.weekStart).toLocaleDateString()} -{" "}
                    {new Date(viewReport.weekEnd).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      viewReport.status,
                    )}`}
                  >
                    {viewReport.status}
                  </span>
                  <button
                    onClick={() => setViewReport(null)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <XIcon className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                    Summary
                  </h3>
                  <p className="text-white/90">{viewReport.summary}</p>
                </div>

                {viewReport.challenges && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                      Challenges
                    </h3>
                    <p className="text-white/90">{viewReport.challenges}</p>
                  </div>
                )}

                {viewReport.learnings && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                      Key Learnings
                    </h3>
                    <p className="text-white/90">{viewReport.learnings}</p>
                  </div>
                )}

                {viewReport.nextWeek && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                      Plans for Next Week
                    </h3>
                    <p className="text-white/90">{viewReport.nextWeek}</p>
                  </div>
                )}

                {viewReport.goals && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                      Goals
                    </h3>
                    <p className="text-white/90">{viewReport.goals}</p>
                  </div>
                )}

                {viewReport.reviewComment && (
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                      Admin Feedback
                    </h3>
                    <p className="text-white/90">{viewReport.reviewComment}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => setViewReport(null)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                {viewReport.status === "Submitted" && (
                  <button
                    onClick={() => {
                      handleOpenFeedback(viewReport);
                      setViewReport(null);
                    }}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200"
                  >
                    Review Report
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {feedbackReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              // exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setFeedbackReport(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card p-6"
            >
              <h2 className="text-xl font-bold text-white mb-2">
                Review Report
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Review {feedbackReport.userId?.name}'s weekly report
              </p>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add feedback (required for rejection)..."
                rows={4}
                className="input-field resize-none mb-6"
              />

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(feedbackReport._id)}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(feedbackReport._id)}
                    disabled={actionLoading || !feedback.trim()}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition-all duration-200 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
                <button
                  onClick={() => handleMarkReviewed(feedbackReport._id)}
                  disabled={actionLoading}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-all duration-200 disabled:opacity-50"
                >
                  Mark as Reviewed
                </button>
                <button
                  onClick={() => {
                    setFeedbackReport(null);
                    setFeedback("");
                  }}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// Spinner Component
function Spinner({ className }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function InboxIcon({ className }) {
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
        d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
      />
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}
