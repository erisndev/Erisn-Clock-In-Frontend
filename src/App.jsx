import { Route, Routes } from "react-router-dom";
import "./App.css";
import WeeklyReportPage from "./pages/WeeklyReportPage";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/reports" element={<WeeklyReportPage />} />
    </Routes>
  );
}

export default App;
