import { Preferences } from "@capacitor/preferences";
import type { DaywardenEntry } from "../types/entry";

const ENTRIES_KEY = "daywarden_entries";

export async function getEntries(): Promise<DaywardenEntry[]> {
  const { value } = await Preferences.get({
    key: ENTRIES_KEY,
  });

  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value) as DaywardenEntry[];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: DaywardenEntry[]): Promise<void> {
  await Preferences.set({
    key: ENTRIES_KEY,
    value: JSON.stringify(entries),
  });
}

export async function addEntry(
  entry: DaywardenEntry,
): Promise<DaywardenEntry[]> {
  const entries = await getEntries();

  const updatedEntries = [entry, ...entries];

  await saveEntries(updatedEntries);

  return updatedEntries;
}
