import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { DaywardenEntry } from "../types/entry";

import type {
  EntryTypeDefinition,
  EntryTypePreferences,
} from "../types/entryType";

interface DaywardenDatabase extends DBSchema {
  entries: {
    key: string;

    value: DaywardenEntry;

    indexes: {
      "by-created-at": string;
      "by-entry-type": string;
    };
  };

  customEntryTypes: {
    key: string;

    value: EntryTypeDefinition;
  };

  settings: {
    key: string;

    value: EntryTypePreferences | boolean;
  };
}

const DATABASE_NAME = "daywarden";

const DATABASE_VERSION = 1;

const databasePromise = openDB<DaywardenDatabase>(
  DATABASE_NAME,
  DATABASE_VERSION,
  {
    upgrade(database) {
      if (!database.objectStoreNames.contains("entries")) {
        const entryStore = database.createObjectStore("entries", {
          keyPath: "id",
        });

        entryStore.createIndex("by-created-at", "createdAt");

        entryStore.createIndex("by-entry-type", "entryTypeId");
      }

      if (!database.objectStoreNames.contains("customEntryTypes")) {
        database.createObjectStore("customEntryTypes", {
          keyPath: "id",
        });
      }

      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings");
      }
    },
  },
);

export function getDaywardenDb(): Promise<IDBPDatabase<DaywardenDatabase>> {
  return databasePromise;
}
