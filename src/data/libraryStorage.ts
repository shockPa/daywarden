import { getDaywardenDb } from "./db";

import {
  DEFAULT_LIBRARY_FOLDER_ID,
  type LibraryFolder,
  type LibraryItem,
  type LibraryListItem,
  type LibraryNoteItem,
} from "../types/library";

import { createId } from "../utils/id";

const LAST_LIBRARY_FOLDER_KEY = "lastLibraryFolderId";

function sortFolders(folders: LibraryFolder[]): LibraryFolder[] {
  return [...folders].sort((a, b) => a.sortOrder - b.sortOrder);
}

function sortItems(items: LibraryItem[]): LibraryItem[] {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

async function ensureInboxFolder(): Promise<void> {
  const database = await getDaywardenDb();

  const existing = await database.get(
    "libraryFolders",
    DEFAULT_LIBRARY_FOLDER_ID,
  );

  if (existing) {
    return;
  }

  const now = new Date().toISOString();

  await database.put("libraryFolders", {
    id: DEFAULT_LIBRARY_FOLDER_ID,

    name: "Inbox",

    sortOrder: 0,

    createdAt: now,

    updatedAt: now,
  });
}

export async function getLibraryFolders(): Promise<LibraryFolder[]> {
  await ensureInboxFolder();

  const database = await getDaywardenDb();

  const folders = await database.getAll("libraryFolders");

  return sortFolders(folders);
}

export async function getLibraryItems(): Promise<LibraryItem[]> {
  const database = await getDaywardenDb();

  const items = await database.getAll("libraryItems");

  return sortItems(items);
}

export async function getLastLibraryFolderId(): Promise<string> {
  await ensureInboxFolder();

  const database = await getDaywardenDb();

  const value = await database.get("settings", LAST_LIBRARY_FOLDER_KEY);

  if (typeof value === "string") {
    const folder = await database.get("libraryFolders", value);

    if (folder) {
      return value;
    }
  }

  return DEFAULT_LIBRARY_FOLDER_ID;
}

export async function saveLastLibraryFolderId(folderId: string): Promise<void> {
  const database = await getDaywardenDb();

  await database.put("settings", folderId, LAST_LIBRARY_FOLDER_KEY);
}

export async function createLibraryFolder(
  name: string,
): Promise<LibraryFolder[]> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return getLibraryFolders();
  }

  const database = await getDaywardenDb();

  const existingFolders = await getLibraryFolders();

  const highestSortOrder = existingFolders.reduce(
    (highest, folder) => Math.max(highest, folder.sortOrder),
    0,
  );

  const now = new Date().toISOString();

  const folder: LibraryFolder = {
    id: createId(),

    name: trimmedName,

    sortOrder: highestSortOrder + 1,

    createdAt: now,

    updatedAt: now,
  };

  await database.add("libraryFolders", folder);

  return getLibraryFolders();
}

export async function createLibraryNote(
  folderId: string,
  title: string,
  content: string,
): Promise<LibraryItem[]> {
  const database = await getDaywardenDb();

  const now = new Date().toISOString();

  const note: LibraryNoteItem = {
    id: createId(),

    folderId,

    type: "note",

    title: title.trim() || "Untitled note",

    content: content.trim(),

    createdAt: now,

    updatedAt: now,
  };

  await database.add("libraryItems", note);

  await saveLastLibraryFolderId(folderId);

  return getLibraryItems();
}

export async function createLibraryList(
  folderId: string,
  title: string,
  lines: string[],
): Promise<LibraryItem[]> {
  const database = await getDaywardenDb();

  const now = new Date().toISOString();

  const list: LibraryListItem = {
    id: createId(),

    folderId,

    type: "list",

    title: title.trim() || "Untitled list",

    items: lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({
        id: createId(),

        text,

        checked: false,
      })),

    createdAt: now,

    updatedAt: now,
  };

  await database.add("libraryItems", list);

  await saveLastLibraryFolderId(folderId);

  return getLibraryItems();
}

export async function toggleLibraryChecklistItem(
  libraryItemId: string,
  checklistItemId: string,
): Promise<LibraryItem[]> {
  const database = await getDaywardenDb();

  const item = await database.get("libraryItems", libraryItemId);

  if (!item || item.type !== "list") {
    return getLibraryItems();
  }

  const updated: LibraryListItem = {
    ...item,

    updatedAt: new Date().toISOString(),

    items: item.items.map((checklistItem) =>
      checklistItem.id === checklistItemId
        ? {
            ...checklistItem,

            checked: !checklistItem.checked,
          }
        : checklistItem,
    ),
  };

  await database.put("libraryItems", updated);

  return getLibraryItems();
}

