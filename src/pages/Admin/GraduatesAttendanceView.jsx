import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import api from "../../services/Api";
import logger from "../../utils/logger";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";

const GraduatesAttendanceView = () => {
  const today = new Date().toISOString().split("T")[0];

  const [graduates, setGraduates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [selectedDate, setSelectedDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false); // mobile filter toggle

  const formattedSelectedDate = useMemo(() => {
    const dateObj = new Date(selectedDate);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      weekday: "long",
    });
  }, [selectedDate]);

  const fetchGraduatesAttendance = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await api.admin.getGraduatesAttendanceToday({
        page: pageNum,
        limit,
        startDate: selectedDate,
        endDate: selectedDate,
      });
      if (response.success) {
        setGraduates(response.data);
        setTotalPages(response.totalPages);
        setTotal(response.total);
        setPage(pageNum);
      } else {
        toast.error("Failed to fetch attendance data");
      }
    } catch (err) {
      toast.error(err.message || "Error fetching attendance data");
      logger.error("Attendance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraduatesAttendance(1);
  }, [selectedDate]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const getAttendance = (grad) => {
    let att = grad?.attendance;
    if (Array.isArray(att)) att = att[0] || {};
    if (!att || Object.keys(att).length === 0) return { status: grad?.status };
    return att;
  };

  const filteredGraduates = useMemo(() => {
    return graduates.filter((grad) => {
      const matchesSearch =
        grad.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grad.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const attendance = getAttendance(grad);
      const gradStatus = attendance?.status?.toLowerCase();
      const matchesStatus =
        statusFilter === "all" || gradStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [graduates, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const stat = { present: 0, absent: 0, weekend: 0, holiday: 0 };
    filteredGraduates.forEach((grad) => {
      const status = getAttendance(grad)?.status?.toLowerCase();
      if (stat.hasOwnProperty(status)) stat[status]++;
    });
    return stat;
  }, [filteredGraduates]);

  const getAttendanceColor = (status) => {
    const colors = {
      present: "#10b981",
      absent: "#ef4444",
      weekend: "#6b7280",
      holiday: "#3b82f6",
    };
    return colors[status] || "#6b7280";
  };

  const activeFilterCount = [
    searchTerm !== "",
    statusFilter !== "all",
    selectedDate !== today,
  ].filter(Boolean).length;

  return (
    <DashboardLayout role="admin">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 sm:space-y-6"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="page-title">Attendance</h1>
            {/* Full date on sm+, short on mobile */}
            <p className="page-subtitle mt-1 text-xs sm:text-sm line-clamp-1">
              <span className="hidden sm:inline">{formattedSelectedDate}</span>
              <span className="sm:hidden">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>

          {/* Mobile filter toggle button */}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="sm:hidden flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white"
          >
            <FilterIcon className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Stats ── */}
        {/* 2 cols on mobile → 5 on lg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="stat-card">
                <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
                <div className="h-6 w-10 rounded bg-white/[0.06] animate-pulse mt-2" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                label="Present"
                value={stats.present}
                color="text-emerald-400"
              />
              <StatCard
                label="Absent"
                value={stats.absent}
                color="text-red-400"
              />
              <StatCard
                label="Weekend"
                value={stats.weekend}
                color="text-gray-400"
              />
              <StatCard
                label="Holiday"
                value={stats.holiday}
                color="text-blue-400"
              />
              <StatCard label="Total" value={total} />
            </>
          )}
        </div>

        {/* ── Filters ── */}
        {/* Always visible on sm+, collapsible on mobile */}
        <div
          className={`glass-card p-4 sm:p-6 overflow-hidden transition-all duration-300 ${
            showFilters ? "block" : "hidden sm:block"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Date Picker */}
            <div className="relative">
              <label className="block text-xs text-white/40 mb-1.5 sm:hidden">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white outline-none focus:border-brand-red/50"
              />
            </div>

            {/* Search */}
            <div className="relative">
              <label className="block text-xs text-white/40 mb-1.5 sm:hidden">
                Search
              </label>
              <div className="relative">
                <SearchIcon className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-brand-red/50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs text-white/40 mb-1.5 sm:hidden">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-white border border-white/10 outline-none focus:border-brand-red/50 appearance-none cursor-pointer text-sm"
              >
                <option value="all" className="bg-[#1a1a1a] text-white">
                  All Statuses
                </option>
                <option value="present" className="bg-[#1a1a1a] text-white">
                  Present
                </option>
                <option value="absent" className="bg-[#1a1a1a] text-white">
                  Absent
                </option>
                <option value="holiday" className="bg-[#1a1a1a] text-white">
                  Holiday
                </option>
                <option value="weekend" className="bg-[#1a1a1a] text-white">
                  Weekend
                </option>
              </select>
            </div>
          </div>

          {/* Active filter chips on mobile */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 sm:hidden">
              {selectedDate !== today && (
                <Chip
                  label={`Date: ${selectedDate}`}
                  onRemove={() => setSelectedDate(today)}
                />
              )}
              {searchTerm && (
                <Chip
                  label={`"${searchTerm}"`}
                  onRemove={() => setSearchTerm("")}
                />
              )}
              {statusFilter !== "all" && (
                <Chip
                  label={
                    statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
                  }
                  onRemove={() => setStatusFilter("all")}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Table (desktop) / Cards (mobile) ── */}

        {/* Desktop table — hidden on mobile */}
        <div className="glass-card overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Clock In</th>
                  <th className="table-header">Clock Out</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <td key={j} className="table-cell">
                            <div className="h-3 rounded bg-white/[0.06] animate-pulse w-3/4" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredGraduates.map((grad) => {
                      const attendance = getAttendance(grad);
                      const status = attendance?.status?.toLowerCase();
                      return (
                        <tr
                          key={grad._id}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="table-cell font-medium text-white">
                            {grad.name}
                          </td>
                          <td className="table-cell text-white/60 text-sm">
                            {grad.email}
                          </td>
                          <td className="table-cell">
                            <StatusBadge
                              status={status}
                              getColor={getAttendanceColor}
                            />
                          </td>
                          <td className="table-cell text-white/60 text-sm">
                            {attendance?.clockInFormatted || "-"}
                          </td>
                          <td className="table-cell text-white/60 text-sm">
                            {attendance?.clockOutFormatted || "-"}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {!loading && filteredGraduates.length === 0 && (
            <div className="p-10 text-center text-white/40">
              <p className="text-sm">No graduates found</p>
            </div>
          )}
        </div>

        {/* Mobile cards — visible only on mobile */}
        <div className="sm:hidden space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-4 space-y-2 animate-pulse">
                <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
                <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
              </div>
            ))
          ) : filteredGraduates.length === 0 ? (
            <div className="glass-card p-8 text-center text-white/40 text-sm">
              No graduates found
            </div>
          ) : (
            filteredGraduates.map((grad) => {
              const attendance = getAttendance(grad);
              const status = attendance?.status?.toLowerCase();
              return (
                <div
                  key={grad._id}
                  className="glass-card p-4 flex flex-col gap-2"
                  style={{
                    borderLeft: `3px solid ${getAttendanceColor(status)}40`,
                  }}
                >
                  {/* Name + status */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-white text-sm truncate">
                      {grad.name}
                    </p>
                    <StatusBadge
                      status={status}
                      getColor={getAttendanceColor}
                    />
                  </div>
                  {/* Email */}
                  <p className="text-xs text-white/50 truncate">{grad.email}</p>
                  {/* Clock in/out */}
                  <div className="flex gap-4 mt-1">
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">
                        In
                      </p>
                      <p className="text-xs text-white/70">
                        {attendance?.clockInFormatted || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">
                        Out
                      </p>
                      <p className="text-xs text-white/70">
                        {attendance?.clockOutFormatted || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Result count ── */}
        {!loading && filteredGraduates.length > 0 && (
          <p className="text-xs text-white/30 text-center pb-2">
            Showing {filteredGraduates.length} of {total} graduate
            {total !== 1 ? "s" : ""}
          </p>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

/* ── Sub-components ── */

const StatCard = ({ label, value, color }) => (
  <div className="stat-card p-3 sm:p-4">
    <span className="stat-label text-[10px] sm:text-xs">{label}</span>
    <span className={`stat-value text-xl sm:text-2xl ${color || ""}`}>
      {value}
    </span>
  </div>
);

const StatusBadge = ({ status, getColor }) => (
  <span
    className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize flex-shrink-0"
    style={{
      backgroundColor: `${getColor(status)}20`,
      color: getColor(status),
    }}
  >
    {status || "—"}
  </span>
);

const Chip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs text-white/70">
    {label}
    <button
      onClick={onRemove}
      className="text-white/40 hover:text-white/80 ml-0.5"
    >
      <CloseIcon className="w-3 h-3" />
    </button>
  </span>
);

/* ── Icons ── */
function FilterIcon({ className }) {
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
        d="M3 4h18M7 12h10M11 20h2"
      />
    </svg>
  );
}
function SearchIcon({ className }) {
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
        d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
      />
    </svg>
  );
}
function CloseIcon({ className }) {
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

export default GraduatesAttendanceView;
