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

  // Format selected date nicely
  const formattedSelectedDate = useMemo(() => {
    const dateObj = new Date(selectedDate);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      weekday: "long",
    });
  }, [selectedDate]);

  // Fetch data
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

        console.log("📅 Fetch Date:", selectedDate);
        console.log("📦 Raw Data:", response.data);
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

  // Helper
  const getAttendance = (grad) => {
    let att = grad?.attendance;
    if (Array.isArray(att)) att = att[0] || {};
    if (!att || Object.keys(att).length === 0) {
      return { status: grad?.status };
    }
    return att;
  };

  // Filtered graduates
  const filteredGraduates = useMemo(() => {
    const filtered = graduates.filter((grad) => {
      const matchesSearch =
        grad.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grad.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const attendance = getAttendance(grad);
      const gradStatus = attendance?.status?.toLowerCase();

      const matchesStatus =
        statusFilter === "all" || gradStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });

    console.log("🔎 FILTER LOG");
    console.log("Search:", searchTerm);
    console.log("Status:", statusFilter);
    console.log("Date:", formattedSelectedDate);
    console.log("Filtered Count:", filtered.length);
    console.log("Filtered Records:", filtered);

    return filtered;
  }, [graduates, searchTerm, statusFilter, formattedSelectedDate]);

  const stats = useMemo(() => {
    const stat = { present: 0, absent: 0, weekend: 0, holiday: 0 };

    filteredGraduates.forEach((grad) => {
      const status = getAttendance(grad)?.status?.toLowerCase();
      if (stat.hasOwnProperty(status)) {
        stat[status]++;
      }
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

  return (
    <DashboardLayout role="admin">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle mt-1">
            All graduates attendance for {formattedSelectedDate}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="stat-card">
                  <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
                  <div className="h-6 w-10 rounded bg-white/[0.06] animate-pulse mt-2" />
                </div>
              ))}
            </>
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

        {/* Filters */}
        <div className="glass-card p-6 grid sm:grid-cols-3 gap-4">
          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white"
          />

          {/* Search */}
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white"
          />

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl 
             bg-[#1a1a1a] 
             text-white 
             border border-white/10 
             outline-none 
             focus:border-brand-red/50 
             appearance-none 
             cursor-pointer"
          >
            <option value="all" className="bg-[#1a1a1a] text-white">
              All
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

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full">
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
              {filteredGraduates.map((grad) => {
                const attendance = getAttendance(grad);
                const status = attendance?.status?.toLowerCase();

                return (
                  <tr key={grad._id} className="border-b border-white/5">
                    <td className="table-cell">{grad.name}</td>
                    <td className="table-cell text-white/60">{grad.email}</td>
                    <td className="table-cell">
                      <span
                        className="badge text-xs"
                        style={{
                          backgroundColor: `${getAttendanceColor(status)}20`,
                          color: getAttendanceColor(status),
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="table-cell text-white/60">
                      {attendance?.clockInFormatted || "-"}
                    </td>
                    <td className="table-cell text-white/60">
                      {attendance?.clockOutFormatted || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredGraduates.length === 0 && (
            <div className="p-6 text-center text-white/50">
              No graduates found
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="stat-card">
    <span className="stat-label">{label}</span>
    <span className={`stat-value ${color || ""}`}>{value}</span>
  </div>
);

export default GraduatesAttendanceView;
