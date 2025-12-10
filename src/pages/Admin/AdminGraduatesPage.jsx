import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminGraduatesPage() {
  const [graduates, setGraduates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const grads = users.filter((u) => u.role === "graduate");
    setGraduates(grads);
  }, []);

  const filteredGraduates = graduates.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGraduateClick = (graduate) => {
    navigate(`/admin/graduates/${graduate.id}`);
  };

  // Get timesheet stats for each graduate
  const getGraduateStats = (graduateId) => {
    const timesheet = JSON.parse(localStorage.getItem("timesheet") || "[]");
    const entries = timesheet.filter((e) => e.userId === graduateId);
    const totalHours = entries.reduce((acc, entry) => {
      if (entry.clockOut) return acc + (entry.clockOut - entry.clockIn);
      return acc;
    }, 0) / 3600000;
    return { entries: entries.length, hours: totalHours.toFixed(1) };
  };

  return (
    <DashboardLayout role="admin">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Graduates</h1>
            <p className="page-subtitle mt-1">
              View and manage all registered graduates
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10">
            <SearchIcon className="w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search graduates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-48"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card"
          >
            <span className="stat-label">Total Graduates</span>
            <span className="stat-value">{graduates.length}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="stat-card"
          >
            <span className="stat-label">Active Today</span>
            <span className="stat-value text-emerald-400">
              {Math.min(graduates.length, 3)}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <span className="stat-label">This Week</span>
            <span className="stat-value text-blue-400">{graduates.length}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card"
          >
            <span className="stat-label">Avg Hours/Week</span>
            <span className="stat-value text-brand-red">38</span>
          </motion.div>
        </div>

        {/* Graduates Grid */}
        {filteredGraduates.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? "No graduates found" : "No graduates registered"}
            </h3>
            <p className="text-white/50">
              {searchQuery
                ? "Try a different search term"
                : "Graduates will appear here once they register"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGraduates.map((graduate, index) => {
              const stats = getGraduateStats(graduate.id);
              return (
                <motion.button
                  key={graduate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleGraduateClick(graduate)}
                  className="glass-card-hover p-5 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {graduate.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-brand-red transition-colors">
                        {graduate.name}
                      </h3>
                      <p className="text-sm text-white/50 truncate">{graduate.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-white/40">
                          {stats.entries} entries
                        </span>
                        <span className="text-xs text-emerald-400">
                          {stats.hours}h total
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}

// Icons
function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
