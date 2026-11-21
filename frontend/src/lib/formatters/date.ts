import { format, parseISO } from "date-fns";
import { appConfig } from "@/config/app.config";

export function formatDate(
  date: string | Date | null | undefined,
  formatPattern: string = appConfig.dateFormat
): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, formatPattern);
  } catch {
    return "-";
  }
}

export function formatDateTime(
  date: string | Date | null | undefined,
  formatPattern: string = appConfig.dateTimeFormat
): string {
  return formatDate(date, formatPattern);
}

