import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/Api";
import toast from "react-hot-toast";

export default function NewReport() {
  const navigate = useNavigate();
  const { id: reportId } = useParams();
  const isEditMode = !!reportId;

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
  const [fetchingDraft, setFetchingDraft] = useState(isEditMode);

  // Load existing draft report when in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const loadDraft = async () => {
      setFetchingDraft(true);
      try {
        const response = await api.reports.getById(reportId);
        const report = response?.data || response;

        if (report.status !== "Draft") {
          toast.error("Only draft reports can be edited");
          navigate("/reports");
          return;
        }

        // Format dates for input[type="date"] (YYYY-MM-DD)
        const weekStart = report.weekStart
          ? new Date(report.weekStart).toISOString().split("T")[0]
          : "";
        const weekEnd = report.weekEnd
          ? new Date(report.weekEnd).toISOString().split("T")[0]
          : "";

        setFormData({
          weekStart,
          weekEnd,
          summary: report.summary || "",
          challenges: report.challenges || "",
          learnings: report.learnings || "",
          nextWeek: report.nextWeek || "",
          goals: report.goals || "",
          status: report.status || "Draft",
        });
      } catch (error) {
        toast.error(error.message || "Failed to load draft report");
        navigate("/reports");
      } finally {
        setFetchingDraft(false);
      }
    };

    loadDraft();
  }, [reportId, isEditMode, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = { ...formData, status: "Submitted" };

      if (isEditMode) {
        await api.reports.update(reportId, submitData);
      } else {
        await api.reports.submit(submitData);
      }

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
      if (isEditMode) {
        await api.reports.update(reportId, draftData);
      } else {
        await api.reports.submit(draftData);
      }

      toast.success("Draft saved successfully");
      navigate("/reports");
    } catch (error) {
      toast.error(error.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingDraft) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1A1A1A] rounded-xl p-8 shadow-2xl border border-white/10 space-y-6">
            {/* Skeleton loader */}
            <div className="h-8 w-48 rounded bg-white/[0.06] animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-12 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-12 rounded bg-white/[0.06] animate-pulse" />
            </div>
            <div className="h-24 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-20 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-20 rounded bg-white/[0.06] animate-pulse" />
            <div className="flex gap-4">
              <div className="flex-1 h-14 rounded-xl bg-white/[0.06] animate-pulse" />
              <div className="flex-1 h-14 rounded-xl bg-white/[0.06] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          {isEditMode ? "Edit Draft Report" : "Submit New Report"}
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
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-red hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
}
