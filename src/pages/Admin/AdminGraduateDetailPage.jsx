import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminGraduateDetailPage() {
  const { id } = useParams();
  const graduateId = Number(id);
  const [graduate, setGraduate] = useState(null);
  const [timesheet, setTimesheet] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find((u) => u.id === graduateId);
    setGraduate(found || null);

    if (found) {
      const allTimesheet = JSON.parse(
        localStorage.getItem("timesheet") || "[]"
      );
      const graduateTimesheet = allTimesheet.filter(
        (entry) => entry.userId === graduateId
      );
      setTimesheet(graduateTimesheet);

      const allReports = JSON.parse(localStorage.getItem("reports") || "[]");
      const graduateReports = allReports.filter(
        (report) => report.userId === graduateId
      );
      setReports(graduateReports);
    }
  }, [graduateId]);

  const totalHours = useMemo(() => {
    const ms = timesheet.reduce((acc, entry) => {
      if (entry.clockOut) return acc + (entry.clockOut - entry.clockIn);
      return acc;
    }, 0);
    return ms / 3600000;
  }, [timesheet]);

  const exportClockins = () => {
    if (!graduate) return;

    const now = new Date();
    const sortedEntries = [...timesheet].sort((a, b) => b.clockIn - a.clockIn);
    const refDate =
      sortedEntries.length > 0 ? new Date(sortedEntries[0].date) : now;
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const byDay = timesheet.reduce((acc, entry) => {
      const d = new Date(entry.date);
      const key = d.toISOString().split("T")[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {});

    const rows = [];

    // Header with graduate info
    const monthName = new Date(year, month).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    rows.push([`Name: ${graduate.name}`]);
    rows.push([`Email: ${graduate.email}`]);
    rows.push([`Month: ${monthName}`]);
    rows.push([]); // Empty row

    // Column headers
    rows.push(["Date", "Clock In", "Clock Out", "Hours", "Status"]);

    // Data rows
    for (let day = 1; day <= daysInMonth; day++) {
      const current = new Date(year, month, day);
      const key = current.toISOString().split("T")[0];
      const dateFormatted = current.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const entries = byDay[key] || [];
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;

      if (entries.length === 0) {
        rows.push([
          dateFormatted,
          "",
          "",
          "",
          isWeekend ? "Weekend" : "Absent",
        ]);
      } else {
        entries.forEach((entry) => {
          const clockIn = new Date(entry.clockIn).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
          const clockOut = entry.clockOut
            ? new Date(entry.clockOut).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "";
          const hours = entry.clockOut
            ? ((entry.clockOut - entry.clockIn) / 3600000).toFixed(2)
            : "";

          rows.push([dateFormatted, clockIn, clockOut, hours, "Present"]);
        });
      }
    }

    // Add total row
    rows.push([]); // Empty row
    rows.push(["", "", "Total Hours:", totalHours.toFixed(2), ""]);

    // Convert to CSV
    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      )
      .join("\n");

    // Download
    const safeName = graduate.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_timesheet.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
                {graduate.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="page-title">{graduate.name}</h1>
              <p className="text-white/50">{graduate.email}</p>
            </div>
          </div>
          <Link to="/admin/graduates" className="btn-secondary">
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card"
          >
            <span className="stat-label">Clock-in Entries</span>
            <span className="stat-value">{timesheet.length}</span>
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
            <span className="stat-label">Reports</span>
            <span className="stat-value text-blue-400">{reports.length}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card"
          >
            <span className="stat-label">Avg Hours/Day</span>
            <span className="stat-value text-emerald-400">
              {timesheet.length > 0
                ? (totalHours / timesheet.length).toFixed(1)
                : "0"}
            </span>
          </motion.div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clock-in History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Clock-In History</h2>
              <button
                onClick={exportClockins}
                className="btn-primary text-sm py-2"
              >
                <ExportIcon className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {timesheet.length === 0 ? (
              <div className="py-8 text-center text-white/40">
                <ClockIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No clock-in data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="table-header">Date</th>
                      <th className="table-header">Clock In</th>
                      <th className="table-header">Clock Out</th>
                      <th className="table-header">Hours</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...timesheet]
                      .sort((a, b) => b.clockIn - a.clockIn)
                      .slice(0, 15)
                      .map((entry) => {
                        const durationMs = entry.clockOut
                          ? entry.clockOut - entry.clockIn
                          : 0;
                        const durationHours = (durationMs / 3600000).toFixed(2);
                        return (
                          <tr
                            key={entry.id}
                            className="border-b border-white/[0.04]"
                          >
                            <td className="table-cell font-medium text-white">
                              {new Date(entry.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </td>
                            <td className="table-cell">
                              {new Date(entry.clockIn).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </td>
                            <td className="table-cell">
                              {entry.clockOut
                                ? new Date(entry.clockOut).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    }
                                  )
                                : "-"}
                            </td>
                            <td className="table-cell">
                              {entry.clockOut ? `${durationHours}` : "-"}
                            </td>
                            <td className="table-cell">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                                  entry.clockOut
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-amber-500/10 text-amber-400"
                                }`}
                              >
                                {entry.clockOut ? "Present" : "In Progress"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-6"
          >
            <h2 className="section-title mb-4">Reports</h2>

            {reports.length === 0 ? (
              <div className="py-8 text-center text-white/40">
                <DocumentIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No reports submitted</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white capitalize text-sm">
                        {report.type} Report
                      </h4>
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
                    <p className="text-xs text-white/50 mb-2">
                      {report.startDate} - {report.endDate}
                    </p>
                    <p className="text-sm text-white/60 line-clamp-2">
                      {report.description}
                    </p>
                    {report.adminComment && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <p className="text-xs text-white/40">
                          Feedback: {report.adminComment}
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
    </DashboardLayout>
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

function ClockIcon({ className }) {
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
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
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
