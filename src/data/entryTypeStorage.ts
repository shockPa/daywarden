import { getDaywardenDb } from "./db";

import type { EntryTypeDefinition } from "../types/entryType";

export async function getCustomEntryTypes(): Promise<EntryTypeDefinition[]> {
  const database = await getDaywardenDb();

  return database.getAll("customEntryTypes");
}

export async function saveCustomEntryTypes(
  entryTypes: EntryTypeDefinition[],
): Promise<void> {
  const database = await getDaywardenDb();

  const transaction = database.transaction("customEntryTypes", "readwrite");

  await transaction.store.clear();

  for (const entryType of entryTypes) {
    await transaction.store.put(entryType);
  }

  await transaction.done;
}

export async function addCustomEntryType(
  entryType: EntryTypeDefinition,
): Promise<EntryTypeDefinition[]> {
  const database = await getDaywardenDb();

  await database.put("customEntryTypes", entryType);

  return getCustomEntryTypes();
}

export async function archiveCustomEntryType(
  entryTypeId: string,
): Promise<EntryTypeDefinition[]> {
  const database = await getDaywardenDb();

  const entryType = await database.get("customEntryTypes", entryTypeId);

  if (!entryType) {
    return getCustomEntryTypes();
  }

  await database.put("customEntryTypes", {
    ...entryType,
    archived: true,
  });

  return getCustomEntryTypes();
}

export async function restoreCustomEntryType(
  entryTypeId: string,
): Promise<EntryTypeDefinition[]> {
  const database = await getDaywardenDb();

  const entryType = await database.get("customEntryTypes", entryTypeId);

  if (!entryType) {
    return getCustomEntryTypes();
  }

  await database.put("customEntryTypes", {
    ...entryType,
    archived: false,
  });

  return getCustomEntryTypes();
}
