import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ReportCard from "../../components/ReportCard";

export default function ReportsList() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const storedReports = JSON.parse(localStorage.getItem("reports") || "[]");
    setReports(storedReports);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold text-white"
          >
            My Reports
          </motion.h1>
          <Link to="/reports/new">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
            >
              + New Report
            </motion.button>
          </Link>
        </div>

        {reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-white/60 text-xl mb-6">
              No reports submitted yet
            </p>
            <Link to="/reports/new">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
              >
                Submit Your First Report
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ReportCard report={report} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
