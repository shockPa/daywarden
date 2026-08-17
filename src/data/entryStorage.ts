import { getDaywardenDb } from "./db";

import type { DaywardenEntry } from "../types/entry";

export async function getEntries(): Promise<DaywardenEntry[]> {
  const database = await getDaywardenDb();

  const entries = await database.getAll("entries");

  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function saveEntries(entries: DaywardenEntry[]): Promise<void> {
  const database = await getDaywardenDb();

  const transaction = database.transaction("entries", "readwrite");

  await transaction.store.clear();

  for (const entry of entries) {
    await transaction.store.put(entry);
  }

  await transaction.done;
}

export async function addEntry(
  entry: DaywardenEntry,
): Promise<DaywardenEntry[]> {
  const database = await getDaywardenDb();

  await database.add("entries", entry);

  return getEntries();
}

export async function updateEntry(
  updatedEntry: DaywardenEntry,
): Promise<DaywardenEntry[]> {
  const database = await getDaywardenDb();

  await database.put("entries", updatedEntry);

  return getEntries();
}

export async function deleteEntry(entryId: string): Promise<DaywardenEntry[]> {
  const database = await getDaywardenDb();

  await database.delete("entries", entryId);

  return getEntries();
}
