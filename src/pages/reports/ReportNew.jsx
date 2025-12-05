import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function ReportNew() {
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [summary, setSummary] = useState("");
  const [challenges, setChallenges] = useState("");
  const [learnings, setLearnings] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/reports", {
        weekStart,
        weekEnd,
        summary,
        challenges,
        learnings,
        goals,
      });
      navigate("/reports");
    } catch (err) {
      console.error(err);
      alert("Failed to submit report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Weekly Report</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Week Start:</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Week End:</label>
          <input
            type="date"
            value={weekEnd}
            onChange={(e) => setWeekEnd(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Summary of Tasks:</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Challenges Faced:</label>
          <textarea
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Learnings:</label>
          <textarea
            value={learnings}
            onChange={(e) => setLearnings(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Goals for Next Week:</label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
