const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ==================== TOKEN MANAGEMENT ====================

let authToken = null;

export const setToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

export const getToken = () => {
  if (!authToken) {
    authToken = localStorage.getItem("token");
  }
  return authToken;
};

export const clearToken = () => {
  authToken = null;
  localStorage.removeItem("token");
};

// helper used throughout the file to detect authorization failures
// Only treat 401 (Unauthorized) as auto-redirect worthy
// 403 (Forbidden) can be contextual (e.g., email not verified during login) and should be handled by components
export const isAuthError = (error) => {
  if (!error) return false;
  const status =
    error.status || (error.response && error.response.status) || null;
  return status === 401;
};

// simple redirect helper used when authentication has failed
export const redirectToLogin = () => {
  // use full navigation so that React router resets state
  window.location.href = "/login";
};

// ==================== HTTP CLIENT ====================

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      if (!response.ok) {
        // Preserve status on non-JSON responses too
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response;
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || data.error || "Request failed");
      error.status = response.status;
      error.data = data;

      // Global auth failure handling
      if (isAuthError(error)) {
        clearToken();
        redirectToLogin();
      }

      throw error;
    }

    return data;
  } catch (error) {
    // If backend throws auth error via fetch wrapper, handle it here too.
    if (isAuthError(error)) {
      clearToken();
      redirectToLogin();
    }

    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection.");
    }
    throw error;
  }
};

// ==================== WEB PUSH HELPERS ====================

export const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export const fetchVapidPublicKey = async () => {
  const res = await request("/notifications/vapid-public-key", {
    method: "GET",
  });
  // backend returns: { ok: true, publicKey }
  return res.publicKey;
};

export const registerServiceWorker = async (swPath = "/sw.js") => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker is not supported in this browser.");
  }
  return navigator.serviceWorker.register(swPath);
};

export const ensureNotificationPermission = async () => {
  if (!("Notification" in window)) {
    throw new Error("Notifications are not supported in this browser.");
  }

  if (Notification.permission === "granted") return "granted";
  const permission = await Notification.requestPermission();
  return permission;
};

export const enablePush = async ({ swPath = "/sw.js" } = {}) => {
  const permission = await ensureNotificationPermission();
  if (permission !== "granted") {
    throw new Error("Push permission not granted.");
  }

  const registration = await registerServiceWorker(swPath);

  const publicKey = await fetchVapidPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  // Reuse subscription if it already exists
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }));

  await request("/notifications/subscribe", {
    method: "POST",
    body: subscription,
  });

  return { subscription, permission };
};

// ==================== AUTH API ====================

export const auth = {
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  verifyOtp: (data) =>
    request("/auth/verify-email-otp", { method: "POST", body: data }),
  resendOtp: (data) =>
    request("/auth/resend-otp", { method: "POST", body: data }),
  login: async (data) => {
    const response = await request("/auth/login", {
      method: "POST",
      body: data,
    });
    if (response.token) setToken(response.token);
    return response;
  },
  logout: async () => {
    const response = await request("/auth/logout", { method: "GET" });
    clearToken();
    return response;
  },
  forgotPassword: (data) =>
    request("/auth/forgot-password", { method: "POST", body: data }),
  resetPassword: (token, data) =>
    request(`/auth/reset-password/${token}`, { method: "POST", body: data }),
};

// ==================== USER API ====================

export const user = {
  getProfile: () => request("/users/profile", { method: "GET" }),
  updateProfile: (data) =>
    request("/users/profile", { method: "PUT", body: data }),
  deleteAccount: () => request("/users/profile", { method: "DELETE" }),
  getPreferences: () => request("/users/preferences", { method: "GET" }),
  updatePreferences: (data) =>
    request("/users/preferences", { method: "PUT", body: data }),
};

// ==================== ATTENDANCE API ====================

export const attendance = {
  getStatus: () => request("/attendance/status", { method: "GET" }),
  getToday: () => request("/attendance/today", { method: "GET" }),
  clockIn: (data = {}) =>
    request("/attendance/clock-in", { method: "POST", body: data }),
  clockOut: (data = {}) =>
    request("/attendance/clock-out", { method: "POST", body: data }),
  breakIn: () => request("/attendance/break-in", { method: "POST", body: {} }),
  breakOut: () =>
    request("/attendance/break-out", { method: "POST", body: {} }),
  getHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/history${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/all${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/summary${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  exportMy: async (params) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/attendance/export/my?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response;
  },
  exportMonthly: async (params) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/attendance/export?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response;
  },
  exportAllZip: async (params) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/attendance/export-zip?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response;
  },

  exportUser: async (userId, params) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      `${BASE_URL}/attendance/export/${userId}?${query}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response;
  },
};

// ==================== REPORTS API ====================

export const reports = {
  submit: (data) => request("/reports", { method: "POST", body: data }),
  update: (id, data) =>
    request(`/reports/${id}`, { method: "PUT", body: data }),
  getMyReports: () => request("/reports", { method: "GET" }),
  getById: (id) => request(`/reports/${id}`, { method: "GET" }),
  exportMyReports: (type) =>
    request(`/reports/export/data?type=${type}`, { method: "GET" }),
};

// ==================== NOTIFICATIONS API ====================

export const notifications = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notifications${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  getUnreadCount: () =>
    request("/notifications/unread-count", { method: "GET" }),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: () =>
    request("/notifications/mark-all-read", { method: "PATCH" }),

  // Delete all notifications for logged-in user
  deleteAll: () => request("/notifications/delete-all", { method: "DELETE" }),

  subscribePush: (subscription) =>
    request("/notifications/subscribe", {
      method: "POST",
      body: subscription,
    }),

  getVapidPublicKey: () =>
    request("/notifications/vapid-public-key", { method: "GET" }),

  /**
   * One-call helper to fully enable push:
   * - requests browser permission
   * - registers service worker
   * - subscribes and sends subscription to backend
   */
  enablePush: (opts) => enablePush(opts),

  testSend: (data) =>
    request("/notifications/test", { method: "POST", body: data }),
  demoPush: (data = {}) =>
    request("/notifications/demo-push", { method: "POST", body: data }),
};

// ==================== ADMIN API ====================

export const admin = {
  getReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/reports${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  exportReports: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/reports/export?${query}`, { method: "GET" });
  },
  approveReport: (id, data = {}) =>
    request(`/admin/reports/${id}/approve`, { method: "POST", body: data }),
  rejectReport: (id, data) =>
    request(`/admin/reports/${id}/reject`, { method: "POST", body: data }),
  markReportReviewed: (id, data = {}) =>
    request(`/admin/reports/${id}/review`, { method: "POST", body: data }),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  getGraduates: () => request("/users/graduates", { method: "GET" }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
};

// ==================== HEALTH API ====================

export const health = {
  check: () => request("/health", { method: "GET" }),
  ready: () => request("/ready", { method: "GET" }),
};

// ==================== DEFAULT EXPORT ====================

const api = {
  auth,
  user,
  attendance,
  reports,
  notifications,
  admin,
  health,
  setToken,
  getToken,
  clearToken,

  // push helpers also exposed at top-level for convenience
  urlBase64ToUint8Array,
  fetchVapidPublicKey,
  registerServiceWorker,
  ensureNotificationPermission,
  enablePush,

  // expose helpers for external use/debugging/testing
  isAuthError,
  redirectToLogin,
};

export default api;
