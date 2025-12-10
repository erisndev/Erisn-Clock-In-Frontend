import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Timer from "../components/Timer";
import BreakTimer from "../components/BreakTimer";

export default function Clock() {
  const [status, setStatus] = useState("clocked-out");
  const [startTime, setStartTime] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [breakTaken, setBreakTaken] = useState(false);
  const [note, setNote] = useState("");
  const [image, setImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedStatus = localStorage.getItem("clockStatus");
    const savedStartTime = localStorage.getItem("clockStartTime");
    const savedBreakStartTime = localStorage.getItem("breakStartTime");
    const savedAccumulatedTime = localStorage.getItem("accumulatedTime");
    const savedBreakTaken = localStorage.getItem("breakTaken") === "true";
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    
    if (savedStatus) setStatus(savedStatus);
    if (savedStartTime) setStartTime(Number.parseInt(savedStartTime));
    if (savedBreakStartTime) setBreakStartTime(Number.parseInt(savedBreakStartTime));
    if (savedAccumulatedTime) setAccumulatedTime(Number.parseInt(savedAccumulatedTime));
    setBreakTaken(savedBreakTaken);
    setCurrentUser(user);
  }, []);

  const handleClockIn = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const now = Date.now();
    setStatus("clocked-in");
    setStartTime(now);
    setAccumulatedTime(0);
    setBreakTaken(false);
    localStorage.setItem("clockStatus", "clocked-in");
    localStorage.setItem("clockStartTime", now);
    localStorage.setItem("accumulatedTime", "0");
    localStorage.setItem("breakTaken", "false");

    const timesheet = JSON.parse(localStorage.getItem("timesheet") || "[]");
    timesheet.push({
      id: Date.now(),
      date: new Date().toISOString(),
      clockIn: now,
      note,
      image,
      userId: currentUser?.id || null,
      userName: currentUser?.name || "Unknown",
    });
    localStorage.setItem("timesheet", JSON.stringify(timesheet));
    
    setIsLoading(false);
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const timesheet = JSON.parse(localStorage.getItem("timesheet") || "[]");
    const currentUserId = currentUser?.id;
    
    const lastEntryIndex = timesheet.findLastIndex(
      (entry) => entry.userId === currentUserId && !entry.clockOut
    );
    
    if (lastEntryIndex !== -1) {
      timesheet[lastEntryIndex].clockOut = Date.now();
      localStorage.setItem("timesheet", JSON.stringify(timesheet));
    }

    setStatus("clocked-out");
    setStartTime(null);
    setBreakStartTime(null);
    setAccumulatedTime(0);
    setBreakTaken(false);
    localStorage.setItem("clockStatus", "clocked-out");
    localStorage.removeItem("clockStartTime");
    localStorage.removeItem("breakStartTime");
    localStorage.removeItem("accumulatedTime");
    localStorage.removeItem("breakTaken");
    setNote("");
    setImage(null);
    
    setIsLoading(false);
  };

  const handleStartBreak = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const now = Date.now();
    const timeWorked = now - startTime;
    setAccumulatedTime(timeWorked);
    setStatus("on-break");
    setBreakStartTime(now);
    setBreakTaken(true);
    localStorage.setItem("clockStatus", "on-break");
    localStorage.setItem("breakStartTime", now);
    localStorage.setItem("accumulatedTime", timeWorked.toString());
    localStorage.setItem("breakTaken", "true");
    
    setIsLoading(false);
  };

  const handleEndBreak = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const now = Date.now();
    const adjustedStartTime = now - accumulatedTime;
    setStartTime(adjustedStartTime);
    setStatus("clocked-in");
    setBreakStartTime(null);
    localStorage.setItem("clockStatus", "clocked-in");
    localStorage.setItem("clockStartTime", adjustedStartTime.toString());
    localStorage.removeItem("breakStartTime");
    
    setIsLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const statusConfig = {
    "clocked-out": {
      color: "bg-white/20",
      ringColor: "ring-white/20",
      label: "Clocked Out",
      description: "You're currently not on the clock",
    },
    "clocked-in": {
      color: "bg-emerald-500",
      ringColor: "ring-emerald-500/30",
      label: "Clocked In",
      description: "You're currently working",
    },
    "on-break": {
      color: "bg-amber-500",
      ringColor: "ring-amber-500/30",
      label: "On Break",
      description: "Enjoy your break!",
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8 mb-6"
      >
        {/* Status indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`relative w-4 h-4 rounded-full ${currentStatus.color}`}>
              <div className={`absolute inset-0 rounded-full ${currentStatus.color} animate-ping opacity-75`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{currentStatus.label}</h2>
              <p className="text-sm text-white/50">{currentStatus.description}</p>
            </div>
          </div>
        </div>

        {/* Work Timer - Show when clocked in or on break */}
        <AnimatePresence mode="wait">
          {(status === "clocked-in" || status === "on-break") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8"
            >
              <div className="text-center mb-2">
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  Work Time {status === "on-break" && "(Paused)"}
                </p>
              </div>
              {status === "on-break" ? (
                <Timer startTime={startTime} isRunning={false} pausedAt={accumulatedTime} />
              ) : (
                <Timer startTime={startTime} isRunning={true} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Break Timer - Show when on break */}
        <AnimatePresence mode="wait">
          {status === "on-break" && breakStartTime && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 pt-6 border-t border-white/10"
            >
              <div className="text-center mb-2">
                <p className="text-xs text-white/40 uppercase tracking-wider">Break Time Remaining</p>
              </div>
              <BreakTimer startTime={breakStartTime} breakDuration={90} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {status === "clocked-out" && (
              <motion.button
                key="clock-in"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleClockIn}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <Spinner />
                      Clocking In...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      Clock In
                    </>
                  )}
                </span>
              </motion.button>
            )}

            {status === "clocked-in" && (
              <motion.div
                key="clocked-in-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-3"
              >
                <button
                  onClick={handleClockOut}
                  disabled={isLoading}
                  className="py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Spinner />
                        <span className="text-sm">Clocking Out...</span>
                      </>
                    ) : (
                      <>
                        <StopIcon className="w-5 h-5" />
                        Clock Out
                      </>
                    )}
                  </span>
                </button>
                <button
                  onClick={handleStartBreak}
                  disabled={breakTaken || isLoading}
                  className={`py-4 rounded-2xl text-white font-semibold transition-all duration-200 ${
                    breakTaken || isLoading
                      ? "bg-white/5 border border-white/10 opacity-50 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98]"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading && !breakTaken ? (
                      <>
                        <Spinner />
                        <span className="text-sm">Starting...</span>
                      </>
                    ) : (
                      <>
                        <PauseIcon className="w-5 h-5" />
                        {breakTaken ? "Break Used" : "Break In"}
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            )}

            {status === "on-break" && (
              <motion.div
                key="on-break-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-3"
              >
                <button
                  onClick={handleEndBreak}
                  disabled={isLoading}
                  className="py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Spinner />
                        <span className="text-sm">Resuming...</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-5 h-5" />
                        Break Out
                      </>
                    )}
                  </span>
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={isLoading}
                  className="py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Spinner />
                        <span className="text-sm">Clocking Out...</span>
                      </>
                    ) : (
                      <>
                        <StopIcon className="w-5 h-5" />
                        Clock Out
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Note & Image Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
          Entry Details (Optional)
        </h3>

        <div className="space-y-4">
          {/* Note */}
          <div>
            <label className="input-label">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for this entry..."
              className="input-field"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="input-label">Attachment</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center gap-3 py-4 px-4 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-200">
                <UploadIcon className="w-5 h-5 text-white/40" />
                <span className="text-sm text-white/50">
                  {image ? "Change image" : "Upload an image"}
                </span>
              </div>
            </div>
            {image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 relative inline-block"
              >
                <img
                  src={image}
                  alt="Preview"
                  className="max-w-[200px] rounded-xl border border-white/10"
                />
                <button
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Spinner Component
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Icons
function PlayIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}

function PauseIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
