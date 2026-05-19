import { DateTime } from "luxon";
import { ENV } from "../config/env.js";

export function isExpired(dateStr) {
  if (!dateStr) return true;

  const parsed = new Date(dateStr);
  return parsed.getTime() < Date.now();
}

export function parseHxgnDateTime(dateStr) {
  if (!dateStr) return null;

  const [datePart, timePart] = dateStr.split(" ");
  const [day, monStr, year] = datePart.split("-");
  const [hour = "00", minute = "00"] = (timePart || "").split(":");

  const months = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
  };

  const zone = getServerTimeZone();

  const dt = DateTime.fromObject(
    {
      year: Number(year),
      month: months[monStr.toUpperCase()],
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute)
    },
    { zone }
  );

  return dt.toUTC().toISO();
}

export function getServerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}