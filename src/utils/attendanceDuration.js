// Live duration display (Option A):
// - Closed sessions: trust backend duration/durationFormatted
// - Open sessions: compute live now - clockIn - breakDuration

export function formatHMS(ms) {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function getDisplayDuration(att) {
  const isClosed = Boolean(att?.clockOut) || Boolean(att?.isClosed);

  // If it is closed, trust backend
  if (isClosed) {
    const durationMs = typeof att?.duration === "number" ? att.duration : 0;
    return {
      durationMs,
      durationLabel: att?.durationFormatted || formatHMS(durationMs),
      source: "backend",
      isPaused: false,
    };
  }

  // If it is open, compute live
  if (!att?.clockIn) {
    return {
      durationMs: 0,
      durationLabel: formatHMS(0),
      source: "live",
      isPaused: false,
    };
  }

  // If user is currently on break, pause work duration at the last known value.
  // Backend typically provides `duration` as "work time so far" excluding breaks.
  const isOnBreak = Boolean(att?.breakIn) && !att?.breakOut;
  if (isOnBreak) {
    const durationMs = typeof att?.duration === "number" ? att.duration : 0;
    return {
      durationMs,
      durationLabel: formatHMS(durationMs),
      source: "backend",
      isPaused: true,
    };
  }

  const nowMs = Date.now();
  const clockInMs = new Date(att.clockIn).getTime();
  const breaksMs = typeof att?.breakDuration === "number" ? att.breakDuration : 0;

  const liveMs = Number.isNaN(clockInMs)
    ? 0
    : Math.max(0, nowMs - clockInMs - breaksMs);

  return {
    durationMs: liveMs,
    durationLabel: formatHMS(liveMs),
    source: "live",
    isPaused: false,
  };
}
