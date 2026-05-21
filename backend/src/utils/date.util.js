import { DateTime } from "luxon";
import { ENV } from "../config/env.js";

export function isExpired(dateStr) {
  if (!dateStr) return true;

  const parsed = new Date(dateStr);
  return parsed.getTime() < Date.now();
}

export function parseHxgnDateTime(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }

  const zone = getServerTimeZone();

  const formats = [
    // Classic
    "dd-MMM-yyyy",
    "dd-MMM-yyyy HH:mm",
    "dd-MMM-yyyy HH:mm:ss",

    // Slash formats
    "dd/MM/yyyy",
    "dd/MM/yyyy HH:mm",
    "dd/MM/yyyy HH:mm:ss",

    // Dash formats
    "dd-MM-yyyy",
    "dd-MM-yyyy HH:mm",
    "dd-MM-yyyy HH:mm:ss",

    // ISO-like formats
    "yyyy-MM-dd",
    "yyyy-MM-dd HH:mm",
    "yyyy-MM-dd HH:mm:ss",

    // US formats (optional)
    "MM/dd/yyyy",
    "MM/dd/yyyy HH:mm",
    "MM/dd/yyyy HH:mm:ss",
  ];

  // Try all known formats
  for (const format of formats) {
    const dt = DateTime.fromFormat(dateStr.trim(), format, {
      zone,
      locale: "en",
    });

    if (dt.isValid) {
      return dt.toUTC().toISO();
    }
  }

  // Try ISO parsing
  let dt = DateTime.fromISO(dateStr, { zone });

  if (dt.isValid) {
    return dt.toUTC().toISO();
  }

  // Try RFC parsing
  dt = DateTime.fromRFC2822(dateStr, { zone });

  if (dt.isValid) {
    return dt.toUTC().toISO();
  }

  // Final fallback using JS Date
  const jsDate = new Date(dateStr);

  if (!isNaN(jsDate.getTime())) {
    return DateTime.fromJSDate(jsDate, { zone })
      .toUTC()
      .toISO();
  }

  console.error("Unsupported date format:", dateStr);

  return null;
}

export function getServerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}