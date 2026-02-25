import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import logger from "./utils/logger";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // Non-fatal: app should still work without SW; push just won't.
      logger.warn("Service worker registration failed:", err);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
