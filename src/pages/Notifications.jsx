import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/Api";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async (loadMore = false) => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (loadMore && cursor) {
        params.cursor = cursor;
      }

      const data = await api.notifications.getAll(params);

      if (loadMore) {
        setNotifications([...notifications, ...(data.notifications || [])]);
      } else {
        setNotifications(data.notifications || []);
      }

      setHasMore(data.hasMore || false);
      setCursor(data.nextCursor || null);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    // Optimistically update UI first so the red dot/border disappears immediately.
    // Backend stores this as `isRead` (not `read`). We normalize on the frontend.
    const wasUnread = notifications.find(
      (n) => n._id === id && !(n.read || n.isRead)
    );

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n))
    );
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.notifications.markAsRead(id);
    } catch (error) {
      // Revert optimistic update if the API call fails
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, read: false, isRead: false } : n
        )
      );
      if (wasUnread) setUnreadCount((prev) => prev + 1);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, isRead: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.notifications.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      setCursor(null);
      toast.success("All notifications deleted");
    } catch (error) {
      toast.error("Failed to delete notifications");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "report_approved":
        return <CheckCircleIcon className="w-5 h-5 text-emerald-400" />;
      case "report_rejected":
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case "report_reviewed":
        return <EyeIcon className="w-5 h-5 text-amber-400" />;
      case "reminder":
        return <BellIcon className="w-5 h-5 text-blue-400" />;
      default:
        return <BellIcon className="w-5 h-5 text-white/40" />;
    }
  };

  return (
    <DashboardLayout role="graduate">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Notifications
            </h1>
            <p className="text-white/50 mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${
                    unreadCount > 1 ? "s" : ""
                  }`
                : "You're all caught up!"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-brand-red hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="text-sm text-white/60 hover:text-white hover:underline font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="flex items-center justify-center gap-3 text-white/50">
              <Spinner />
              <span>Loading notifications...</span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <BellIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No notifications
            </h3>
            <p className="text-white/50">
              You'll see notifications here when there's activity on your
              account
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() =>
                  !(notif.read || notif.isRead) && handleMarkAsRead(notif._id)
                }
                className={`glass-card p-4 cursor-pointer transition-all ${
                  notif.read || notif.isRead
                    ? "opacity-60 hover:opacity-80"
                    : "border-l-4 border-l-brand-red hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-semibold ${
                          notif.read || notif.isRead
                            ? "text-white/70"
                            : "text-white"
                        }`}
                      >
                        {notif.title}
                      </h3>
                      {!(notif.read || notif.isRead) && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-brand-red" />
                      )}
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        notif.read || notif.isRead
                          ? "text-white/40"
                          : "text-white/60"
                      }`}
                    >
                      {notif.message}
                    </p>
                    <p className="text-xs text-white/30 mt-2">
                      {new Date(notif.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={() => loadNotifications(true)}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Loading...
                </span>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Spinner Component
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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

function CheckCircleIcon({ className }) {
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
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function XCircleIcon({ className }) {
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
        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function EyeIcon({ className }) {
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
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
