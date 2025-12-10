import React, { useState, useEffect } from "react";
import axios from "axios";

const WeeklyReport = () => {
  const [week, setWeek] = useState("");
  const [summary, setSummary] = useState("");
  const [tasks, setTasks] = useState("");
  const [challenges, setChallenges] = useState("");
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      const res = await axios.get("/api/reports/weekly");
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      week,
      summary,
      tasks,
      challenges,
    };

    try {
      await axios.post("/api/reports/weekly", data);
      alert("Weekly report submitted!");
      setWeek("");
      setSummary("");
      setTasks("");
      setChallenges("");
      fetchReports();
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Failed to submit.");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="page-container">
      <h1>Weekly Report</h1>

      <form className="report-form" onSubmit={handleSubmit}>
        <label>Week Number</label>
        <input
          type="text"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          required
        />

        <label>Weekly Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
        />

        <label>Tasks Completed</label>
        <textarea
          value={tasks}
          onChange={(e) => setTasks(e.target.value)}
          required
        />

        <label>Challenges Faced</label>
        <textarea
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
        />

        <button type="submit" className="btn-submit">Submit Report</button>
      </form>

      <hr />

      <h2>Previous Weekly Reports</h2>
      <div className="report-list">
        {reports.length === 0 ? (
          <p>No reports submitted yet.</p>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="report-card">
              <h3>Week {r.week}</h3>
              <p><strong>Summary:</strong> {r.summary}</p>
              <p><strong>Tasks:</strong> {r.tasks}</p>
              <p><strong>Challenges:</strong> {r.challenges}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WeeklyReport;
