// Centralized time formatting helpers.
// Backend timestamps are UTC ISO strings. We always render them in South Africa time.

export const SA_TZ = "Africa/Johannesburg";

export function formatDateTimeSA(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: SA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatTimeSA(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: SA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatDateSA(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: SA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function msToHours(ms) {
  return ms / (1000 * 60 * 60);
}

export function msToHoursRounded(ms, decimals = 1) {
  const h = msToHours(ms);
  const p = Math.pow(10, decimals);
  return Math.round(h * p) / p;
}
