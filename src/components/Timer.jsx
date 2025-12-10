import { useState, useEffect } from "react";

export default function Timer({ startTime, isRunning, pausedAt = null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // If paused, show the paused time
    if (pausedAt !== null) {
      setElapsed(pausedAt);
      return;
    }

    // If not running, don't update
    if (!startTime || !isRunning) return;

    // Update elapsed time every second
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isRunning, pausedAt]);

  useEffect(() => {
    // Initialize elapsed time when startTime changes
    if (startTime && pausedAt === null) {
      setElapsed(Date.now() - startTime);
    }
  }, [startTime, pausedAt]);

  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  const formatNumber = (num) => String(num).padStart(2, "0");

  return (
    <div className="text-center">
      <div className="inline-flex items-baseline gap-1 font-mono">
        <TimeUnit value={formatNumber(hours)} label="hrs" />
        <span className="text-3xl sm:text-4xl text-white/30 font-light">:</span>
        <TimeUnit value={formatNumber(minutes)} label="min" />
        <span className="text-3xl sm:text-4xl text-white/30 font-light">:</span>
        <TimeUnit value={formatNumber(seconds)} label="sec" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight tabular-nums">
        {value}
      </span>
      <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}
