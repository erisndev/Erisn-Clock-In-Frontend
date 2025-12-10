import { motion } from "framer-motion";

export default function ReportCard({ report }) {
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
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
          Submitted
        </span>
      </div>

      <p className="text-sm text-white/60 line-clamp-2 mb-3">
        {report.description}
      </p>

      <p className="text-xs text-white/40 mb-4">
        Submitted {new Date(report.submittedAt).toLocaleDateString()}
      </p>

      {report.adminComment && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 mb-1 font-medium">Admin Feedback:</p>
          <p className="text-sm text-white/80">{report.adminComment}</p>
        </div>
      )}
    </motion.div>
  );
}
