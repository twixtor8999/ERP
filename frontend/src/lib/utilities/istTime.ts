import { useState, useEffect } from "react";

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Returns the current date formatted as YYYY-MM-DD in Indian Standard Time (Asia/Kolkata).
 */
export function getIstDateString(d: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: IST_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d); // en-CA produces YYYY-MM-DD
  } catch {
    // Fallback if Intl fails
    const offset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + offset);
    return ist.toISOString().slice(0, 10);
  }
}

/**
 * Returns the current time formatted as hh:mm a (e.g. "12:05 pm") in Indian Standard Time (Asia/Kolkata).
 */
export function getIstTimeString(d: Date = new Date()): string {
  try {
    return d
      .toLocaleTimeString("en-US", {
        timeZone: IST_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  } catch {
    return d
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  }
}

/**
 * Returns date formatted as DD-MM-YYYY in Indian Standard Time (e.g. "23-11-2026").
 */
export function getIstDisplayDate(d: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: IST_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(d);

    const day = parts.find((p) => p.type === "day")?.value || "23";
    const month = parts.find((p) => p.type === "month")?.value || "11";
    const year = parts.find((p) => p.type === "year")?.value || "2026";
    return `${day}-${month}-${year}`;
  } catch {
    return "23-11-2026";
  }
}

/**
 * React hook that returns dynamic, real-time Indian Standard Time (IST)
 * automatically updating every second.
 */
export function useIstLiveClock(intervalMs: number = 15000) {
  const [clock, setClock] = useState(() => ({
    time: getIstTimeString(),
    dateStr: getIstDateString(),
    displayDate: getIstDisplayDate(),
  }));

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nextTime = getIstTimeString(now);
      const nextDateStr = getIstDateString(now);
      const nextDisplayDate = getIstDisplayDate(now);
      setClock((prev) =>
        prev.time === nextTime && prev.dateStr === nextDateStr && prev.displayDate === nextDisplayDate
          ? prev
          : { time: nextTime, dateStr: nextDateStr, displayDate: nextDisplayDate }
      );
    };

    const interval = setInterval(tick, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return clock;
}

/**
 * Normalize common ERP date representations ("YYYY-MM-DD", "DD-MM-YYYY",
 * "DD/MM/YYYY", ISO timestamps, or "DD-MM-YYYY hh:mm am") into "YYYY-MM-DD".
 * Returns "" when no valid calendar date is present.
 */
export function normalizeDateToIso(raw?: string | null): string {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  const isoMatch = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const dmyMatch = trimmed.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch && dmyMatch[1] && dmyMatch[2] && dmyMatch[3]) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return "";
}

/**
 * Strictly evaluate whether rawDate falls within [fromDate, toDate].
 * - Normalizes both the candidate date and range bounds to "YYYY-MM-DD".
 * - Rejects records with missing/unparseable dates whenever a range bound is active.
 * - Rejects all records when an inverted range (fromIso > toIso) is supplied.
 */
export function isDateInRange(
  rawDate?: string | null,
  fromDate?: string | null,
  toDate?: string | null
): boolean {
  const fromIso = normalizeDateToIso(fromDate);
  const toIso = normalizeDateToIso(toDate);

  if (!fromIso && !toIso) return true;
  if (fromIso && toIso && fromIso > toIso) return false;

  const targetIso = normalizeDateToIso(rawDate);
  if (!targetIso) return false;

  if (fromIso && targetIso < fromIso) return false;
  if (toIso && targetIso > toIso) return false;
  return true;
}
