import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WeeklyReport from "./pages/reports/WeeklyReport";
import WeeklyProgressReport from "./pages/reports/WeeklyProgressReport";

function App() {
  return (
    <Router>
      <Routes>
        {/* 👇 THIS IS YOUR HOME ROUTE */}
        <Route path="/" element={<WeeklyReport />} />

        {/* Your other pages */}
        <Route path="/weekly-report" element={<WeeklyReport />} />
        <Route path="/weekly-progress-report" element={<WeeklyProgressReport />} />
      </Routes>
    </Router>
  );
}

export default App;
