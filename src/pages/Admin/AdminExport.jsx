import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/Api";
import toast from "react-hot-toast";

export default function AdminExport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [format, setFormat] = useState("pdf");
  const [selectedUser, setSelectedUser] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const isAllSelected = selectedUser === "";

  // Load users for the dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.admin.getGraduates();
        const grads = Array.isArray(response) ? response : response.data || [];
        setUsers(grads);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Generate year options (last 3 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }, []);

  // Generate month options
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: new Date(2024, i).toLocaleString("default", { month: "long" }),
    }));
  }, []);

  const handleExport = async () => {
    setLoading(true);

    try {
      let response;

      if (selectedUser) {
        // 👤 Export one user
        response = await api.attendance.exportUser(selectedUser, {
          year: year.toString(),
          month: month.toString(),
          type: format,
        });
      } else {
        // 👥 Export ALL users → ZIP
        response = await api.attendance.exportAllZip({
          year: year.toString(),
          month: month.toString(),
          type: format,
        });
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const monthName =
        monthOptions.find((m) => m.value === month)?.label || month;

      if (selectedUser) {
        const userName =
          users
            .find((u) => u._id === selectedUser)
            ?.name?.replace(/[^a-z0-9]/gi, "_")
            .toLowerCase() || "user";

        a.download = `attendance_${userName}_${monthName}_${year}.${format}`;
      } else {
        a.download = `attendance_all_users_${monthName}_${year}.zip`;
      }

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Attendance exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(error.message || "Failed to export attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAllSelected && format === "csv") {
      setFormat("pdf");
    }
  }, [isAllSelected, format]);

  return (
    <DashboardLayout role="admin">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="page-title">Export Attendance</h1>
          <p className="page-subtitle mt-1">
            Export monthly attendance records as CSV or PDF
          </p>
        </div>

        {/* Export Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 max-w-2xl"
        >
          <h2 className="text-lg font-semibold text-white mb-6">
            Export Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* User Selection */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Graduate (Optional)
              </label>
              <div className="relative">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  disabled={loadingUsers}
                  className="w-full appearance-none bg-black/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="" className="bg-[#1a1a1a]">
                    All Graduates
                  </option>
                  {users.map((user) => (
                    <option
                      key={user._id}
                      value={user._id}
                      className="bg-[#1a1a1a]"
                    >
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Year
              </label>
              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full appearance-none bg-black/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all cursor-pointer"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y} className="bg-[#1a1a1a]">
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Month
              </label>
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full appearance-none bg-black/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all cursor-pointer"
                >
                  {monthOptions.map((m) => (
                    <option
                      key={m.value}
                      value={m.value}
                      className="bg-[#1a1a1a]"
                    >
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Format */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat("pdf")}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    format === "pdf"
                      ? "bg-brand-red text-white shadow-lg shadow-brand-red/25"
                      : "bg-white/[0.05] text-white/60 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <DocumentIcon className="w-5 h-5" />
                  PDF Document
                </button>
                <button
                  type="button"
                  onClick={() => !isAllSelected && setFormat("csv")}
                  disabled={isAllSelected}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    format === "csv"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-white/[0.05] text-white/60 border border-white/10"
                  } ${
                    isAllSelected
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-white/10"
                  }`}
                >
                  <TableIcon className="w-5 h-5" />
                  CSV Spreadsheet
                </button>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-brand-red text-white hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner className="w-5 h-5" />
                Exporting...
              </>
            ) : (
              <>
                <DownloadIcon className="w-5 h-5" />
                Export Attendance
              </>
            )}
          </button>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                <DocumentIcon className="w-5 h-5 text-brand-red" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  PDF Format
                </h3>
                <p className="text-xs text-white/50">
                  Formatted document with summary statistics, employee info, and
                  daily attendance table. Best for printing and sharing.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <TableIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  CSV Format
                </h3>
                <p className="text-xs text-white/50">
                  Raw data in spreadsheet format with all attendance details.
                  Best for data analysis and importing into Excel.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Export Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 max-w-2xl"
        >
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
            Export Contents
          </h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Daily attendance records (clock in/out times)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Work duration and break times</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Attendance status (present, absent, weekend, holiday)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Monthly summary statistics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Employee information (name, email, department)</span>
            </li>
          </ul>
        </motion.div>
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

function DownloadIcon({ className }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
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
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function TableIcon({ className }) {
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
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
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
