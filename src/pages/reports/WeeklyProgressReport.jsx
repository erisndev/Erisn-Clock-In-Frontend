import React, { useEffect, useState } from "react";
import axios from "axios";

const WeeklyProgressReport = () => {
  const [day, setDay] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [percentage, setPercentage] = useState("");
  const [challenges, setChallenges] = useState("");
  const [progressReports, setProgressReports] = useState([]);

  const fetchProgress = async () => {
    try {
      const res = await axios.get("/api/reports/progress");
      setProgressReports(res.data);
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const submitProgress = async (e) => {
    e.preventDefault();

    const body = {
      day,
      workDone,
      percentage,
      challenges,
    };

    try {
      await axios.post("/api/reports/progress", body);
      alert("Progress submitted!");
      setDay("");
      setWorkDone("");
      setPercentage("");
      setChallenges("");
      fetchProgress();
    } catch (err) {
      alert("Failed to submit progress.");
      console.log(err);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return (
    <div className="page-container">
      <h1>Weekly Progress Report</h1>

      <form className="report-form" onSubmit={submitProgress}>
        <label>Day</label>
        <select value={day} onChange={(e) => setDay(e.target.value)} required>
          <option value="">Select Day</option>
          <option>Monday</option>
          <option>Tuesday</option>
          <option>Wednesday</option>
          <option>Thursday</option>
          <option>Friday</option>
        </select>

        <label>Work Completed</label>
        <textarea
          value={workDone}
          onChange={(e) => setWorkDone(e.target.value)}
          required
        />

        <label>Progress %</label>
        <input
          type="number"
          min="0"
          max="100"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          required
        />

        <label>Challenges</label>
        <textarea
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
        />

        <button type="submit" className="btn-submit">
          Submit Progress
        </button>
      </form>

      <hr />

      <h2>Submitted Progress</h2>
      <div className="report-list">
        {progressReports.length === 0 ? (
          <p>No progress submitted yet.</p>
        ) : (
          progressReports.map((p) => (
            <div className="report-card" key={p.id}>
              <h3>{p.day}</h3>
              <p><strong>Work Done:</strong> {p.workDone}</p>
              <p><strong>Progress:</strong> {p.percentage}%</p>
              <p><strong>Challenges:</strong> {p.challenges}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WeeklyProgressReport;
