import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import { seedDemoData, resetDemoData } from "./utils/seedDemoData"

// Force seed demo data (will reseed if no graduates exist)
seedDemoData(true)

// Log instructions
console.log("🚀 ClockIn Demo App")
console.log("   To reset demo data, run: resetDemoData()")
console.log("   To clear all data, run: clearAllData()")

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
