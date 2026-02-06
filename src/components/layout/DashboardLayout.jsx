import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useScrollLock from "../../hooks/useScrollLock";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Lock scroll when mobile sidebar or logout modal is open
  useScrollLock(mobileOpen || logoutOpen);

  if (loading) {
    return null; // ProtectedRoute already shows a loader
  }

  // Extra safety (should never happen because of ProtectedRoute)
  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const role = user.role;

  // 🛡️ Auto-correct wrong dashboard access
  useEffect(() => {
    if (role === "admin" && !location.pathname.startsWith("/admin")) {
      navigate("/admin/dashboard", { replace: true });
    }

    if (role !== "admin" && location.pathname.startsWith("/admin")) {
      navigate("/dashboard", { replace: true });
    }
  }, [role, location.pathname, navigate]);

  const graduateLinks = [
    { to: "/dashboard", label: "Overview", icon: HomeIcon },
    { to: "/clock", label: "Clock In", icon: ClockIcon },
    { to: "/attendance", label: "Timesheet", icon: CalendarIcon },
    { to: "/reports", label: "Reports", icon: DocumentIcon },
    { to: "/notifications", label: "Notifications", icon: BellIcon },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", label: "Overview", icon: HomeIcon },
    { to: "/admin/reports", label: "Reports Queue", icon: InboxIcon },
    { to: "/admin/graduates", label: "Graduates", icon: UsersIcon },
    { to: "/admin/export", label: "Export", icon: DownloadIcon },
  ];

  const links = role === "admin" ? adminLinks : graduateLinks;

  const NavLink = ({ link, onClick }) => {
    const active = location.pathname === link.to;
    const Icon = link.icon;

    return (
      <Link
        to={link.to}
        onClick={onClick}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "bg-brand-red text-white"
            : "text-white/60 hover:text-white hover:bg-white/[0.06]"
        }`}
      >
        <Icon className="w-5 h-5" />
        {link.label}
      </Link>
    );
  };

  const LogoutConfirmModal = () => {
    const handleLogout = async () => {
      setLoggingOut(true);
      setLogoutOpen(false);

      try {
        await logout();
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        setLoggingOut(false);
      }
    };

    return createPortal(
      <AnimatePresence>
        {logoutOpen && (
          <div className="fixed inset-0 z-[2147483646] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setLogoutOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-[2147483647] w-[92vw] max-w-sm rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <h3 className="text-white font-semibold text-lg">
                  Confirm logout
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  Are you sure you want to log out?
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLogoutOpen(false)}
                    disabled={loggingOut}
                    className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="py-2.5 rounded-xl bg-brand-red text-white font-semibold hover:opacity-95 transition-opacity disabled:opacity-50"
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body,
    );
  };

  const SidebarContent = ({ onLinkClick }) => {
    return (
      <>
        <div className="px-4 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img
              src="/ELogo.png"
              alt="Erisn Logo"
              className="w-10 h-10 rounded-xl shadow-lg shadow-brand-red/30"
            />
            <div>
              <h1 className="text-base font-bold text-white">
                {role === "admin" ? "Admin" : "Graduate"}
              </h1>
              <p className="text-xs text-white/40">Clock-in System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
            Navigation
          </p>
          {links.map((link) => (
            <NavLink key={link.to} link={link} onClick={onLinkClick} />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
          >
            <LogoutIcon className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Logout confirm modal is rendered at layout root to avoid stacking-context issues */}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Mobile header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/50 backdrop-blur-xl lg:hidden sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img
            src="/ELogo.png"
            alt="Erisn Logo"
            className="w-8 h-8 rounded-lg"
          />
          <div>
            <h1 className="text-sm font-bold text-white">
              {role === "admin" ? "Admin" : "Graduate"}
            </h1>
            <p className="text-[10px] text-white/40">Clock-in System</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-colors"
        >
          {mobileOpen ? (
            <XIcon className="w-5 h-5 text-white" />
          ) : (
            <MenuIcon className="w-5 h-5 text-white" />
          )}
        </button>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 bg-black/40 border-r border-white/[0.06] flex-col fixed inset-y-0 left-0">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col z-50 lg:hidden"
              >
                <SidebarContent onLinkClick={() => setMobileOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Global logout modal */}
      <LogoutConfirmModal />
    </div>
  );
}

// Icons
function HomeIcon({ className }) {
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
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
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

function CalendarIcon({ className }) {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
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

function BellIcon({ className }) {
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
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}

function InboxIcon({ className }) {
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
        d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
      />
    </svg>
  );
}

function UsersIcon({ className }) {
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
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function LogoutIcon({ className }) {
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
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  );
}

function MenuIcon({ className }) {
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
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function XIcon({ className }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function SettingsIcon({ className }) {
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
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}
