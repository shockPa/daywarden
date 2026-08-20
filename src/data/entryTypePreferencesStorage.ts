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

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultPreferences;
  }

  return {
    order: Array.isArray(value.order)
      ? value.order.filter((item): item is string => typeof item === "string")
      : [],

    hiddenIds: Array.isArray(value.hiddenIds)
      ? value.hiddenIds.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  };
}

export async function saveEntryTypePreferences(
  preferences: EntryTypePreferences,
): Promise<void> {
  const database = await getDaywardenDb();

  await database.put("settings", preferences, PREFERENCES_KEY);
}
