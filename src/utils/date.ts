export function getLocalDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day, 12, 0, 0);
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);

  result.setHours(12, 0, 0, 0);

  result.setDate(result.getDate() + amount);

  return result;
}

export function startOfWeekMonday(date: Date): Date {
  const result = new Date(date);

  result.setHours(12, 0, 0, 0);

  const day = result.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);

  return result;
}

export function getISOWeekNumber(date: Date): number {
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );

  const dayNumber = utcDate.getUTCDay() || 7;

  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));

  return Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

export function getMonthWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1, 12);

  const lastDay = new Date(year, month + 1, 0, 12);

  const gridStart = startOfWeekMonday(firstDay);

  const finalWeekStart = startOfWeekMonday(lastDay);

  const gridEnd = addDays(finalWeekStart, 6);

  const weeks: Date[][] = [];

  let cursor = new Date(gridStart);

  while (cursor.getTime() <= gridEnd.getTime()) {
    const week: Date[] = [];

    for (let day = 0; day < 7; day += 1) {
      week.push(addDays(cursor, day));
    }

    weeks.push(week);

    cursor = addDays(cursor, 7);
  }

  return weeks;
}
