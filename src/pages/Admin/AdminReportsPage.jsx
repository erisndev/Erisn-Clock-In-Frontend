import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewReport, setViewReport] = useState(null);
  const [comment, setComment] = useState("");
  const [actionType, setActionType] = useState("");

  useEffect(() => {
    const storedReports = JSON.parse(localStorage.getItem("reports") || "[]");
    setReports(storedReports);
  }, []);

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const handleAction = (report, action) => {
    setSelectedReport(report);
    setActionType(action);
    setComment("");
  };

  const confirmAction = () => {
    const updatedReports = reports.map((report) => {
      if (report.id === selectedReport.id) {
        return {
          ...report,
          status: actionType === "approve" ? "approved" : "rejected",
          adminComment: comment,
        };
      }
      return report;
    });

    localStorage.setItem("reports", JSON.stringify(updatedReports));
    setReports(updatedReports);
    setSelectedReport(null);
    setComment("");
  };

  const stats = {
    all: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    approved: reports.filter((r) => r.status === "approved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  };

  return (
    <>
      <DashboardLayout role="admin">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="page-title">Reports Queue</h1>
            <p className="page-subtitle mt-1">Review and manage graduate reports</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All", count: stats.all },
              { key: "pending", label: "Pending", count: stats.pending },
              { key: "approved", label: "Approved", count: stats.approved },
              { key: "rejected", label: "Rejected", count: stats.rejected },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? "bg-brand-red text-white"
                    : "bg-white/[0.05] text-white/60 hover:bg-white/10"
                }`}
              >
                {tab.label}
                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/10 text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Reports Grid */}
          {filteredReports.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <InboxIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
              <h3 className="text-lg font-semibold text-white mb-2">No reports found</h3>
              <p className="text-white/50">
                {filter === "all"
                  ? "No reports have been submitted yet"
                  : `No ${filter} reports`}
              </p>
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
                  </div>

                  {report.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAction(report, "approve")}
                        className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(report, "reject")}
                        className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {report.adminComment && (
                    <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-xs text-white/50 mb-1">Your feedback:</p>
                      <p className="text-sm text-white/70">{report.adminComment}</p>
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
                  <h2 className="text-xl font-bold text-white">{viewReport.userName}'s Report</h2>
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
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Admin Feedback</h3>
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
                {viewReport.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        setViewReport(null);
                        handleAction(viewReport, "approve");
                      }}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setViewReport(null);
                        handleAction(viewReport, "reject");
                      }}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedReport(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card p-6"
            >
              <h2 className="text-xl font-bold text-white mb-2">
                {actionType === "approve" ? "Approve Report" : "Reject Report"}
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Add a comment for the graduate (optional)
              </p>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your feedback..."
                rows={4}
                className="input-field resize-none mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    actionType === "approve"
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {actionType === "approve" ? "Approve" : "Reject"}
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
