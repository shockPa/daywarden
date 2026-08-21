import { getDaywardenDb } from "./db";

import type { EntryTypePreferences } from "../types/entryType";

const PREFERENCES_KEY = "entryTypePreferences";

const defaultPreferences: EntryTypePreferences = {
  order: [],
  hiddenIds: [],
  iconOverrides: {},
};

function normalizeIconOverrides(
  value: unknown,
): Record<string, string | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string | null] =>
        typeof entry[1] === "string" || entry[1] === null,
    ),
  );
}

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

    iconOverrides: normalizeIconOverrides(value.iconOverrides),
  };
}

export async function saveEntryTypePreferences(
  preferences: EntryTypePreferences,
): Promise<void> {
  const database = await getDaywardenDb();

  await database.put("settings", preferences, PREFERENCES_KEY);
}
