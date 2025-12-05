import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Link } from "react-router-dom";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get("/reports")
      .then((res) => setReports(res.data.reports))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Weekly Reports</h1>
        <Link to="/reports/new" className="px-4 py-2 bg-blue-600 text-white rounded">
          New Report
        </Link>
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <Link
            to={`/reports/${r._id}`}
            key={r._id}
            className="block p-4 border rounded hover:bg-gray-100"
          >
            <p className="font-semibold">
              {r.weekStart} → {r.weekEnd}
            </p>
            <p className="text-sm text-gray-600">{r.summary.slice(0, 80)}...</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
