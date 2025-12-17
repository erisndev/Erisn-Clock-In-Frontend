import { useState, useEffect } from "react";

export default function LiveClock({ showDate = true, size = "large", className = "" }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const sizeClasses = {
    small: "text-xl sm:text-2xl",
    medium: "text-2xl sm:text-3xl",
    large: "text-4xl sm:text-5xl",
  };

  return (
    <div className={`${className}`}>
      <div className={`${sizeClasses[size]} font-bold text-white tracking-tight font-mono`}>
        {formatTime(time)}
      </div>
      {showDate && (
        <div className="text-sm text-white/50 mt-1">
          {formatDate(time)}
        </div>
      )}
    </div>
  );
}
