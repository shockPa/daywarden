import { Preferences } from "@capacitor/preferences";

import type { EntryTypePreferences } from "../types/entryType";

const PREFERENCES_KEY = "daywarden_entry_type_preferences_v1";

const defaultPreferences: EntryTypePreferences = {
  order: [],
  hiddenIds: [],
};

export async function getEntryTypePreferences(): Promise<EntryTypePreferences> {
  const { value } = await Preferences.get({
    key: PREFERENCES_KEY,
  });

  if (!value) {
    return defaultPreferences;
  }

  try {
    const parsed = JSON.parse(value);

    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],

      hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
    };
  } catch {
    return defaultPreferences;
  }
}

export async function saveEntryTypePreferences(
  preferences: EntryTypePreferences,
): Promise<void> {
  await Preferences.set({
    key: PREFERENCES_KEY,
    value: JSON.stringify(preferences),
  });
}
