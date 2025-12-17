import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/Api";
import toast from "react-hot-toast";

const DEPARTMENTS = [
  "Software Development",
  "Data Science",
  "UI/UX Design",
  "Project Management",
  "Quality Assurance",
  "DevOps",
  "Business Analysis",
  "Cybersecurity",
];

export default function AdminGraduatesPage() {
  const [graduates, setGraduates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const navigate = useNavigate();

  useEffect(() => {
    const loadGraduates = async () => {
      try {
        // Try the graduates endpoint first, fall back to users endpoint
        let grads = [];
        try {
          const response = await api.admin.getGraduates();
          grads = Array.isArray(response) ? response : (response.data || []);
        } catch {
          // Fall back to getUsers with role filter
          const response = await api.admin.getUsers({ role: "graduate" });
          grads = response.data || [];
        }
        setGraduates(grads);
      } catch (error) {
        console.error("Failed to load graduates:", error);
        toast.error("Failed to load graduates");
      } finally {
        setLoading(false);
      }
    };
    loadGraduates();
  }, []);

  const filteredGraduates = useMemo(() => {
    return graduates.filter((g) => {
      const matchesSearch =
        (g.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment =
        selectedDepartment === "All Departments" || g.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [graduates, searchQuery, selectedDepartment]);

  const handleGraduateClick = (graduate) => {
    navigate(`/admin/graduates/${graduate._id}`);
  };

  // Count graduates per department
  const departmentCounts = useMemo(() => {
    const counts = {};
    graduates.forEach((g) => {
      if (g.department) {
        counts[g.department] = (counts[g.department] || 0) + 1;
      }
    });
    return counts;
  }, [graduates]);

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
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 flex-1 sm:max-w-xs">
            <SearchIcon className="w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search graduates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-full"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white outline-none focus:border-brand-red/50 cursor-pointer min-w-[200px]"
            >
              <option value="All Departments" className="bg-[#1a1a1a]">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} className="bg-[#1a1a1a]">
                  {dept} {departmentCounts[dept] ? `(${departmentCounts[dept]})` : "(0)"}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            <span className="stat-label">Filtered Results</span>
            <span className="stat-value text-emerald-400">
              {filteredGraduates.length}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <span className="stat-label">Departments</span>
            <span className="stat-value text-blue-400">{Object.keys(departmentCounts).length}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card"
          >
            <span className="stat-label">Verified</span>
            <span className="stat-value text-brand-red">
              {graduates.filter(g => g.isEmailVerified).length}
            </span>
          </motion.div>
        </div>

        {/* Graduates Grid */}
        {loading ? (
          <div className="glass-card p-12 text-center">
            <Spinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-white/50">Loading graduates...</p>
          </div>
        ) : filteredGraduates.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery || selectedDepartment !== "All Departments"
                ? "No graduates found"
                : "No graduates registered"}
            </h3>
            <p className="text-white/50">
              {searchQuery || selectedDepartment !== "All Departments"
                ? "Try adjusting your filters"
                : "Graduates will appear here once they register"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGraduates.map((graduate, index) => (
              <motion.button
                key={graduate._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleGraduateClick(graduate)}
                className="glass-card-hover p-5 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {(graduate.name || "G").charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white group-hover:text-brand-red transition-colors">
                        {graduate.name}
                      </h3>
                      {graduate.isEmailVerified && (
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-sm text-white/50 truncate">{graduate.email}</p>
                    {graduate.department && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400">
                        {graduate.department}
                      </span>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {graduate.province && (
                        <span className="text-xs text-white/40">
                          {graduate.province}
                        </span>
                      )}
                      {graduate.cellNumber && (
                        <span className="text-xs text-white/40">
                          {graduate.cellNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
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

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
