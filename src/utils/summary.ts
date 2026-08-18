import type { DaywardenEntry } from "../types/entry";

import type {
  DurationValue,
  EntryFieldDefinition,
  EntryFieldValue,
  EntryTypeDefinition,
  TimeRangeValue,
  TimerValue,
} from "../types/entryType";

export interface FieldSummary {
  fieldId: string;
  fieldName: string;
  displayValue: string;
}

export interface EntryTypeSummary {
  entryTypeId: string;
  entryTypeName: string;
  entryCount: number;
  fields: FieldSummary[];
}

function timerToMinutes(value: TimerValue): number {
  const start = new Date(value.startedAt).getTime();

  const end = new Date(value.endedAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }

  return Math.round((end - start) / 60_000);
}

export function durationToMinutes(duration: DurationValue): number {
  return duration.hours * 60 + duration.minutes;
}

export function timeRangeToMinutes(timeRange: TimeRangeValue): number | null {
  if (!timeRange.start || !timeRange.end) {
    return null;
  }

  const [startHour, startMinute] = timeRange.start.split(":").map(Number);

  const [endHour, endMinute] = timeRange.end.split(":").map(Number);

  const start = startHour * 60 + startMinute;

  let end = endHour * 60 + endMinute;

  /*
   * 22:00 → 02:00
   * should equal 4 hours.
   */
  if (end < start) {
    end += 24 * 60;
  }

  return end - start;
}

export function formatMinutes(totalMinutes: number): string {
  const roundedMinutes = Math.round(totalMinutes);

  const hours = Math.floor(roundedMinutes / 60);

  const minutes = roundedMinutes % 60;

  if (hours === 0 && minutes === 0) {
    return "0m";
  }

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}

function getFieldValues(
  entries: DaywardenEntry[],
  fieldId: string,
): EntryFieldValue[] {
  return entries
    .map((entry) => entry.values[fieldId])
    .filter((value): value is EntryFieldValue => value !== undefined);
}

function summarizeField(
  field: EntryFieldDefinition,
  entries: DaywardenEntry[],
): FieldSummary | null {
  if (
    !field.includeInSummary ||
    !field.summaryMode ||
    field.summaryMode === "none"
  ) {
    return null;
  }

  const values = getFieldValues(entries, field.id);

  if (values.length === 0) {
    return null;
  }

  switch (field.summaryMode) {
    case "sum": {
      if (field.type === "duration") {
        const totalMinutes = values.reduce<number>((total, value) => {
          const duration = value as DurationValue;

          return total + durationToMinutes(duration);
        }, 0);

        return {
          fieldId: field.id,
          fieldName: field.name,
          displayValue: formatMinutes(totalMinutes),
        };
      }

      const numbers = values.filter(
        (value): value is number => typeof value === "number",
      );

      if (numbers.length === 0) {
        return null;
      }

      const total = numbers.reduce((sum, value) => sum + value, 0);

      return {
        fieldId: field.id,
        fieldName: field.name,
        displayValue: formatNumber(total),
      };
    }

    case "average": {
      const numbers = values.filter(
        (value): value is number => typeof value === "number",
      );

      if (numbers.length === 0) {
        return null;
      }

      const total = numbers.reduce((sum, value) => sum + value, 0);

      const average = total / numbers.length;

      return {
        fieldId: field.id,
        fieldName: field.name,

        displayValue:
          numbers.length === 1
            ? formatNumber(average)
            : `Average ${formatNumber(average)}`,
      };
    }

    case "count": {
      const booleans = values.filter(
        (value): value is boolean => typeof value === "boolean",
      );

      if (booleans.length === 0) {
        return null;
      }

      const yesCount = booleans.filter((value) => value).length;

      const percentage = Math.round((yesCount / booleans.length) * 100);

      return {
        fieldId: field.id,
        fieldName: field.name,
        displayValue: `${yesCount} yes · ${percentage}%`,
      };
    }

    case "duration-from-range": {
      const totalMinutes = values.reduce<number>((total, value) => {
        const timeRange = value as TimeRangeValue;

        const minutes = timeRangeToMinutes(timeRange);

        return total + (minutes ?? 0);
      }, 0);

      return {
        fieldId: field.id,
        fieldName: field.name,
        displayValue: formatMinutes(totalMinutes),
      };
    }
    case "duration-from-timer": {
      const totalMinutes = values.reduce<number>((total, value) => {
        if (
          typeof value !== "object" ||
          value === null ||
          !("startedAt" in value) ||
          !("endedAt" in value)
        ) {
          return total;
        }

        return total + timerToMinutes(value as TimerValue);
      }, 0);

      return {
        fieldId: field.id,

        fieldName: field.name,

        displayValue: formatMinutes(totalMinutes),
      };
    }

    default:
      return null;
  }
}

export function buildEntryTypeSummaries(
  entries: DaywardenEntry[],
  entryTypes: EntryTypeDefinition[],
): EntryTypeSummary[] {
  const summaries: EntryTypeSummary[] = [];

  for (const entryType of entryTypes) {
    const matchingEntries = entries.filter(
      (entry) => entry.entryTypeId === entryType.id,
    );

    if (matchingEntries.length === 0) {
      continue;
    }

    const fields = entryType.fields
      .map((field) => summarizeField(field, matchingEntries))
      .filter((summary): summary is FieldSummary => summary !== null);

    summaries.push({
      entryTypeId: entryType.id,

      entryTypeName: entryType.name,

      entryCount: matchingEntries.length,

      fields,
    });
  }

  return summaries;
}
