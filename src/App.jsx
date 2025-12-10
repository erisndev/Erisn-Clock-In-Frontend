import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WeeklyReport from "./pages/reports/WeeklyReport";
import WeeklyProgressReport from "./pages/reports/WeeklyProgressReport";

function App() {
  return (
    <Router>
      <Routes>
        {/* */}
        <Route path="/" element={<WeeklyReport />} />

        {/* */}
        <Route path="/weekly-report" element={<WeeklyReport />} />
        <Route path="/weekly-progress-report" element={<WeeklyProgressReport />} />
      </Routes>
    </Router>
  );
}

export default App;
