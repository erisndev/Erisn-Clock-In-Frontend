import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Timer from "../components/Timer";
import BreakTimer from "../components/BreakTimer";
import LiveClock from "../components/LiveClock";
import api from "../services/Api";
import toast from "react-hot-toast";
import { formatTimeSA } from "../utils/time";
import { getDisplayDuration } from "../utils/attendanceDuration";
import logger from "./../utils/logger";

// Breaks are auto-ended server-side based on policy (MAX_BREAK_MINUTES).
// Keep this as a UI hint for the countdown; backend remains the source of truth.
const BREAK_DURATION_MINUTES = 60;
const STATUS_POLL_INTERVAL_MS = 30_000;

export default function Clock() {
  const [status, setStatus] = useState("clocked-out");
  const [startTime, setStartTime] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [breakTaken, setBreakTaken] = useState(false);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasClockedInToday, setHasClockedInToday] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [isMarkedAbsent, setIsMarkedAbsent] = useState(false);
  const [absentMessage, setAbsentMessage] = useState("");
  const [, forceTick] = useState(0);

  // Initialize clock state from backend on page load
  useEffect(() => {
    const initializeClock = async () => {
      try {
        const response = await api.attendance.getStatus();
        const { status: currentStatus, data } = response;

        if (currentStatus === "clocked-out" || !data) {
          setCurrentAttendance(null);
          // User not clocked in right now.
          // Still need to know whether they've already clocked in earlier today.
          setStatus("clocked-out");
          setStartTime(null);
          setBreakStartTime(null);
          setAccumulatedTime(0);
          setBreakTaken(false);

          // Check if there's a clock-in record for today; if yes, disable clock-in.
          try {
            const todayResp = await api.attendance.getToday();
            const todayRecord = todayResp?.data;

            const hasClockIn = Boolean(todayRecord?.clockIn);

            const absentChecks = {
              status:
                String(todayRecord?.status || "").toLowerCase() === "absent",
              attendanceStatus:
                String(todayRecord?.attendanceStatus || "").toLowerCase() ===
                "absent",
              state:
                String(todayRecord?.state || "").toLowerCase() === "absent",
              isAbsent: todayRecord?.isAbsent === true,
              markedAbsent: todayRecord?.markedAbsent === true,
              absent: todayRecord?.absent === true,
              is_absent: todayRecord?.is_absent === true,
              marked_absent: todayRecord?.marked_absent === true,
            };

            const absent = Object.values(absentChecks).some(Boolean);

            const defaultMsg =
              "You were marked absent for today and can no longer clock in. Please contact your administrator.";

            const msg =
              todayRecord?.message ||
              todayRecord?.error ||
              (absent ? defaultMsg : "");

            setHasClockedInToday(hasClockIn || absent);
            setIsMarkedAbsent(absent);
            setAbsentMessage(absent ? msg : "");

            if (hasClockIn && !todayRecord.clockOut) {
              setCurrentAttendance(todayRecord);
              setStatus(
                todayRecord.breakIn && !todayRecord.breakOut
                  ? "on-break"
                  : "clocked-in",
              );
              setStartTime(new Date(todayRecord.clockIn).getTime());
              if (todayRecord.breakIn && !todayRecord.breakOut) {
                setBreakStartTime(new Date(todayRecord.breakIn).getTime());
              }
            }
          } catch {
            // If endpoint isn't available or fails, fall back to allowing clock-in.
            setHasClockedInToday(false);
          }
        } else if (currentStatus === "clocked-in") {
          setHasClockedInToday(true);
          setCurrentAttendance(data);
          // User is working
          setStatus("clocked-in");
          setStartTime(new Date(data.clockIn).getTime());
          setBreakTaken(data.breakTaken || false);
          // Account for any previous break time - use duration from backend
          if (data.duration > 0) {
            // Adjust start time so timer shows correct elapsed time
            const now = Date.now();
            setStartTime(now - data.duration);
          }
        } else if (currentStatus === "on-break") {
          setCurrentAttendance(data);
          // User is on break
          setStatus("on-break");
          setStartTime(new Date(data.clockIn).getTime());
          setBreakStartTime(new Date(data.breakIn).getTime());
          // Store work time before break
          setAccumulatedTime(data.duration || 0);
          setBreakTaken(false); // Will be true after break ends
          setHasClockedInToday(true);
        }
      } catch (error) {
        logger.error("Failed to initialize clock:", error);
        toast.error("Failed to load clock status");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeClock();
  }, []);

  // Make the work timer tick live while session is open AND not currently on break.
  useEffect(() => {
    const isOpen =
      Boolean(currentAttendance?.clockIn) &&
      !currentAttendance?.clockOut &&
      !currentAttendance?.isClosed;

    const isOnBreak =
      Boolean(currentAttendance?.breakIn) && !currentAttendance?.breakOut;

    if (!isOpen || isOnBreak) return;

    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [
    currentAttendance?.clockIn,
    currentAttendance?.clockOut,
    currentAttendance?.isClosed,
    currentAttendance?.breakIn,
    currentAttendance?.breakOut,
  ]);

  useEffect(() => {
    if (status !== "on-break") return;

    const id = setInterval(async () => {
      try {
        const response = await api.attendance.getStatus();
        const { status: currentStatus, data } = response;

        // If backend says break is no longer active, update UI state.
        if (currentStatus === "clocked-in" && data) {
          setCurrentAttendance((prev) => ({ ...(prev || {}), ...data }));
          setStatus("clocked-in");
          setBreakStartTime(null);
          setBreakTaken(true);

          // If backend duration is available, use it to drive timer.
          if (typeof data?.duration === "number" && data.duration > 0) {
            setStartTime(Date.now() - data.duration);
          }

          // Only show auto-end messaging when the backend explicitly indicates it.
          if (data?.breakEndedBySystem) {
            toast.success("Break ended automatically by system.");
          }
        }

        // Also handle if backend returns clocked-out (edge case)
        if (currentStatus === "clocked-out") {
          setCurrentAttendance(null);
          setStatus("clocked-out");
          setStartTime(null);
          setBreakStartTime(null);
          setAccumulatedTime(0);
          setBreakTaken(false);
        }
      } catch {
        // ignore polling failures
      }
    }, STATUS_POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [status]);

  const breakElapsedMinutes = breakStartTime
    ? Math.floor((Date.now() - breakStartTime) / 60000)
    : 0;

  // Don't block the user from ending break based on client-side time.
  // Backend enforces the maximum break duration and may already have auto-ended it.
  const breakLimitReached = false;

  const handleClockIn = async () => {
    if (hasClockedInToday || isMarkedAbsent) return;

    const payload = { notes: note };

    setIsLoading(true);
    try {
      const response = await api.attendance.clockIn(payload);
      const { data } = response;

      setCurrentAttendance(data);
      setStatus("clocked-in");
      setStartTime(new Date(data.clockIn).getTime());
      setAccumulatedTime(0);
      setBreakTaken(false);
      setHasClockedInToday(true);
      setIsMarkedAbsent(false);
      setNote("");

      toast.success("Clocked in successfully");
    } catch (error) {
      const msg = error?.message || "Failed to clock in";

      toast.error(msg);

      // If backend says user already clocked in today, lock the button.
      if (msg.toLowerCase().includes("already clocked in today")) {
        setHasClockedInToday(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    try {
      const response = await api.attendance.clockOut({ notes: note });
      const { data } = response;

      setCurrentAttendance(null);
      setStatus("clocked-out");
      setStartTime(null);
      setBreakStartTime(null);
      setAccumulatedTime(0);
      setBreakTaken(false);
      setNote("");

      toast.success(`Clocked out successfully.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setIsLoading(true);
    try {
      try {
        await api.notifications.enablePush();
      } catch (e) {
        logger.warn("Push enable skipped/failed:", e);
      }

      const response = await api.attendance.breakIn();
      const { data } = response;

      setCurrentAttendance((prev) => ({
        ...(prev || {}),
        ...data,
        duration:
          typeof data?.workTimeBeforeBreak === "number"
            ? data.workTimeBeforeBreak
            : prev?.duration,
        durationFormatted: null,
      }));
      setStatus("on-break");
      setBreakStartTime(new Date(data.breakIn).getTime());
      // Store current work time from backend
      setAccumulatedTime(data.workTimeBeforeBreak || 0);

      toast.success("Break started");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setIsLoading(true);
    try {
      const response = await api.attendance.breakOut();
      const { data } = response;

      setCurrentAttendance((prev) => ({
        ...(prev || {}),
        ...data,
      }));
      setStatus("clocked-in");
      setBreakStartTime(null);
      setBreakTaken(true);

      // Prefer backend duration for timer continuity (handles system auto-end too).
      if (typeof data?.duration === "number" && data.duration >= 0) {
        setStartTime(Date.now() - data.duration);
      } else {
        // Fallback: continue from work time captured at break start.
        setStartTime(Date.now() - accumulatedTime);
      }

      if (data?.breakEndedBySystem) {
        toast.success("Break was already ended by the system.");
      } else {
        toast.success(
          `Break ended. Break duration: ${data.breakDurationFormatted}`,
        );
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
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

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-white/50">
            <Spinner />
            <span>Loading clock status...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Current Time Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8 mb-6"
      >
        <LiveClock showDate={true} />
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 sm:p-8 mb-6"
      >
        {/* Status indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`relative w-4 h-4 rounded-full ${currentStatus.color}`}
            >
              {status !== "clocked-out" && (
                <div
                  className={`absolute inset-0 rounded-full ${currentStatus.color} animate-ping opacity-75`}
                />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {currentStatus.label}
              </h2>
              <p className="text-sm text-white/50">
                {currentStatus.description}
              </p>
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

              {/*
                Bring back the original timer UI, but feed it a startTime that reflects
                the live duration derived from attendance data (same logic as Timesheet).

                We set: effectiveStartTime = now - liveDurationMs
              */}
              {(() => {
                const d = getDisplayDuration(currentAttendance);

                // Always drive the UI from the derived duration.
                // When paused, Timer will display `pausedAt`.
                // When running, Timer will display Date.now() - startTime.
                const durationMs = d?.durationMs || 0;
                const effectiveStartTime = Date.now() - durationMs;

                // Pause work timer while on break.
                if (status === "on-break" || d.isPaused) {
                  return (
                    <Timer
                      startTime={effectiveStartTime}
                      isRunning={false}
                      pausedAt={durationMs}
                    />
                  );
                }

                return (
                  <Timer startTime={effectiveStartTime} isRunning={true} />
                );
              })()}
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
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  Break Time Remaining
                </p>
              </div>
              <BreakTimer
                startTime={breakStartTime}
                breakDuration={BREAK_DURATION_MINUTES}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isMarkedAbsent && (
            <div className="mt-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {absentMessage ||
                "You were marked absent for today and can no longer clock in. Please contact your administrator."}
            </div>
          )}
          <AnimatePresence mode="wait">
            {status === "clocked-out" && (
              <motion.button
                key="clock-in"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleClockIn}
                disabled={isLoading || hasClockedInToday || isMarkedAbsent}
                className={`w-full py-4 rounded-2xl text-white font-semibold text-lg shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  isMarkedAbsent
                    ? "bg-gradient-to-r from-red-600 to-red-700 shadow-red-600/25 hover:shadow-red-600/30"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
                }`}
              >
                <span className="flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <Spinner />
                      Clocking In...
                    </>
                  ) : isMarkedAbsent ? (
                    <>
                      <StopIcon className="w-5 h-5" />
                      Marked Absent
                    </>
                  ) : hasClockedInToday ? (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      Already Clocked In Today
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
                  className="py-4 rounded-2xl text-white font-semibold shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
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
                        End Break
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

            {status === "on-break" && breakLimitReached && (
              <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                Break limit reached ({breakElapsedMinutes}/
                {BREAK_DURATION_MINUTES} min). The system will end your break
                automatically.
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Note Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
          Entry Note (Optional)
        </h3>

        <div className="space-y-4">
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
