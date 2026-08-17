import { getDaywardenDb } from "./db";

import type { EntryTypePreferences } from "../types/entryType";

const PREFERENCES_KEY = "entryTypePreferences";

const defaultPreferences: EntryTypePreferences = {
  order: [],
  hiddenIds: [],
};

export async function getEntryTypePreferences(): Promise<EntryTypePreferences> {
  const database = await getDaywardenDb();

  const value = await database.get("settings", PREFERENCES_KEY);

  if (!value || typeof value !== "object") {
    return defaultPreferences;
  }

  return {
    order: Array.isArray(value.order) ? value.order : [],

    hiddenIds: Array.isArray(value.hiddenIds) ? value.hiddenIds : [],
  };
}

export async function saveEntryTypePreferences(
  preferences: EntryTypePreferences,
): Promise<void> {
  const database = await getDaywardenDb();

  await database.put("settings", preferences, PREFERENCES_KEY);
}
