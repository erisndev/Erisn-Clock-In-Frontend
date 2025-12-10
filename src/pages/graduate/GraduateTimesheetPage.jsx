import { motion } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Timesheet from "../Timesheet";

export default function GraduateTimesheetPage() {
  return (
    <DashboardLayout role="graduate">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="page-title">Timesheet</h1>
          <p className="page-subtitle mt-1">
            View and filter your complete clock-in history
          </p>
        </div>
        <Timesheet />
      </motion.div>
    </DashboardLayout>
  );
}
