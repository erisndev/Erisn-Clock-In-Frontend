import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function GraduateReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [showNewReport, setShowNewReport] = useState(false);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [summary, setSummary] = useState("");
  const [challenges, setChallenges] = useState("");
  const [learnings, setLearnings] = useState("");
  const [nextWeek, setNextWeek] = useState("");
  const [goals, setGoals] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedReports = JSON.parse(localStorage.getItem("reports") || "[]");
    setReports(storedReports);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );

    const newReport = {
      id: Date.now(),
      weekStart,
      weekEnd,
      summary,
      challenges,
      learnings,
      nextWeek,
      goals,
      status: "pending",
      submittedAt: new Date().toISOString(),
      userId: currentUser?.id || null,
      userName: currentUser?.name || "Unknown",
    };

    const updatedReports = [...reports, newReport];
    localStorage.setItem("reports", JSON.stringify(updatedReports));
    setReports(updatedReports);

    setShowNewReport(false);
    setWeekStart("");
    setWeekEnd("");
    setSummary("");
    setChallenges("");
    setLearnings("");
    setNextWeek("");
    setGoals("");
    setIsSubmitting(false);
  };

  const statusConfig = {
    pending: { class: "badge-pending", label: "Pending" },
    approved: { class: "badge-approved", label: "Approved" },
    rejected: { class: "badge-rejected", label: "Rejected" },
  };

  return (
    <>
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
                Submit and track your weekly progress reports
              </p>
            </div>
            <button
              onClick={() => setShowNewReport(true)}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4" />
              New Report
            </button>
          </div>

          {/* Reports List */}
          {reports.length === 0 ? (
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
                onClick={() => setShowNewReport(true)}
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
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card-hover p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        Weekly Report
                      </h3>
                      <p className="text-sm text-white/50">
                        {report.weekStart} - {report.weekEnd}
                      </p>
                    </div>
                    <span className={statusConfig[report.status].class}>
                      {statusConfig[report.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 line-clamp-2 mb-3">
                    {report.summary}
                  </p>
                  <p className="text-xs text-white/40">
                    Submitted{" "}
                    {new Date(report.submittedAt).toLocaleDateString()}
                  </p>
                  {report.adminComment && (
                    <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-xs text-white/50 mb-1">
                        Admin feedback:
                      </p>
                      <p className="text-sm text-white/70">
                        {report.adminComment}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </DashboardLayout>

      {/* New Report Modal - Outside DashboardLayout */}
      <AnimatePresence>
        {showNewReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNewReport(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-card p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  New Weekly Report
                </h2>
                <button
                  onClick={() => setShowNewReport(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <XIcon className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Week Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Week Start Date *</label>
                    <input
                      type="date"
                      required
                      value={weekStart}
                      onChange={(e) => setWeekStart(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="input-label">Week End Date *</label>
                    <input
                      type="date"
                      required
                      value={weekEnd}
                      onChange={(e) => setWeekEnd(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <label className="input-label">Summary *</label>
                  <textarea
                    required
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={3}
                    placeholder="Provide a brief summary of your week..."
                    className="input-field resize-none"
                  />
                </div>

                {/* Challenges */}
                <div>
                  <label className="input-label">Challenges</label>
                  <textarea
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    rows={3}
                    placeholder="What challenges did you face this week?"
                    className="input-field resize-none"
                  />
                </div>

                {/* Learnings */}
                <div>
                  <label className="input-label">Key Learnings</label>
                  <textarea
                    value={learnings}
                    onChange={(e) => setLearnings(e.target.value)}
                    rows={3}
                    placeholder="What did you learn this week?"
                    className="input-field resize-none"
                  />
                </div>

                {/* Next Week Plans */}
                <div>
                  <label className="input-label">Plans for Next Week</label>
                  <textarea
                    value={nextWeek}
                    onChange={(e) => setNextWeek(e.target.value)}
                    rows={3}
                    placeholder="What are your plans for next week?"
                    className="input-field resize-none"
                  />
                </div>

                {/* Goals */}
                <div>
                  <label className="input-label">Goals</label>
                  <textarea
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    rows={3}
                    placeholder="What are your goals?"
                    className="input-field resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewReport(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
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
