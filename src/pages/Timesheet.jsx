import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/Api";
import toast from "react-hot-toast";

export default function Timesheet() {
  const [entries, setEntries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Month options
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {};

      // Calculate date range based on selected month/year
      if (selectedMonth && selectedYear) {
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);
        const startDate = `${year}-${selectedMonth}-01`;
        // Get last day of month
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${selectedMonth}-${lastDay
          .toString()
          .padStart(2, "0")}`;
        params.startDate = startDate;
        params.endDate = endDate;
      } else if (selectedYear && !selectedMonth) {
        // If only year selected, get whole year
        params.startDate = `${selectedYear}-01-01`;
        params.endDate = `${selectedYear}-12-31`;
      }

      // Useful debug: shows the effective filters used when loading
      console.debug("[Timesheet] Loading attendance history", params);
      const response = await api.attendance.getHistory(params);

      // Handle both response formats: { data: [] } or direct array
      const entriesArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      // Defensive filtering: ignore clearly-invalid placeholder records
      // (e.g. epoch/1970 dates) which can show up from backend seed/default values.
      const sanitizedEntries = entriesArray.filter((entry) => {
        const clockIn = entry?.clockIn ? new Date(entry.clockIn) : null;
        if (!clockIn || Number.isNaN(clockIn.getTime())) return false;
        // Anything before year 2000 is almost certainly a placeholder (epoch-like).
        return clockIn.getFullYear() >= 2000;
      });

      // Useful debug: how many entries were returned vs displayed
      console.debug(
        "[Timesheet] Entries loaded:",
        sanitizedEntries.length,
        "/",
        entriesArray.length
      );

      setEntries(sanitizedEntries);
    } catch (error) {
      console.error("Failed to load timesheet:", error);
      toast.error("Failed to load timesheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedMonth, selectedYear]);

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

  const totalHours = Array.isArray(entries)
    ? entries.reduce((acc, entry) => {
        if (entry.duration) {
          
          // Handle duration as milliseconds (number)
          if (typeof entry.duration === "number") {
            const hours = entry.duration / (1000 * 60 * 60);
            return acc + hours;
          }

          // Handle duration as formatted string like "8h 30m" or "8h 30m 0s"
          if (typeof entry.duration === "string") {
            const parts = entry.duration.split(" ");
            const hours = parseInt(parts[0]?.replace(/\D/g, "")) || 0;
            const minutes = parseInt(parts[1]?.replace(/\D/g, "")) || 0;
            return acc + hours + minutes / 60;
          }
        }

        // Try durationFormatted if duration is not usable
        if (
          entry.durationFormatted &&
          typeof entry.durationFormatted === "string"
        ) {
                    const parts = entry.durationFormatted.split(" ");
          const hours = parseInt(parts[0]?.replace(/\D/g, "")) || 0;
          const minutes = parseInt(parts[1]?.replace(/\D/g, "")) || 0;
          return acc + hours + minutes / 60;
        }

        return acc;
      }, 0)
    : 0;

  const clearFilters = () => {
    setSelectedMonth("");
    setSelectedYear("");
  };

  // Set current month/year as default on mount
  useEffect(() => {
    const now = new Date();
    setSelectedYear(now.getFullYear().toString());
    setSelectedMonth((now.getMonth() + 1).toString().padStart(2, "0"));
  }, []);

  if (loading) return <div>Loading timesheet...</div>;

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
          <span className="stat-value">{entries.length}</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="stat-card"
        >
          <span className="stat-label">Total Hours</span>
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
          <span className="stat-label">Avg Hours/Day</span>
          <span className="stat-value">
            {entries.length > 0
              ? (totalHours / entries.length).toFixed(1)
              : "0"}
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
            <label className="input-label">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input-field appearance-none cursor-pointer"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="input-label">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field appearance-none cursor-pointer"
              disabled={!selectedYear}
            >
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={clearFilters} className="btn-secondary py-3">
            Clear
          </button>
        </div>
        {selectedMonth && selectedYear && (
          <p className="text-sm text-white/40 mt-3">
            Showing entries for{" "}
            {months.find((m) => m.value === selectedMonth)?.label}{" "}
            {selectedYear}
          </p>
        )}
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
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-white/40"
                  >
                    No timesheet entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <motion.tr
                    key={entry._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="table-cell font-medium text-white">
                      {new Date(entry.clockIn).toLocaleDateString("en-US", {
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
                        {formatDuration(entry)}
                      </span>
                    </td>
                    <td className="table-cell text-white/50 max-w-[200px] truncate">
                      {entry.notes || "-"}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/[0.06]">
          {entries.length === 0 ? (
            <div className="px-4 py-12 text-center text-white/40">
              No timesheet entries found
            </div>
          ) : (
            entries.map((entry, index) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">
                    {new Date(entry.clockIn).toLocaleDateString("en-US", {
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
                    {formatDuration(entry)}
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
                {entry.notes && (
                  <p className="text-sm text-white/40 truncate">
                    {entry.notes}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
