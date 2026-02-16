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
  // NOTE: Some backends return an incorrect `duration` while on-break.
  // If we don't have a reliable "workTimeBeforeBreak" from the backend, compute it
  // as (breakIn - clockIn - breakDurationBeforeBreak).
  const isOnBreak = Boolean(att?.breakIn) && !att?.breakOut;
  if (isOnBreak) {
    const backendPausedMs =
      typeof att?.workTimeBeforeBreak === "number"
        ? att.workTimeBeforeBreak
        : typeof att?.duration === "number"
          ? att.duration
          : null;

    const clockInMs = att?.clockIn ? new Date(att.clockIn).getTime() : NaN;
    const breakInMs = att?.breakIn ? new Date(att.breakIn).getTime() : NaN;

    // If backend exposes a cumulative breakDuration, it may already include the current break.
    // For the paused work-time-at-break-start, we want break time *before* this break.
    // If total breakDuration looks larger than time since break started, subtract it.
    let breakBeforeMs = typeof att?.breakDuration === "number" ? att.breakDuration : 0;
    if (!Number.isNaN(breakInMs) && typeof att?.breakDuration === "number") {
      const sinceBreakStart = Math.max(0, Date.now() - breakInMs);
      // Heuristic: if breakDuration includes the current break, it will be >= sinceBreakStart.
      if (att.breakDuration >= sinceBreakStart) {
        breakBeforeMs = Math.max(0, att.breakDuration - sinceBreakStart);
      }
    }

    const computedPausedMs =
      Number.isNaN(clockInMs) || Number.isNaN(breakInMs)
        ? 0
        : Math.max(0, breakInMs - clockInMs - breakBeforeMs);

    // Use backend value only if plausible.
    const durationMs =
      backendPausedMs === null
        ? computedPausedMs
        : Math.abs(backendPausedMs - computedPausedMs) <= 5 * 60 * 1000
          ? backendPausedMs
          : computedPausedMs;

    return {
      durationMs,
      durationLabel: formatHMS(durationMs),
      source: "live",
      isPaused: true,
    };
  }

  const nowMs = Date.now();

  // Some APIs return `duration` as cumulative milliseconds since epoch (bad data) or
  // in a different unit. To avoid showing absurd values (e.g. 16h when you worked ~1h),
  // compute live from timestamps, but use backend duration if it's plausible.
  const clockInMs = new Date(att.clockIn).getTime();
  const breaksMs = typeof att?.breakDuration === "number" ? att.breakDuration : 0;

  const computedLiveMs = Number.isNaN(clockInMs)
    ? 0
    : Math.max(0, nowMs - clockInMs - breaksMs);

  const backendDurationMs = typeof att?.duration === "number" ? att.duration : null;

  // Accept backend duration only if it's within +/- 5 minutes of computed live.
  // Otherwise, trust computed live.
  const driftMs =
    backendDurationMs === null ? Infinity : Math.abs(backendDurationMs - computedLiveMs);
  const durationMs = driftMs <= 5 * 60 * 1000 ? backendDurationMs : computedLiveMs;

  return {
    durationMs,
    durationLabel: formatHMS(durationMs),
    source: "live",
    isPaused: false,
  };
}
