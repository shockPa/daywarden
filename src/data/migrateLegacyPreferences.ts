import { Preferences } from "@capacitor/preferences";

import { getDaywardenDb } from "./db";

import type { DaywardenEntry } from "../types/entry";

import type {
  EntryTypeDefinition,
  EntryTypePreferences,
} from "../types/entryType";

const LEGACY_ENTRIES_KEY = "daywarden_entries_v1";

const LEGACY_ENTRY_TYPES_KEY = "daywarden_custom_entry_types_v1";

const LEGACY_PREFERENCES_KEY = "daywarden_entry_type_preferences_v1";

const MIGRATION_KEY = "legacyCapacitorPreferencesMigratedV1";

function parseArray<T>(value: string | null): T[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parsePreferences(value: string | null): EntryTypePreferences | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],

      hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
    };
  } catch {
    return null;
  }
}

let migrationPromise: Promise<void> | null = null;

async function runMigration(): Promise<void> {
  const database = await getDaywardenDb();

  const alreadyMigrated = await database.get("settings", MIGRATION_KEY);

  if (alreadyMigrated === true) {
    return;
  }

  /*
   * Read the old Capacitor data before
   * starting the IndexedDB transaction.
   */
  const [legacyEntriesResult, legacyEntryTypesResult, legacyPreferencesResult] =
    await Promise.all([
      Preferences.get({
        key: LEGACY_ENTRIES_KEY,
      }),

      Preferences.get({
        key: LEGACY_ENTRY_TYPES_KEY,
      }),

      Preferences.get({
        key: LEGACY_PREFERENCES_KEY,
      }),
    ]);

  const legacyEntries = parseArray<DaywardenEntry>(legacyEntriesResult.value);

  const legacyEntryTypes = parseArray<EntryTypeDefinition>(
    legacyEntryTypesResult.value,
  );

  const legacyPreferences = parsePreferences(legacyPreferencesResult.value);

  const transaction = database.transaction(
    ["entries", "customEntryTypes", "settings"],
    "readwrite",
  );

  const entryStore = transaction.objectStore("entries");

  const entryTypeStore = transaction.objectStore("customEntryTypes");

  const settingsStore = transaction.objectStore("settings");

  /*
   * Only copy legacy records if the new
   * IndexedDB stores are still empty.
   */
  if ((await entryStore.count()) === 0) {
    for (const entry of legacyEntries) {
      await entryStore.put(entry);
    }
  }

  if ((await entryTypeStore.count()) === 0) {
    for (const entryType of legacyEntryTypes) {
      await entryTypeStore.put(entryType);
    }
  }

  const existingPreferences = await settingsStore.get("entryTypePreferences");

  if (!existingPreferences && legacyPreferences) {
    await settingsStore.put(legacyPreferences, "entryTypePreferences");
  }

  await settingsStore.put(true, MIGRATION_KEY);

  await transaction.done;
}

export function migrateLegacyPreferences(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = runMigration();
  }

  return migrationPromise;
}
