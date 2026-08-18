import { getDaywardenDb } from "./db";

import type { DaywardenEntry } from "../types/entry";

import type { ActiveTimer } from "../types/timer";

function sortTimers(timers: ActiveTimer[]): ActiveTimer[] {
  return timers.sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );
}

function sortEntries(entries: DaywardenEntry[]): DaywardenEntry[] {
  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getActiveTimers(): Promise<ActiveTimer[]> {
  const database = await getDaywardenDb();

  const timers = await database.getAll("activeTimers");

  return sortTimers(timers);
}

export async function startActiveTimer(
  timer: ActiveTimer,
): Promise<ActiveTimer[]> {
  const database = await getDaywardenDb();

  await database.add("activeTimers", timer);

  return getActiveTimers();
}

export async function finishActiveTimer(
  timerId: string,
  entry: DaywardenEntry,
): Promise<{
  entries: DaywardenEntry[];
  activeTimers: ActiveTimer[];
}> {
  const database = await getDaywardenDb();

  /*
   * Creating the completed entry and
   * removing the active timer happen
   * in one transaction.
   */
  const transaction = database.transaction(
    ["entries", "activeTimers"],
    "readwrite",
  );

  await transaction.objectStore("entries").put(entry);

  await transaction.objectStore("activeTimers").delete(timerId);

  await transaction.done;

  const [entries, activeTimers] = await Promise.all([
    database.getAll("entries"),

    database.getAll("activeTimers"),
  ]);

  return {
    entries: sortEntries(entries),

    activeTimers: sortTimers(activeTimers),
  };
}
