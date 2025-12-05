import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get(`/reports/${id}`)
      .then((res) => setReport(res.data.report))
      .catch((err) => console.error(err));
  }, [id]);

  if (!report) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Weekly Report Details</h1>

      <div className="space-y-4">
        <p><strong>Week:</strong> {report.weekStart} → {report.weekEnd}</p>
        <p><strong>Summary:</strong> {report.summary}</p>
        <p><strong>Challenges:</strong> {report.challenges}</p>
        <p><strong>Learnings:</strong> {report.learnings}</p>
        <p><strong>Goals:</strong> {report.goals}</p>
      </div>
    </div>
  );
}