export async function archiveLibraryItem(
  itemId: string,
): Promise<LibraryItem[]> {
  const database = await getDaywardenDb();

  const item = await database.get("libraryItems", itemId);

  if (!item) {
    return getLibraryItems();
  }

  await database.put("libraryItems", {
    ...item,

    archivedAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),
  });

  return getLibraryItems();
}

export async function restoreLibraryItem(
  itemId: string,
): Promise<LibraryItem[]> {
  const database = await getDaywardenDb();

  const item = await database.get("libraryItems", itemId);

  if (!item) {
    return getLibraryItems();
  }

  const restoredItem = {
    ...item,
  };

  delete restoredItem.archivedAt;

  await database.put("libraryItems", {
    ...restoredItem,

    updatedAt: new Date().toISOString(),
  } as LibraryItem);

  return getLibraryItems();
}

export async function permanentlyDeleteLibraryItem(
  itemId: string,
): Promise<LibraryItem[]> {
  const database = await getDaywardenDb();

  const item = await database.get("libraryItems", itemId);

  /*
   * Permanent deletion is intentionally
   * restricted to archived items.
   */
  if (!item || !item.archivedAt) {
    return getLibraryItems();
  }

  await database.delete("libraryItems", itemId);

  return getLibraryItems();
}

export type LibraryMergeOrder = "oldest-first" | "newest-first";

interface MergeLibraryItemsOptions {
  itemIds: string[];

  title: string;

  folderId: string;

  order: LibraryMergeOrder;

  archiveOriginals: boolean;
}

export async function mergeLibraryItems({
  itemIds,
  title,
  folderId,
  order,
  archiveOriginals,
}: MergeLibraryItemsOptions): Promise<LibraryItem[]> {
  if (itemIds.length < 2) {
    throw new Error("Select at least two Library items to merge.");
  }

  const database = await getDaywardenDb();

  const selectedItems = (
    await Promise.all(
      itemIds.map((itemId) => database.get("libraryItems", itemId)),
    )
  ).filter((item): item is LibraryItem => Boolean(item));

  if (selectedItems.length !== itemIds.length) {
    throw new Error("One or more selected items could not be found.");
  }

  if (selectedItems.some((item) => Boolean(item.archivedAt))) {
    throw new Error("Archived items cannot be merged.");
  }

  const itemType = selectedItems[0].type;

  if (selectedItems.some((item) => item.type !== itemType)) {
    throw new Error(
      "Notes can only be merged with notes, and lists with lists.",
    );
  }

  const orderedItems = [...selectedItems].sort((a, b) => {
    const difference =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    return order === "oldest-first" ? difference : -difference;
  });

  const now = new Date().toISOString();

  let mergedItem: LibraryItem;

  if (itemType === "note") {
    const notes = orderedItems.filter(
      (item): item is LibraryNoteItem => item.type === "note",
    );

    mergedItem = {
      id: createId(),

      type: "note",

      folderId,

      title: title.trim() || "Merged note",

      content: notes
        .map((note) => note.content.trim())
        .filter(Boolean)
        .join("\n\n────────\n\n"),

      sourceItemIds: orderedItems.map((item) => item.id),

      createdAt: now,

      updatedAt: now,
    };
  } else {
    const lists = orderedItems.filter(
      (item): item is LibraryListItem => item.type === "list",
    );

    mergedItem = {
      id: createId(),

      type: "list",

      folderId,

      title: title.trim() || "Merged list",

      items: lists.flatMap((list) =>
        list.items.map((checklistItem) => ({
          ...checklistItem,

          /*
           * New IDs make the
           * merged list fully
           * independent.
           */
          id: createId(),
        })),
      ),

      sourceItemIds: orderedItems.map((item) => item.id),

      createdAt: now,

      updatedAt: now,
    };
  }

  const transaction = database.transaction("libraryItems", "readwrite");

  await transaction.store.put(mergedItem);

  if (archiveOriginals) {
    for (const item of selectedItems) {
      await transaction.store.put({
        ...item,

        archivedAt: now,

        updatedAt: now,
      });
    }
  }

  await transaction.done;

  return getLibraryItems();
}
