import { motion } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Clock from "../Clock";

export default function GraduateClockPage() {
  return (
    <DashboardLayout role="graduate">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="page-title">Clock In</h1>
          <p className="page-subtitle mt-1">
            Track your working hours with a single click
          </p>
        </div>
        <Clock />
      </motion.div>
    </DashboardLayout>
  );
}
