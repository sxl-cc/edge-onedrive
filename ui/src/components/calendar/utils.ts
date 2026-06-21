import { list } from "solid-tiny-utils";
import {
  addDays,
  endOfMonth,
  formatToDateTime,
  getDay,
  getWeekday,
  parseDate,
} from "time-core";

export function getCalendarRows(year: number, month: number) {
  const firstDay = getWeekday([year, month, 1]);
  const days = getDay([year, month + 1, 0]);

  return Math.ceil((firstDay + days) / 7);
}

/**
 * Generate the lines of the calendar, which is a 2D array of dates. Each line has 7 days. (Sun to Sat)
 *
 * if a week contains days of two months, it belongs to the month of the first day in this week.
 *
 */
export function genCalendarLines(
  year: number,
  month: number,
  padding: number
): Date[][] {
  const lines: Date[][] = [];
  const days: Date[] = [];

  const firstDay = parseDate(`${year}-${month}-01`);
  let lastDay = endOfMonth(firstDay);
  const firstDayWeekday = getWeekday(firstDay);
  const lastDayWeekday = getWeekday(lastDay);

  // fill the days before the first day of the month
  for (let i = firstDayWeekday; i > 0; i--) {
    days.push(addDays(firstDay, -i));
  }

  if (lastDayWeekday !== 6) {
    // remove the days in this week
    lastDay = addDays(lastDay, -(lastDayWeekday + 1));
  }

  // fill the days of the month
  for (let i = 0; i < getDay(lastDay); i++) {
    days.push(addDays(firstDay, i));
  }

  // padding
  const firstDayInLines = days[0];
  const lastDayInLines = lastDay;

  for (let i = 0; i < padding; i++) {
    days.push(...list(6).map((v) => addDays(lastDayInLines, v + 1 + i * 7)));
    days.unshift(
      ...list(6)
        .map((v) => addDays(firstDayInLines, -(v + 1 + i * 7)))
        .reverse()
    );
  }

  // a line has 7 days, so we slice the days array into lines
  for (let i = 0; i < days.length; i += 7) {
    lines.push(days.slice(i, i + 7));
  }

  return lines;
}

/**
 * Gets the dates for the week containing the given date.
 *
 * The week starts on the day specified by `startOfWeek` (0 for Sunday, 1 for Monday, etc.).
 *
 */
export function getThisWeekDates(current: Date, startOfWeek = 0) {
  const normalizedStart = ((startOfWeek % 7) + 7) % 7;
  const weekday = getWeekday(current);
  const diff = (weekday - normalizedStart + 7) % 7;
  const startOfWeekDate = addDays(current, -diff);
  return list(6).map((i) => addDays(startOfWeekDate, i));
}

export function getDateKey(date: Date | string) {
  return formatToDateTime(date).split(" ")[0];
}
