import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/Api";
import toast from "react-hot-toast";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    name: "",
    cellNumber: "",
    department: "",
    province: "",
  });
  const [preferencesForm, setPreferencesForm] = useState({
    timezone: "UTC",
    notificationChannels: [],
    emailFrequency: "immediate",
  });
  const [newPassword, setNewPassword] = useState("");
  const [pushPermission, setPushPermission] = useState(
    typeof Notification !== "undefined"
      ? Notification.permission
      : "unsupported",
  );
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const profileData = await api.user.getProfile();

        setProfile(profileData);
        setProfileForm({
          name: profileData.name || "",
          cellNumber: profileData.cellNumber || "",
          department: profileData.department || "",
          province: profileData.province || "",
        });

        // Preferences are nested inside the profile response
        if (profileData.preferences) {
          setPreferencesForm({
            timezone: profileData.preferences.timezone || "UTC",
            notificationChannels:
              profileData.preferences.notificationChannels || [],
            emailFrequency:
              profileData.preferences.emailFrequency || "immediate",
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.user.updateProfile(profileForm);
      setProfile(updated);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  // Uses the updated notifications API client (Api.js)
  const ensurePushSubscription = async () => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) {
      setPushPermission("unsupported");
      throw new Error("This browser does not support notifications");
    }

    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported in this browser");
    }

    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission !== "granted") {
      throw new Error("Push permission not granted");
    }

    // Register SW (required for push)
    const reg = await navigator.serviceWorker.register("/sw.js");

    // Get VAPID public key from backend
    const { publicKey } = await api.notifications.getVapidPublicKey();
    if (!publicKey) {
      throw new Error("Missing VAPID public key from backend");
    }

    // Subscribe (or reuse existing subscription)
    const existing = await reg.pushManager.getSubscription();
    const subscription =
      existing ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    // Save subscription to backend (upsert)
    await api.notifications.subscribePush(subscription);

    return subscription;
  };

  const handleSendDemoPush = async () => {
    setPushBusy(true);
    try {
      await ensurePushSubscription();
      await api.notifications.demoPush({
        title: "Demo Push",
        message: "If you can see this, Web Push works!",
      });
      toast.success("Demo push sent. Check your system notifications.");
    } catch (error) {
      toast.error(error.message || "Failed to send demo push");
    } finally {
      setPushBusy(false);
    }
  };

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    try {
      // If enabling web push, ensure we have a valid browser subscription registered.
      if (preferencesForm.notificationChannels.includes("webpush")) {
        setPushBusy(true);
        await ensurePushSubscription();
      }

      const result = await api.user.updatePreferences(preferencesForm);
      // Update local state with the returned preferences
      if (result.preferences) {
        setPreferencesForm({
          timezone: result.preferences.timezone || "UTC",
          notificationChannels: result.preferences.notificationChannels || [],
          emailFrequency: result.preferences.emailFrequency || "immediate",
        });
      }
      toast.success("Preferences updated");
    } catch (error) {
      toast.error(error.message || "Failed to update preferences");
    } finally {
      setPushBusy(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      await api.user.updateProfile({ password: newPassword });
      toast.success("Password updated");
      setNewPassword("");
    } catch (error) {
      toast.error(error.message || "Failed to update password");
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="graduate">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/50">Loading settings...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="graduate">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Settings
          </h1>
          <p className="text-white/50 mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-brand-red" />
            Profile
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Full Name
                </label>
                <input
                  name="name"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  placeholder="Your full name"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Email
                </label>
                <input
                  name="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
                />
                {profile?.isEmailVerified && (
                  <span className="text-xs text-emerald-400 mt-1 inline-flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Cell Number
                </label>
                <input
                  name="cellNumber"
                  value={profileForm.cellNumber}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      cellNumber: e.target.value,
                    })
                  }
                  placeholder="Your cell number"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Department
                </label>
                <input
                  name="department"
                  value={profileForm.department}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      department: e.target.value,
                    })
                  }
                  placeholder="Your department"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Province
                </label>
                <div className="relative">
                  <select
                    name="province"
                    value={profileForm.province}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        province: e.target.value,
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="">Select Province</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Free State">Free State</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="Northern Cape">Northern Cape</option>
                    <option value="North West">North West</option>
                    <option value="Western Cape">Western Cape</option>
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Role
                </label>
                <input
                  name="role"
                  value={profile?.role || ""}
                  disabled
                  className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed capitalize"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-brand-red hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Update Profile
              </button>
            </div>
          </form>
        </motion.section>

        {/* Preferences Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-brand-red" />
            Preferences
          </h2>
          <form onSubmit={handleUpdatePreferences} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Timezone
              </label>
              <div className="relative">
                <select
                  value={preferencesForm.timezone}
                  onChange={(e) =>
                    setPreferencesForm({
                      ...preferencesForm,
                      timezone: e.target.value,
                    })
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="UTC">UTC</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Africa/Johannesburg">
                    Africa/Johannesburg (SAST)
                  </option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">
                    America/New York (EST/EDT)
                  </option>
                </select>
                <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                Notification Channels
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      value="email"
                      checked={preferencesForm.notificationChannels.includes(
                        "email",
                      )}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...preferencesForm.notificationChannels, "email"]
                          : preferencesForm.notificationChannels.filter(
                              (c) => c !== "email",
                            );
                        setPreferencesForm({
                          ...preferencesForm,
                          notificationChannels: channels,
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-white/20 rounded bg-black/30 peer-checked:bg-brand-red peer-checked:border-brand-red transition-all flex items-center justify-center">
                      {preferencesForm.notificationChannels.includes(
                        "email",
                      ) && <CheckIcon className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="text-white/80 group-hover:text-white transition-colors">
                    Email
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      value="webpush"
                      checked={preferencesForm.notificationChannels.includes(
                        "webpush",
                      )}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...preferencesForm.notificationChannels, "webpush"]
                          : preferencesForm.notificationChannels.filter(
                              (c) => c !== "webpush",
                            );
                        setPreferencesForm({
                          ...preferencesForm,
                          notificationChannels: channels,
                        });

                        // Best-effort: update UI permission status when enabling.
                        if (
                          e.target.checked &&
                          typeof Notification !== "undefined"
                        ) {
                          Notification.requestPermission().then((p) =>
                            setPushPermission(p),
                          );
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-white/20 rounded bg-black/30 peer-checked:bg-brand-red peer-checked:border-brand-red transition-all flex items-center justify-center">
                      {preferencesForm.notificationChannels.includes(
                        "webpush",
                      ) && <CheckIcon className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="text-white/80 group-hover:text-white transition-colors">
                    Push Notifications
                  </span>
                </label>

                <div className="w-full text-xs text-white/40 -mt-2">
                  Push permission:{" "}
                  <span className="text-white/60">{pushPermission}</span>
                </div>

                <div className="w-full pt-2">
                  <button
                    type="button"
                    onClick={handleSendDemoPush}
                    disabled={pushBusy}
                    className="bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pushBusy ? "Working..." : "Send Demo Push"}
                  </button>
                  <p className="text-xs text-white/40 mt-2">
                    Sends a test push.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Email Frequency
              </label>
              <div className="relative">
                <select
                  value={preferencesForm.emailFrequency}
                  onChange={(e) =>
                    setPreferencesForm({
                      ...preferencesForm,
                      emailFrequency: e.target.value,
                    })
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                </select>
                <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pushBusy}
                className="bg-brand-red hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pushBusy ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        </motion.section>

        {/* Change Password Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <LockIcon className="w-5 h-5 text-brand-red" />
            Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-red hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Change Password
            </button>
          </form>
        </motion.section>

        {/* Account Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <InfoIcon className="w-5 h-5 text-brand-red" />
            Account Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/50">Account Created</span>
              <p className="text-white mt-0.5">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-white/50">Last Updated</span>
              <p className="text-white mt-0.5">
                {profile?.updatedAt
                  ? new Date(profile.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </DashboardLayout>
  );
}

// Icons
function UserIcon({ className }) {
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
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
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

function LockIcon({ className }) {
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
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function InfoIcon({ className }) {
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
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
