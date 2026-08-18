import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { DaywardenEntry } from "../types/entry";

import type {
  EntryTypeDefinition,
  EntryTypePreferences,
} from "../types/entryType";

import type { ThemeMode } from "../types/settings";

import {
  DEFAULT_LIBRARY_FOLDER_ID,
  type LibraryFolder,
  type LibraryItem,
} from "../types/library";

import type { ActiveTimer } from "../types/timer";

export type DaywardenSettingValue =
  | EntryTypePreferences
  | ThemeMode
  | boolean
  | string;

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

    value: DaywardenSettingValue;
  };

  activeTimers: {
    key: string;

    value: ActiveTimer;

    indexes: {
      "by-entry-type": string;

      "by-started-at": string;
    };
  };

  libraryFolders: {
    key: string;

    value: LibraryFolder;

    indexes: {
      "by-sort-order": number;
    };
  };

  libraryItems: {
    key: string;

    value: LibraryItem;

    indexes: {
      "by-folder": string;

      "by-updated-at": string;

      "by-archived-at": string;
    };
  };
}

const DATABASE_NAME = "daywarden";

const DATABASE_VERSION = 2;

const databasePromise = openDB<DaywardenDatabase>(
  DATABASE_NAME,
  DATABASE_VERSION,
  {
    upgrade(database, oldVersion) {
      /*
       * Version 1
       *
       * Existing Daywarden
       * database.
       */
      if (oldVersion < 1) {
        const entryStore = database.createObjectStore("entries", {
          keyPath: "id",
        });

        entryStore.createIndex("by-created-at", "createdAt");

        entryStore.createIndex("by-entry-type", "entryTypeId");

        database.createObjectStore("customEntryTypes", {
          keyPath: "id",
        });

        database.createObjectStore("settings");
      }

      /*
       * Version 2
       *
       * Adds Library and persistent
       * active timers.
       */
      if (oldVersion < 2) {
        const activeTimerStore = database.createObjectStore("activeTimers", {
          keyPath: "id",
        });

        activeTimerStore.createIndex("by-entry-type", "entryTypeId", {
          /*
           * Only one running timer
           * per Entry Type.
           */
          unique: true,
        });

        activeTimerStore.createIndex("by-started-at", "startedAt");

        const folderStore = database.createObjectStore("libraryFolders", {
          keyPath: "id",
        });

        folderStore.createIndex("by-sort-order", "sortOrder");

        const itemStore = database.createObjectStore("libraryItems", {
          keyPath: "id",
        });

        itemStore.createIndex("by-folder", "folderId");

        itemStore.createIndex("by-updated-at", "updatedAt");

        itemStore.createIndex("by-archived-at", "archivedAt");

        /*
         * Every Daywarden Library
         * begins with an Inbox.
         */
        const now = new Date().toISOString();

        void folderStore.put({
          id: DEFAULT_LIBRARY_FOLDER_ID,

          name: "Inbox",

          sortOrder: 0,

          createdAt: now,

          updatedAt: now,
        });
      }
    },
  },
);

export function getDaywardenDb(): Promise<IDBPDatabase<DaywardenDatabase>> {
  return databasePromise;
}
