import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import useScrollLock from "../../hooks/useScrollLock";
import api from "../../services/Api";
import toast from "react-hot-toast";

export default function GraduateReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState(null);

  useScrollLock(!!viewReport);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await api.reports.getMyReports();
        // Handle both { data: [...] } and direct array response
        const reportsArray = Array.isArray(response?.data) 
          ? response.data 
          : Array.isArray(response) 
            ? response 
            : [];
        setReports(reportsArray);
      } catch (error) {
        console.error("Failed to load reports:", error);
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      Draft: "bg-gray-500/20 text-gray-400",
      Submitted: "bg-blue-500/20 text-blue-400",
      Reviewed: "bg-yellow-500/20 text-yellow-400",
      Approved: "bg-green-500/20 text-green-400",
      Rejected: "bg-red-500/20 text-red-400",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <DashboardLayout role="graduate">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Weekly Reports</h1>
            <p className="page-subtitle mt-1">
              View and submit your weekly progress reports
            </p>
          </div>
          <button
            onClick={() => navigate("/reports/new")}
            className="btn-primary"
          >
            <PlusIcon className="w-4 h-4" />
            New Report
          </button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="glass-card p-12 text-center">
            <Spinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-white/50">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <DocumentIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No reports yet
            </h3>
            <p className="text-white/50 mb-6">
              Submit your first weekly report to get started
            </p>
            <button
              onClick={() => navigate("/reports/new")}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4" />
              Create Report
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report, index) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card-hover p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">Weekly Report</h3>
                    <p className="text-sm text-white/50">
                      {new Date(report.weekStart).toLocaleDateString()} -{" "}
                      {new Date(report.weekEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {report.status}
                  </span>
                </div>

                <p className="text-sm text-white/60 line-clamp-2 mb-3">
                  {report.summary}
                </p>

                <p className="text-xs text-white/40 mb-3">
                  Submitted {new Date(report.createdAt).toLocaleDateString()}
                </p>

                {report.reviewComment && (
                  <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 mb-1 font-medium">
                      Admin Feedback:
                    </p>
                    <p className="text-sm text-white/80 whitespace-pre-wrap">
                      {report.reviewComment}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setViewReport(report)}
                  className="mt-4 w-full py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                >
                  View
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* View Report Modal */}
        {viewReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewReport(null)}
            />

            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0f]/90 shadow-2xl shadow-black/40">
              {/* Top bar */}
              <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/10">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                    Weekly Report
                  </h2>
                  <p className="text-sm text-white/50 mt-1">
                    {new Date(viewReport.weekStart).toLocaleDateString()} -{" "}
                    {new Date(viewReport.weekEnd).toLocaleDateString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewReport(null)}
                  className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <XIcon className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
                <div className="space-y-5">
                  <Section title="Summary">
                    <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                      {viewReport.summary}
                    </p>
                  </Section>

                  {viewReport.challenges && (
                    <Section title="Challenges">
                      <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                        {viewReport.challenges}
                      </p>
                    </Section>
                  )}

                  {viewReport.learnings && (
                    <Section title="Key Learnings">
                      <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                        {viewReport.learnings}
                      </p>
                    </Section>
                  )}

                  {viewReport.nextWeek && (
                    <Section title="Plans for Next Week">
                      <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                        {viewReport.nextWeek}
                      </p>
                    </Section>
                  )}

                  {viewReport.goals && (
                    <Section title="Goals">
                      <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                        {viewReport.goals}
                      </p>
                    </Section>
                  )}

                  {viewReport.reviewComment && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                          Admin Feedback
                        </p>
                        <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Feedback
                        </span>
                      </div>
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                          {viewReport.reviewComment}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setViewReport(null)}
                  className="w-full sm:w-auto btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
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

// Icons
function PlusIcon({ className }) {
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
        d="M12 4.5v15m7.5-7.5h-15"
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

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
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
