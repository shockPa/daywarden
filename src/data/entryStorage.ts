import { Preferences } from "@capacitor/preferences";

import type { DaywardenEntry } from "../types/entry";

const ENTRIES_KEY = "daywarden_entries_v1";

export async function getEntries(): Promise<DaywardenEntry[]> {
  const { value } = await Preferences.get({
    key: ENTRIES_KEY,
  });

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as DaywardenEntry[];
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

export async function updateEntry(
  updatedEntry: DaywardenEntry,
): Promise<DaywardenEntry[]> {
  const entries = await getEntries();

  const updatedEntries = entries.map((entry) =>
    entry.id === updatedEntry.id ? updatedEntry : entry,
  );

  await saveEntries(updatedEntries);

  return updatedEntries;
}

export async function deleteEntry(entryId: string): Promise<DaywardenEntry[]> {
  const entries = await getEntries();

  const updatedEntries = entries.filter((entry) => entry.id !== entryId);

  await saveEntries(updatedEntries);

  return updatedEntries;
}
