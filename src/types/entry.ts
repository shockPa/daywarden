import type { EntryValues } from "./entryType";

export interface DaywardenEntry {
  id: string;

  entryTypeId: string;

  /*
   * Keep the name as a snapshot too.
   * That way old entries remain understandable
   * even if a custom type is later renamed/removed.
   */
  entryTypeName: string;

  createdAt: string;

  values: EntryValues;
}
