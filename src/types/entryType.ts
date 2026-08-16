export type EntryFieldType =
  | "text"
  | "number"
  | "scale"
  | "time"
  | "time-range"
  | "duration"
  | "checkbox"
  | "list";

export type SummaryMode =
  | "none"
  | "sum"
  | "average"
  | "count"
  | "duration-from-range";

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
}

export interface EntryTypeDefinition {
  id: string;
  name: string;
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

export type EntryFieldValue =
  | string
  | number
  | boolean
  | string[]
  | TimeRangeValue
  | DurationValue;

export type EntryValues = Record<string, EntryFieldValue>;

export interface EntryTypePreferences {
  order: string[];
  hiddenIds: string[];
}
