export const DEFAULT_LIBRARY_FOLDER_ID = "library-inbox";

export interface LibraryFolder {
  id: string;
  name: string;

  sortOrder: number;

  createdAt: string;
  updatedAt: string;
}

interface LibraryItemBase {
  id: string;

  folderId: string;

  title: string;

  createdAt: string;
  updatedAt: string;

  /*
   * If present, the item lives in
   * Library → Archive.
   *
   * Permanent deletion will only be
   * available from there.
   */
  archivedAt?: string;

  /*
   * When several items are merged,
   * the merged item can remember
   * where its contents came from.
   */
  sourceItemIds?: string[];
}

export interface LibraryNoteItem extends LibraryItemBase {
  type: "note";

  content: string;
}

export interface LibraryChecklistItem {
  id: string;

  text: string;

  checked: boolean;
}

export interface LibraryListItem extends LibraryItemBase {
  type: "list";

  items: LibraryChecklistItem[];
}

export type LibraryItem = LibraryNoteItem | LibraryListItem;
