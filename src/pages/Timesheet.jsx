import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/Api";
import toast from "react-hot-toast";
import { formatDateSA, formatTimeSA } from "../utils/time";

export default function Timesheet() {
  const [entries, setEntries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [, forceTick] = useState(0);

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
        // Include "absent"/"pending" day records (no clockIn) as well.
        const statusStr = String(
          entry?.attendanceStatus || entry?.status || entry?.state || ""
        ).toLowerCase();
        const isAbsentLike =
          statusStr === "absent" ||
          entry?.isAbsent === true ||
          entry?.markedAbsent === true ||
          entry?.absent === true ||
          entry?.is_absent === true ||
          entry?.marked_absent === true;

        if (isAbsentLike) return true;

        const clockIn = entry?.clockIn ? new Date(entry.clockIn) : null;
        if (!clockIn || Number.isNaN(clockIn.getTime())) return false;
        // Anything before year 2000 is almost certainly a placeholder (epoch-like).
        return clockIn.getFullYear() >= 2000;
      });

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

  // Optional: make open-session durations tick live
  useEffect(() => {
    const hasOpen = Array.isArray(entries)
      ? entries.some((e) => !e?.clockOut && e?.isClosed === false)
      : false;

    if (!hasOpen) return;

    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [entries]);

  const formatHMS = (ms) => {
    const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const getDurationForUI = (row) => {
    const clockInISO = row?.clockIn;
    const clockOutISO = row?.clockOut;
    const closed = Boolean(clockOutISO) || row?.isClosed === true;

    // Closed -> use backend
    if (closed) {
      const durationMs = typeof row?.duration === "number" ? row.duration : 0;
      return {
        durationMs,
        durationLabel: row?.durationFormatted || formatHMS(durationMs),
        source: "backend",
      };
    }

    // Open -> compute live
    if (!clockInISO) {
      return { durationMs: 0, durationLabel: formatHMS(0), source: "live" };
    }

    const clockInMs = new Date(clockInISO).getTime();
    const breaksMs =
      typeof row?.breakDuration === "number" ? row.breakDuration : 0;
    const liveMs = Number.isNaN(clockInMs)
      ? 0
      : Math.max(0, Date.now() - clockInMs - breaksMs);

    return {
      durationMs: liveMs,
      durationLabel: formatHMS(liveMs),
      source: "live",
    };
  };

  const formatDuration = (record) => {
    const d = getDurationForUI(record);
    return d.source === "live" ? `${d.durationLabel} (Live)` : d.durationLabel;
  };

  // Totals should match what is actually shown in the table (closed sessions only)
  const closedEntries = Array.isArray(entries)
    ? entries.filter((e) => Boolean(e?.clockOut) || e?.isClosed === true)
    : [];

  const totalHours = closedEntries.reduce((acc, entry) => {
    const d = getDurationForUI(entry);
    return acc + d.durationMs / (1000 * 60 * 60);
  }, 0);

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
            {closedEntries.length > 0
              ? (totalHours / closedEntries.length).toFixed(1)
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
                      {formatDateSA(entry.clockIn) || entry?.date || "-"}
                    </td>
                    <td className="table-cell">
                      {formatTimeSA(entry.clockIn) || "-"}
                    </td>
                    <td className="table-cell">
                      {entry.clockOut ? formatTimeSA(entry.clockOut) : "-"}
                    </td>
                    <td className="table-cell">
                      {entry.clockOut ? (
                        <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
                          {entry.durationFormatted || formatDuration(entry)}
                        </span>
                      ) : String(
                          entry?.attendanceStatus || entry?.status || entry?.state || ""
                        ).toLowerCase() === "absent" ||
                        entry?.isAbsent === true ||
                        entry?.markedAbsent === true ||
                        entry?.absent === true ||
                        entry?.is_absent === true ||
                        entry?.marked_absent === true ? (
                        <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400">
                          Absent
                        </span>
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
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
                    {formatDateSA(entry.clockIn) || entry?.date || "-"}
                  </span>
                  {entry.clockOut ? (
                    <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
                      {entry.durationFormatted || formatDuration(entry)}
                    </span>
                  ) : String(
                      entry?.attendanceStatus || entry?.status || entry?.state || ""
                    ).toLowerCase() === "absent" ||
                    entry?.isAbsent === true ||
                    entry?.markedAbsent === true ||
                    entry?.absent === true ||
                    entry?.is_absent === true ||
                    entry?.marked_absent === true ? (
                    <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400">
                      Absent
                    </span>
                  ) : (
                    <span className="text-white/30">-</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span>In: {formatTimeSA(entry.clockIn) || "-"}</span>
                  <span>
                    Out: {entry.clockOut ? formatTimeSA(entry.clockOut) : "-"}
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
