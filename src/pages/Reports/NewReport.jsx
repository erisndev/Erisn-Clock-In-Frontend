"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import FileUpload from "../../components/FileUpload"
import useScrollLock from "../../hooks/useScrollLock"

export default function NewReport() {
  const navigate = useNavigate()
  const [reportType, setReportType] = useState("weekly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState([])
  const [showModal, setShowModal] = useState(false)

  // Lock scroll when modal is open
  useScrollLock(showModal)

  const handleSubmit = (e) => {
    e.preventDefault()

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null")
    const reports = JSON.parse(localStorage.getItem("reports") || "[]")
    const newReport = {
      id: Date.now(),
      type: reportType,
      startDate,
      endDate,
      description,
      files,
      submittedAt: new Date().toISOString(),
      userId: currentUser?.id || null,
      userName: currentUser?.name || "Unknown",
    }

    reports.push(newReport)
    localStorage.setItem("reports", JSON.stringify(reports))

    setShowModal(true)
    setTimeout(() => {
      setShowModal(false)
      navigate("/reports")
    }, 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-3xl mx-auto">
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
          {/* Report Type */}
          <div>
            <label className="block text-white font-semibold mb-3">Report Type</label>
            <div className="grid grid-cols-3 gap-3">
              {["weekly", "monthly", "custom"].map((type) => (
                <motion.button
                  key={type}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setReportType(type)}
                  className={`py-3 rounded-lg font-semibold transition-all ${
                    reportType === type ? "bg-brand-red text-white" : "bg-black text-white/60 border border-white/20"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-semibold mb-2">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe your report..."
              className="w-full bg-black border border-brand-red rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-white font-semibold mb-2">Upload Files</label>
            <FileUpload onFilesChange={setFiles} />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
          >
            Submit Report
          </motion.button>
        </motion.form>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#1A1A1A] border-2 border-brand-red rounded-xl p-8 max-w-md text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-6xl mb-4"
              >
                ✓
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Report Submitted!</h2>
              <p className="text-white/60">Your report has been submitted successfully.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
