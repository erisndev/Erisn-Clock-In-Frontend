import { motion } from "framer-motion";

export default function ReportCard({
  report,
  onApprove,
  onReject,
  isAdmin = false,
}) {
  const statusConfig = {
    pending: { class: "badge-pending", label: "Pending" },
    approved: { class: "badge-approved", label: "Approved" },
    rejected: { class: "badge-rejected", label: "Rejected" },
  };

  return (
    <motion.div whileHover={{ y: -2 }} className="glass-card-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white capitalize">
            {report.type} Report
          </h3>
          <p className="text-sm text-white/50">
            {report.startDate} - {report.endDate}
          </p>
        </div>
        <span className={statusConfig[report.status].class}>
          {statusConfig[report.status].label}
        </span>
      </div>

      <p className="text-sm text-white/60 line-clamp-2 mb-3">
        {report.description}
      </p>

      <p className="text-xs text-white/40 mb-4">
        Submitted {new Date(report.submittedAt).toLocaleDateString()}
      </p>

      {isAdmin && report.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove?.(report.id)}
            className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onReject?.(report.id)}
            className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            Reject
          </button>
        </div>
      )}

      {report.adminComment && (
        <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs text-white/50 mb-1">Admin feedback:</p>
          <p className="text-sm text-white/70">{report.adminComment}</p>
        </div>
      )}
    </motion.div>
  );
}
