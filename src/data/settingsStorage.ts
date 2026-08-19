import { getDaywardenDb } from "./db";

import type { ThemeMode } from "../types/settings";

const THEME_KEY = "themeMode";

const LAST_UPDATE_CHECK_KEY = "lastUpdateCheck";

const CALENDAR_LENS_ENTRY_TYPE_KEY =
  "calendarLensEntryTypeId";

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


export async function getCalendarLensEntryTypeId(): Promise<
  string | null
> {
  const database = await getDaywardenDb();

  const value = await database.get(
    "settings",
    CALENDAR_LENS_ENTRY_TYPE_KEY,
  );

  return typeof value === "string"
    ? value
    : null;
}

export async function saveCalendarLensEntryTypeId(
  entryTypeId: string,
): Promise<void> {
  const database = await getDaywardenDb();

  await database.put(
    "settings",
    entryTypeId,
    CALENDAR_LENS_ENTRY_TYPE_KEY,
  );
}
