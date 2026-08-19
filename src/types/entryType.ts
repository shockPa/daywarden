export type EntryFieldType =
  | "text"
  | "number"
  | "scale"
  | "faces"
  | "time"
  | "time-range"
  | "duration"
  | "timer"
  | "checkbox"
  | "list";

export type SummaryMode =
  | "none"
  | "sum"
  | "average"
  | "count"
  | "duration-from-range"
  | "duration-from-timer";

export type ColorDirection = "higher-is-better" | "higher-is-worse" | "neutral";

export interface EntryFieldDefinition {
  id: string;
  name: string;
  type: EntryFieldType;

  required?: boolean;

  placeholder?: string;

  min?: number;
  max?: number;
  step?: number;

  includeInSummary?: boolean;
  summaryMode?: SummaryMode;

  colorDirection?: ColorDirection;

  showInCalendar?: boolean;
}

export interface EntryTypeDefinition {
  id: string;

  name: string;

  /*
   * References an icon bundled
   * with Daywarden.
   *
   * Example:
   * "running"
   * "dumbbell"
   * "moon"
   */
  iconId?: string;

  builtIn: boolean;

  archived?: boolean;

  fields: EntryFieldDefinition[];
}

export interface TimeRangeValue {
  start: string;
  end: string;
}

export interface DurationValue {
  hours: number;
  minutes: number;
}

export interface TimerValue {
  startedAt: string;
  endedAt: string;
}

export type EntryFieldValue =
  | string
  | number
  | boolean
  | string[]
  | TimeRangeValue
  | DurationValue
  | TimerValue;

export type EntryValues = Record<string, EntryFieldValue>;

export interface EntryTypePreferences {
  order: string[];
  hiddenIds: string[];
}
