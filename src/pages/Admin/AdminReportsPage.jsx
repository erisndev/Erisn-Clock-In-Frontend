import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import useScrollLock from "../../hooks/useScrollLock";

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
  return `${monday.toLocaleDateString("en-US", options)} - ${friday.toLocaleDateString("en-US", options)}`;
}

function getDefaultWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
  
  // If it's Friday (5), Saturday (6), or Sunday (0), show current week
  // Otherwise show last week
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
  
  // Generate last 12 weeks
  for (let i = 0; i < 12; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (i * 7));
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
  const [viewReport, setViewReport] = useState(null);
  const [feedbackReport, setFeedbackReport] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const { monday } = getDefaultWeek();
    return formatDate(monday);
  });

  // Lock scroll when any modal is open
  useScrollLock(!!viewReport || !!feedbackReport);

  const weekOptions = useMemo(() => generateWeekOptions(), []);

  useEffect(() => {
    const storedReports = JSON.parse(localStorage.getItem("reports") || "[]");
    setReports(storedReports);
  }, []);

  // Filter reports by selected week and search query
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Filter by week
    if (selectedWeek !== "all") {
      const weekOption = weekOptions.find((w) => w.value === selectedWeek);
      if (weekOption) {
        filtered = filtered.filter((report) => {
          // Check if report's week overlaps with selected week
          const reportStart = new Date(report.weekStart);
          const reportEnd = new Date(report.weekEnd);
          
          return (
            (reportStart >= weekOption.monday && reportStart <= weekOption.friday) ||
            (reportEnd >= weekOption.monday && reportEnd <= weekOption.friday) ||
            (reportStart <= weekOption.monday && reportEnd >= weekOption.friday)
          );
        });
      }
    }

    // Filter by search query (graduate name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((report) => {
        const userName = (report.userName || "").toLowerCase();
        return userName.includes(query);
      });
    }

    return filtered;
  }, [reports, selectedWeek, weekOptions, searchQuery]);

  const handleOpenFeedback = (report) => {
    setFeedbackReport(report);
    setFeedback(report.adminComment || "");
  };

  const handleSubmitFeedback = () => {
    const updatedReports = reports.map((report) => {
      if (report.id === feedbackReport.id) {
        return {
          ...report,
          adminComment: feedback,
          feedbackAt: new Date().toISOString(),
        };
      }
      return report;
    });

    localStorage.setItem("reports", JSON.stringify(updatedReports));
    setReports(updatedReports);
    setFeedbackReport(null);
    setFeedback("");
  };

  const currentWeekLabel = weekOptions.find((w) => w.value === selectedWeek)?.label || "All Weeks";

  // Get unique graduate names for display
  const uniqueGraduates = useMemo(() => {
    const names = new Set(reports.map((r) => r.userName).filter(Boolean));
    return Array.from(names);
  }, [reports]);

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
              <p className="page-subtitle mt-1">View graduate weekly reports and share feedback</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4">
            {/* Search and Week Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search by Graduate */}
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

              {/* Week Filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedWeek("all")}
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
                      <option key={week.value} value={week.value} className="bg-[#1a1a1a]">
                        {week.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedWeek !== "all") && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/40">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium">
                    Graduate: "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} className="hover:text-blue-300">
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedWeek !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium">
                    Week: {currentWeekLabel}
                    <button onClick={() => setSelectedWeek("all")} className="hover:text-purple-300">
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedWeek("all");
                  }}
                  className="text-xs text-white/40 hover:text-white/60 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="glass-card px-5 py-3">
              <p className="text-sm text-white/50">Showing</p>
              <p className="text-2xl font-bold text-white">{filteredReports.length}</p>
            </div>
            <div className="glass-card px-5 py-3">
              <p className="text-sm text-white/50">Total Reports</p>
              <p className="text-2xl font-bold text-white/60">{reports.length}</p>
            </div>
            <div className="glass-card px-5 py-3">
              <p className="text-sm text-white/50">With Feedback</p>
              <p className="text-2xl font-bold text-emerald-400">
                {filteredReports.filter((r) => r.adminComment).length}
              </p>
            </div>
            <div className="glass-card px-5 py-3">
              <p className="text-sm text-white/50">Awaiting Feedback</p>
              <p className="text-2xl font-bold text-amber-400">
                {filteredReports.filter((r) => !r.adminComment).length}
              </p>
            </div>
          </div>

          {/* Reports Grid */}
          {filteredReports.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <InboxIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
              <h3 className="text-lg font-semibold text-white mb-2">No reports found</h3>
              <p className="text-white/50">
                {searchQuery
                  ? `No reports found for "${searchQuery}"`
                  : selectedWeek === "all"
                  ? "No reports have been submitted yet"
                  : `No reports for ${currentWeekLabel}`}
              </p>
              {(searchQuery || selectedWeek !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedWeek("all");
                  }}
                  className="mt-4 text-sm text-brand-red hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {report.userName || "Graduate"}
                      </h3>
                      <p className="text-sm text-white/50">
                        {report.weekStart} - {report.weekEnd}
                      </p>
                    </div>
                    {report.adminComment ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                        Feedback Sent
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                        New
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-white/60 line-clamp-3 mb-4">
                    {report.summary}
                  </p>

                  <p className="text-xs text-white/40 mb-4">
                    Submitted {new Date(report.submittedAt).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewReport(report)}
                      className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleOpenFeedback(report)}
                      className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                    >
                      {report.adminComment ? "Edit Feedback" : "Add Feedback"}
                    </button>
                  </div>

                  {report.adminComment && (
                    <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-xs text-white/50 mb-1">Your feedback:</p>
                      <p className="text-sm text-white/70 line-clamp-2">{report.adminComment}</p>
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
              exit={{ opacity: 0 }}
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
                  <h2 className="text-xl font-bold text-white">{viewReport.userName}'s Weekly Report</h2>
                  <p className="text-sm text-white/50">{viewReport.weekStart} - {viewReport.weekEnd}</p>
                </div>
                <button
                  onClick={() => setViewReport(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <XIcon className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Summary</h3>
                  <p className="text-white/90">{viewReport.summary}</p>
                </div>

                {/* Challenges */}
                {viewReport.challenges && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Challenges</h3>
                    <p className="text-white/90">{viewReport.challenges}</p>
                  </div>
                )}

                {/* Learnings */}
                {viewReport.learnings && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Key Learnings</h3>
                    <p className="text-white/90">{viewReport.learnings}</p>
                  </div>
                )}

                {/* Next Week */}
                {viewReport.nextWeek && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Plans for Next Week</h3>
                    <p className="text-white/90">{viewReport.nextWeek}</p>
                  </div>
                )}

                {/* Goals */}
                {viewReport.goals && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Goals</h3>
                    <p className="text-white/90">{viewReport.goals}</p>
                  </div>
                )}

                {/* Admin Comment */}
                {viewReport.adminComment && (
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Your Feedback</h3>
                    <p className="text-white/90">{viewReport.adminComment}</p>
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
                <button
                  onClick={() => {
                    handleOpenFeedback(viewReport);
                    setViewReport(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200"
                >
                  {viewReport.adminComment ? "Edit Feedback" : "Add Feedback"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                Share Feedback
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Provide feedback for {feedbackReport.userName}'s weekly report
              </p>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback for the graduate..."
                rows={5}
                className="input-field resize-none mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFeedbackReport(null);
                    setFeedback("");
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!feedback.trim()}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function InboxIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
