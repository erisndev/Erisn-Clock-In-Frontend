import { useState, useEffect } from "react";

export default function BreakTimer({ startTime, breakDuration = 90 }) {
  const [remaining, setRemaining] = useState(breakDuration * 60 * 1000); // Convert minutes to ms

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const breakDurationMs = breakDuration * 60 * 1000;
      const remainingMs = Math.max(0, breakDurationMs - elapsed);
      setRemaining(remainingMs);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, breakDuration]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const formatNumber = (num) => String(num).padStart(2, "0");

  const isOvertime = remaining === 0;

  return (
    <div className="text-center">
      <div className={`inline-flex items-baseline gap-1 font-mono ${isOvertime ? 'animate-pulse' : ''}`}>
        <TimeUnit 
          value={formatNumber(minutes)} 
          label="min" 
          isOvertime={isOvertime}
        />
        <span className={`text-3xl sm:text-4xl font-light ${isOvertime ? 'text-red-400' : 'text-white/30'}`}>:</span>
        <TimeUnit 
          value={formatNumber(seconds)} 
          label="sec" 
          isOvertime={isOvertime}
        />
      </div>
      {isOvertime && (
        <p className="text-xs text-red-400 mt-3 animate-pulse">Break time exceeded!</p>
      )}
    </div>
  );
}

function TimeUnit({ value, label, isOvertime }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight tabular-nums ${
        isOvertime ? 'text-red-400' : 'text-amber-400'
      }`}>
        {value}
      </span>
      <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}
