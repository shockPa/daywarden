import { getDaywardenDb } from "./db";

import type { ThemeMode } from "../types/settings";

const THEME_KEY = "themeMode";

const LAST_UPDATE_CHECK_KEY = "lastUpdateCheck";

const SHOW_LIBRARY_ON_TODAY_KEY = "showLibraryOnToday";

const CALENDAR_LENS_ENTRY_TYPE_KEY = "calendarLensEntryTypeId";

const CALENDAR_LENS_ENTRY_TYPE_IDS_KEY = "calendarLensEntryTypeIds";

export async function getThemeMode(): Promise<ThemeMode> {
  const database = await getDaywardenDb();

  const value = await database.get("settings", THEME_KEY);

  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

export async function saveThemeMode(themeMode: ThemeMode): Promise<void> {
  const database = await getDaywardenDb();

  await database.put("settings", themeMode, THEME_KEY);
}

export async function getLastUpdateCheck(): Promise<string | null> {
  const database = await getDaywardenDb();

  const value = await database.get("settings", LAST_UPDATE_CHECK_KEY);

  return typeof value === "string" ? value : null;
}

export async function saveLastUpdateCheck(value: string): Promise<void> {
  const database = await getDaywardenDb();

  await database.put("settings", value, LAST_UPDATE_CHECK_KEY);
}

export async function getShowLibraryOnToday(): Promise<boolean> {
  const database = await getDaywardenDb();

  const value = await database.get("settings", SHOW_LIBRARY_ON_TODAY_KEY);

  return value === true;
}

export async function saveShowLibraryOnToday(
  value: boolean,
): Promise<void> {
  const database = await getDaywardenDb();

  await database.put("settings", value, SHOW_LIBRARY_ON_TODAY_KEY);
}

export async function getCalendarLensEntryTypeIds(): Promise<string[] | null> {
  const database = await getDaywardenDb();

  const value = await database.get(
    "settings",
    CALENDAR_LENS_ENTRY_TYPE_IDS_KEY,
  );

  if (Array.isArray(value)) {
    const stringValues = value.filter(
      (item): item is string => typeof item === "string",
    );

    if (stringValues.length === value.length) {
      return stringValues;
    }
  }

  /*
   * Backward compatibility:
   * older Daywarden versions stored one Lens ID.
   */
  const legacyValue = await database.get(
    "settings",
    CALENDAR_LENS_ENTRY_TYPE_KEY,
  );

  if (typeof legacyValue === "string" && legacyValue) {
    return [legacyValue];
  }

  return null;
}

export async function saveCalendarLensEntryTypeIds(
  entryTypeIds: string[],
): Promise<void> {
  const database = await getDaywardenDb();

  await database.put(
    "settings",
    Array.from(new Set(entryTypeIds)),
    CALENDAR_LENS_ENTRY_TYPE_IDS_KEY,
  );
}
