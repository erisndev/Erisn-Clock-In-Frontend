import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/Api";
import toast from "react-hot-toast";
import logger from "./../../utils/logger";

// Helper function to get all weekdays (Mon-Fri) for a given month
function getWeekdaysInMonth(year, month) {
  const weekdays = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 6 = Saturday - skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdays.push(date);
    }
  }
  return weekdays;
}

// Helper to get local date key (YYYY-MM-DD) without UTC conversion
function getLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AdminGraduateDetailPage() {
  const { id } = useParams();
  const [graduate, setGraduate] = useState(null);
  const [timesheet, setTimesheet] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
  });

  useEffect(() => {
    const loadGraduateData = async () => {
      setLoading(true);
      try {
        logger.groupCollapsed("[AdminGraduateDetailPage] loadGraduateData", {
          id,
        });

        // Get all graduates and find the one with matching ID
        const graduatesRes = await api.admin.getUsers({ role: "graduate" });
        logger.log("[AdminGraduateDetailPage] graduatesRes:", graduatesRes);

        const graduates = graduatesRes.data || [];
        logger.log(
          "[AdminGraduateDetailPage] graduates count:",
          graduates.length,
        );

        const found = graduates.find((u) => u._id === id);
        logger.log("[AdminGraduateDetailPage] found graduate:", found);

        if (found) {
          setGraduate(found);

          // Get attendance history for this user
          try {
            logger.groupCollapsed(
              "[AdminGraduateDetailPage] attendance.getAll",
              {
                userId: id,
              },
            );

            const attendanceRes = await api.attendance.getAll({ userId: id });
            logger.log(
              "[AdminGraduateDetailPage] attendanceRes:",
              attendanceRes,
            );
            logger.log(
              "[AdminGraduateDetailPage] attendanceRes.data type:",
              Array.isArray(attendanceRes?.data)
                ? "array"
                : typeof attendanceRes?.data,
            );

            const attendanceArray = Array.isArray(attendanceRes?.data)
              ? attendanceRes.data
              : Array.isArray(attendanceRes)
                ? attendanceRes
                : [];

            logger.log(
              "[AdminGraduateDetailPage] attendanceArray length:",
              attendanceArray.length,
            );
            logger.log(
              "[AdminGraduateDetailPage] attendanceArray sample (first 3):",
              attendanceArray.slice(0, 3),
            );

            // Quick sanity check: are we accidentally receiving other users?
            const userIdMismatches = attendanceArray
              .filter((e) => e?.user && typeof e.user === "object")
              .filter((e) => e.user?._id && e.user?._id !== id);

            if (userIdMismatches.length > 0) {
              logger.warn(
                "[AdminGraduateDetailPage] WARNING: attendance entries contain mismatching userIds:",
                userIdMismatches.slice(0, 5),
              );
            }

            setTimesheet(attendanceArray);

            logger.groupEnd();
          } catch (err) {
            logger.error(
              "[AdminGraduateDetailPage] Failed to load attendance:",
              err,
            );
            setTimesheet([]);
            logger.groupEnd();
          }

          // Get reports for this user
          try {
            const reportsRes = await api.admin.getReports({ userId: id });
            logger.log("[AdminGraduateDetailPage] reportsRes:", reportsRes);

            // Handle both { data: [...] } and direct array response
            const reportsArray = Array.isArray(reportsRes?.data)
              ? reportsRes.data
              : Array.isArray(reportsRes)
                ? reportsRes
                : [];

            logger.log(
              "[AdminGraduateDetailPage] reportsArray length:",
              reportsArray.length,
            );
            logger.log(
              "[AdminGraduateDetailPage] reportsArray sample (first 3):",
              reportsArray.slice(0, 3),
            );

            setReports(reportsArray);
          } catch (err) {
            logger.error(
              "[AdminGraduateDetailPage] Failed to load reports:",
              err,
            );
            setReports([]);
          }
        } else {
          setGraduate(null);
        }

        logger.groupEnd();
      } catch (error) {
        logger.error(
          "[AdminGraduateDetailPage] Failed to load graduate data:",
          error,
        );
        toast.error("Failed to load graduate data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadGraduateData();
    }
  }, [id]);

  // Match Graduate Timesheet totals logic:
  // - Count only closed sessions
  // - Prefer backend numeric duration (ms)
  // - Fallback to parsing formatted strings
  const parseDurationToHours = (entry) => {
    if (typeof entry?.duration === "number") {
      return entry.duration / (1000 * 60 * 60);
    }

    const formatted =
      (typeof entry?.durationFormatted === "string" &&
        entry.durationFormatted) ||
      (typeof entry?.duration === "string" && entry.duration) ||
      "";

    if (formatted) {
      const parts = formatted.split(" ");
      const hours = parseInt(parts[0]?.replace(/\D/g, "")) || 0;
      const minutes = parseInt(parts[1]?.replace(/\D/g, "")) || 0;
      return hours + minutes / 60;
    }

    return 0;
  };

  const totalHours = useMemo(() => {
    const closedEntries = Array.isArray(timesheet)
      ? timesheet.filter((e) => Boolean(e?.clockOut) || e?.isClosed === true)
      : [];

    return closedEntries.reduce(
      (acc, entry) => acc + parseDurationToHours(entry),
      0,
    );
  }, [timesheet]);

  // Generate attendance data for all weekdays in selected month
  const attendanceData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const weekdays = getWeekdaysInMonth(year, month - 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Create a map of timesheet entries by date using LOCAL date key
    const timesheetByDate = {};

    // Debug timesheet mapping (helps detect timezone/dateKey issues)
    try {
      logger.groupCollapsed("[AdminGraduateDetailPage] attendanceData build", {
        selectedMonth,
        timesheetCount: Array.isArray(timesheet) ? timesheet.length : 0,
      });
      logger.log(
        "[AdminGraduateDetailPage] timesheet sample (first 5):",
        (timesheet || []).slice(0, 5),
      );
    } catch (_) {
      // ignore logging failures
    }

    timesheet.forEach((entry) => {
      const clockInDate = new Date(entry.clockIn);
      // Use local date key to avoid UTC day shift
      const dateKey = getLocalDateKey(clockInDate);
      if (!timesheetByDate[dateKey]) {
        timesheetByDate[dateKey] = [];
      }
      timesheetByDate[dateKey].push(entry);
    });

    try {
      const keys = Object.keys(timesheetByDate);
      logger.log(
        "[AdminGraduateDetailPage] timesheetByDate keys (sample):",
        keys.slice(0, 10),
      );
      if (keys.length > 0) {
        const k = keys[0];
        logger.log(
          `[AdminGraduateDetailPage] timesheetByDate['${k}'] length:`,
          timesheetByDate[k]?.length,
        );
        logger.log(
          `[AdminGraduateDetailPage] timesheetByDate['${k}'] sample:`,
          (timesheetByDate[k] || []).slice(0, 2),
        );
      }
      logger.groupEnd();
    } catch (_) {
      // ignore logging failures
    }

    return weekdays.map((date) => {
      // Use local date key for weekdays as well
      const dateKey = getLocalDateKey(date);
      const entries = timesheetByDate[dateKey] || [];
      const isFuture = date > today;

      if (entries.length > 0) {
        // Has clock-in entries
        // Match timesheet rules: only include closed sessions
        let totalHours = 0;
        entries.forEach((entry) => {
          if (!entry?.clockOut && entry?.isClosed !== true) return;
          totalHours += parseDurationToHours(entry);
        });

        const firstEntry = entries[0];
        const lastEntry = entries[entries.length - 1];

        return {
          date,
          dateKey,
          status: lastEntry.clockOut ? "present" : "in-progress",
          clockIn: new Date(firstEntry.clockIn),
          clockOut: lastEntry.clockOut ? new Date(lastEntry.clockOut) : null,
          hours: totalHours,
          entries,
        };
      } else if (isFuture) {
        return {
          date,
          dateKey,
          status: "future",
          clockIn: null,
          clockOut: null,
          hours: 0,
          entries: [],
        };
      } else {
        return {
          date,
          dateKey,
          status: "absent",
          clockIn: null,
          clockOut: null,
          hours: 0,
          entries: [],
        };
      }
    });
  }, [timesheet, selectedMonth]);

  // Calculate stats for selected month
  const monthStats = useMemo(() => {
    const presentDays = attendanceData.filter(
      (d) => d.status === "present" || d.status === "in-progress",
    ).length;
    const absentDays = attendanceData.filter(
      (d) => d.status === "absent",
    ).length;
    const totalWorkDays = attendanceData.filter(
      (d) => d.status !== "future",
    ).length;
    const totalHoursMonth = attendanceData.reduce((acc, d) => acc + d.hours, 0);

    return {
      presentDays,
      absentDays,
      totalWorkDays,
      totalHoursMonth,
      attendanceRate:
        totalWorkDays > 0
          ? ((presentDays / totalWorkDays) * 100).toFixed(0)
          : 0,
    };
  }, [attendanceData]);

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      options.push({ value, label });
    }
    return options;
  }, []);

  const [exportFormat, setExportFormat] = useState("pdf");
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteUser = useCallback(async () => {
    if (!id || deleting) return;
    setDeleting(true);
    try {
      await api.admin.deleteUser(id);
      toast.success(`${graduate?.name || "User"} has been deleted`);
      navigate("/admin/graduates");
    } catch (error) {
      logger.error("Failed to delete user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }, [id, deleting, graduate, navigate]);

  const exportClockins = async () => {
    if (!graduate || !id) return;

    const [year, month] = selectedMonth.split("-").map(Number);

    setExporting(true);
    try {
      const response = await api.attendance.exportUser(id, {
        year: year.toString(),
        month: month.toString(),
        type: exportFormat,
      });

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = graduate.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      a.download = `${safeName}_attendance_${selectedMonth}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Attendance exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      logger.error("Export failed:", error);
      toast.error(error.message || "Failed to export attendance");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="glass-card p-12 text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-white/60">Loading graduate data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!graduate) {
    return (
      <DashboardLayout role="admin">
        <div className="glass-card p-12 text-center">
          <p className="text-white/60">Graduate not found.</p>
          <Link
            to="/admin/graduates"
            className="text-brand-red hover:underline text-sm mt-4 inline-block"
          >
            Back to graduates
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center shadow-lg shadow-brand-red/30">
              <span className="text-white font-bold text-2xl">
                {graduate.name?.charAt(0) || "G"}
              </span>
            </div>
            <div>
              <h1 className="page-title">{graduate.name}</h1>
              <p className="text-white/50">{graduate.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {graduate.cellNumber && (
                  <span className="text-sm text-white/40">
                    {graduate.cellNumber}
                  </span>
                )}
                {graduate.department && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400">
                    {graduate.department}
                  </span>
                )}
                {graduate.province && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400">
                    {graduate.province}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all cursor-pointer"
            >
              <TrashIcon className="w-4 h-4" />
              Delete User
            </button>
            <Link to="/admin/graduates" className="btn-secondary">
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card"
          >
            <span className="stat-label">Present Days</span>
            <span className="stat-value text-emerald-400">
              {monthStats.presentDays}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="stat-card"
          >
            <span className="stat-label">Absent Days</span>
            <span className="stat-value text-red-400">
              {monthStats.absentDays}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <span className="stat-label">Month Hours</span>
            <span className="stat-value text-brand-red">
              {monthStats.totalHoursMonth.toFixed(1)}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card"
          >
            <span className="stat-label">Attendance</span>
            <span className="stat-value text-blue-400">
              {monthStats.attendanceRate}%
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-card"
          >
            <span className="stat-label">Reports</span>
            <span className="stat-value">{reports.length}</span>
          </motion.div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="section-title">Attendance History</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="appearance-none px-4 py-2 pr-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white outline-none focus:border-brand-red/50 cursor-pointer w-full sm:w-auto"
                  >
                    {monthOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-[#1a1a1a]"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="relative w-full sm:w-auto">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="appearance-none px-3 py-2 pr-8 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white outline-none focus:border-brand-red/50 cursor-pointer w-full sm:w-auto"
                  >
                    <option value="pdf" className="bg-[#1a1a1a]">
                      PDF
                    </option>
                    <option value="csv" className="bg-[#1a1a1a]">
                      CSV
                    </option>
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  onClick={exportClockins}
                  disabled={exporting}
                  className="btn-primary text-sm py-2 disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  {exporting ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <ExportIcon className="w-4 h-4" />
                  )}
                  {exporting ? "Exporting..." : "Export"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="table-header">Date</th>
                    <th className="table-header">Day</th>
                    <th className="table-header">Clock In</th>
                    <th className="table-header">Clock Out</th>
                    <th className="table-header">Hours</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((day) => (
                    <tr
                      key={day.dateKey}
                      className={`border-b border-white/[0.04] ${
                        day.status === "absent" ? "bg-red-500/5" : ""
                      }`}
                    >
                      <td className="table-cell font-medium text-white">
                        {day.date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="table-cell text-white/60">
                        {day.date.toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </td>
                      <td className="table-cell">
                        {day.clockIn
                          ? day.clockIn.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "-"}
                      </td>
                      <td className="table-cell">
                        {day.clockOut
                          ? day.clockOut.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "-"}
                      </td>
                      <td className="table-cell">
                        {day.hours > 0 ? day.hours.toFixed(2) : "-"}
                      </td>
                      <td className="table-cell">
                        {day.entries?.some(
                          (e) =>
                            e?.breakEndedBySystem === true ||
                            e?.breakEndedBySystem === "true",
                        ) && (
                          <span className="inline-flex mr-2 mb-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-300">
                            System break end
                          </span>
                        )}
                        {day.entries?.some(
                          (e) =>
                            typeof e?.breakOverdueMs === "number" &&
                            e.breakOverdueMs > 0,
                        ) && (
                          <span className="inline-flex mr-2 mb-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-300">
                            Overdue deducted
                          </span>
                        )}
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                            day.status === "present"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : day.status === "in-progress"
                                ? "bg-amber-500/10 text-amber-400"
                                : day.status === "absent"
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-white/10 text-white/40"
                          }`}
                        >
                          {day.status === "present"
                            ? "Present"
                            : day.status === "in-progress"
                              ? "In Progress"
                              : day.status === "absent"
                                ? "Absent"
                                : "Upcoming"}
                        </span>

                        {day.entries?.some((e) => e?.breakOverdueNote) && (
                          <div className="text-[11px] text-white/50 mt-1 line-clamp-2">
                            {day.entries.find((e) => e?.breakOverdueNote)
                              ?.breakOverdueNote || ""}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Weekly Reports</h2>
              {reports.length > 0 && (
                <span className="text-xs text-white/40">
                  {reports.length} report{reports.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {reports.length === 0 ? (
              <div className="py-8 text-center text-white/40">
                <DocumentIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No reports submitted</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {[...reports]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((report) => (
                    <div
                      key={report._id}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white capitalize text-sm">
                          Weekly Report
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            report.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : report.status === "Rejected"
                                ? "bg-red-500/10 text-red-400"
                                : report.status === "Reviewed"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mb-2">
                        {new Date(report.weekStart).toLocaleDateString()} -{" "}
                        {new Date(report.weekEnd).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-white/60 line-clamp-2">
                        {report.summary}
                      </p>
                      {report.challenges && (
                        <div className="mt-2">
                          <p className="text-xs text-white/40 mb-1">
                            Challenges:
                          </p>
                          <p className="text-xs text-white/60 line-clamp-2">
                            {report.challenges}
                          </p>
                        </div>
                      )}
                      {report.reviewComment && (
                        <div className="mt-2 pt-2 border-t border-white/[0.06]">
                          <p className="text-xs text-emerald-400 font-medium mb-1">
                            Feedback:
                          </p>
                          <p className="text-xs text-white/60">
                            {report.reviewComment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/10 p-6 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <TrashIcon className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Delete User
                </h3>
                <p className="text-sm text-white/50">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-sm text-white/70 mb-2">
              Are you sure you want to permanently delete this user?
            </p>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
              <p className="font-medium text-white">{graduate.name}</p>
              <p className="text-sm text-white/50">{graduate.email}</p>
              {graduate.department && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400">
                  {graduate.department}
                </span>
              )}
            </div>

            <p className="text-xs text-red-400/80 mb-6">
              ⚠ All associated data including attendance records, reports, and
              notifications will be permanently removed.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08] transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-4 h-4" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
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
function ArrowLeftIcon({ className }) {
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
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}

function ExportIcon({ className }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
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

function TrashIcon({ className }) {
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
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}
