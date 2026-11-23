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
export function useIstLiveClock(intervalMs: number = 1000) {
  const [clock, setClock] = useState(() => ({
    time: getIstTimeString(),
    dateStr: getIstDateString(),
    displayDate: getIstDisplayDate(),
  }));

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock({
        time: getIstTimeString(now),
        dateStr: getIstDateString(now),
        displayDate: getIstDisplayDate(now),
      });
    };

    tick();
    const interval = setInterval(tick, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return clock;
}
