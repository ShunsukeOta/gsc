import type { DateRange } from './types';

const DATE_TZ = 'America/Los_Angeles';

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(value: string, amount: number) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDate(date);
}

export function todayInSearchConsoleTimezone(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DATE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function buildDateRange(days: number): DateRange {
  const safeDays = [7, 28, 90].includes(days) ? days : 28;
  const endDate = addDays(todayInSearchConsoleTimezone(), -1);
  const startDate = addDays(endDate, -(safeDays - 1));
  const previousEndDate = addDays(startDate, -1);
  const previousStartDate = addDays(previousEndDate, -(safeDays - 1));
  return { startDate, endDate, previousStartDate, previousEndDate, days: safeDays };
}
