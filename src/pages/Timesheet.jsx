import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Timesheet() {
  const [entries, setEntries] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const timesheet = JSON.parse(localStorage.getItem("timesheet") || "[]");
    setEntries(timesheet);
  }, []);

  const formatDuration = (start, end) => {
    if (!end) return "In Progress";
    const ms = end - start;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const filteredEntries = entries.filter((entry) => {
    if (!startDate && !endDate) return true;
    const entryDate = new Date(entry.date).toISOString().split("T")[0];
    if (startDate && endDate) {
      return entryDate >= startDate && entryDate <= endDate;
    }
    if (startDate) return entryDate >= startDate;
    if (endDate) return entryDate <= endDate;
    return true;
  });

  const totalHours =
    filteredEntries.reduce((acc, entry) => {
      if (entry.clockOut) {
        return acc + (entry.clockOut - entry.clockIn);
      }
      return acc;
    }, 0) / 3600000;

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card"
        >
          <span className="stat-label">Total Entries</span>
          <span className="stat-value">{filteredEntries.length}</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="stat-card"
        >
          <span className="stat-label">Total Hours</span>
          <span className="stat-value text-brand-red">{totalHours.toFixed(1)}</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <span className="stat-label">Avg Hours/Day</span>
          <span className="stat-value">
            {filteredEntries.length > 0 ? (totalHours / filteredEntries.length).toFixed(1) : "0"}
          </span>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="input-label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex-1">
            <label className="input-label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button onClick={clearFilters} className="btn-secondary py-3">
            Clear
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="table-header">Date</th>
                <th className="table-header">Clock In</th>
                <th className="table-header">Clock Out</th>
                <th className="table-header">Duration</th>
                <th className="table-header">Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/40">
                    No timesheet entries found
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="table-cell font-medium text-white">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="table-cell">
                      {new Date(entry.clockIn).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="table-cell">
                      {entry.clockOut
                        ? new Date(entry.clockOut).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                          entry.clockOut
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {formatDuration(entry.clockIn, entry.clockOut)}
                      </span>
                    </td>
                    <td className="table-cell text-white/50 max-w-[200px] truncate">
                      {entry.note || "-"}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/[0.06]">
          {filteredEntries.length === 0 ? (
            <div className="px-4 py-12 text-center text-white/40">
              No timesheet entries found
            </div>
          ) : (
            filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                      entry.clockOut
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {formatDuration(entry.clockIn, entry.clockOut)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span>
                    In:{" "}
                    {new Date(entry.clockIn).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>
                    Out:{" "}
                    {entry.clockOut
                      ? new Date(entry.clockOut).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </span>
                </div>
                {entry.note && (
                  <p className="text-sm text-white/40 truncate">{entry.note}</p>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
