import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import toast from "react-hot-toast";

export default function NewReport() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    weekStart: "",
    weekEnd: "",
    summary: "",
    challenges: "",
    learnings: "",
    nextWeek: "",
    goals: "",
    status: "Submitted",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.reports.submit(formData);
      toast.success("Report submitted successfully");
      navigate("/reports");
    } catch (error) {
      toast.error(error.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    const draftData = { ...formData, status: "Draft" };
    setLoading(true);
    try {
      await api.reports.submit(draftData);
      toast.success("Draft saved successfully");
      navigate("/reports");
    } catch (error) {
      toast.error(error.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg border border-white/10"
          >
            ← Back
          </button>
        </div>
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-bold text-white mb-8"
        >
          Submit New Report
        </motion.h1>

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onSubmit={handleSubmit}
          className="bg-[#1A1A1A] rounded-xl p-8 shadow-2xl border border-white/10 space-y-6"
        >
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                Week Start
              </label>
              <input
                type="date"
                name="weekStart"
                value={formData.weekStart}
                onChange={handleChange}
                required
                className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                Week End
              </label>
              <input
                type="date"
                name="weekEnd"
                value={formData.weekEnd}
                onChange={handleChange}
                required
                className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Summary *
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              required
              rows={4}
              placeholder="What did you accomplish this week?"
              className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
            />
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Challenges
            </label>
            <textarea
              name="challenges"
              value={formData.challenges}
              onChange={handleChange}
              rows={3}
              placeholder="What challenges did you face?"
              className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
            />
          </div>

          {/* Learnings */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Learnings
            </label>
            <textarea
              name="learnings"
              value={formData.learnings}
              onChange={handleChange}
              rows={3}
              placeholder="What did you learn?"
              className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
            />
          </div>

          {/* Next Week */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Goals for Next Week
            </label>
            <textarea
              name="nextWeek"
              value={formData.nextWeek}
              onChange={handleChange}
              rows={3}
              placeholder="What do you plan to accomplish next week?"
              className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
            />
          </div>

          {/* Goals */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Action Items / Targets
            </label>
            <textarea
              name="goals"
              value={formData.goals}
              onChange={handleChange}
              rows={3}
              placeholder="Specific targets or action items"
              className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-red hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all"
            >
              Submit Report
            </button>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
}
