import {
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import {
  archiveLibraryItem,
  createLibraryFolder,
  createLibraryList,
  createLibraryNote,
  getLastLibraryFolderId,
  getLibraryFolders,
  getLibraryItems,
  moveLibraryItems,
  permanentlyDeleteLibraryItem,
  restoreLibraryItem,
  saveLastLibraryFolderId,
  toggleLibraryChecklistItem,
  updateLibraryList,
  updateLibraryNote,
} from "../data/libraryStorage";

import type { LibraryFolder, LibraryItem } from "../types/library";

import ModalSheet from "./ModalSheet";

import LongPressSelectable from "./LongPressSelectable";

import {
  mergeLibraryItems,
  type LibraryMergeOrder,
} from "../data/libraryStorage";

type CreateMode = "note" | "list" | "folder" | null;

type LibraryFilter = "all" | "notes" | "lists";

function isInteractiveLibraryTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest("button, input, select, textarea, a, label"))
  );
}

function LibraryView() {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");

  const [editContent, setEditContent] = useState("");

  const [folders, setFolders] = useState<LibraryFolder[]>([]);

  const [items, setItems] = useState<LibraryItem[]>([]);

  const [selectedFolderId, setSelectedFolderId] = useState("");

  const [createMode, setCreateMode] = useState<CreateMode>(null);

  const [libraryFilter, setLibraryFilter] =
    useState<LibraryFilter>("all");

  const [newPickerOpen, setNewPickerOpen] = useState(false);

  const [showArchive, setShowArchive] = useState(false);

  const [title, setTitle] = useState("");

  const [content, setContent] = useState("");

  const [newFolderName, setNewFolderName] = useState("");

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const [mergeOpen, setMergeOpen] = useState(false);

  const [moveOpen, setMoveOpen] = useState(false);

  const [moveFolderId, setMoveFolderId] = useState("");

  const [moveError, setMoveError] = useState("");

  const [mergeTitle, setMergeTitle] = useState("");

  const [mergeFolderId, setMergeFolderId] = useState("");

  const [mergeOrder, setMergeOrder] =
    useState<LibraryMergeOrder>("oldest-first");

  const [archiveMergeOriginals, setArchiveMergeOriginals] = useState(true);

  const [mergeError, setMergeError] = useState("");

  const editingItem = editingItemId
    ? (items.find((item) => item.id === editingItemId) ?? null)
    : null;

  const selectedItems = items.filter((item) =>
    selectedItemIds.includes(item.id),
  );

  const selectionMode = selectedItemIds.length > 0;

  const selectedTypes = new Set(selectedItems.map((item) => item.type));

  const canMerge =
    selectedItems.length >= 2 && selectedTypes.size === 1 && !showArchive;

  const moveDestinationFolders = folders.filter(
    (folder) => folder.id !== selectedFolderId,
  );

  const canMove =
    selectedItems.length >= 1 &&
    !showArchive &&
    moveDestinationFolders.length > 0;

  function enterSelection(itemId: string) {
    setSelectedItemIds([itemId]);
  }

  function toggleSelection(itemId: string) {
    setSelectedItemIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId);
      }

      return [...current, itemId];
    });
  }

  function clearSelection() {
    setSelectedItemIds([]);

    setMoveOpen(false);
    setMoveError("");

    setMergeOpen(false);
    setMergeError("");
  }

  function handleOpenMove() {
    if (!canMove) {
      return;
    }

    const firstDestination = moveDestinationFolders[0];

    if (!firstDestination) {
      return;
    }

    setMoveFolderId(firstDestination.id);
    setMoveError("");
    setMoveOpen(true);
  }

  async function handleMove() {
    if (!moveFolderId || selectedItemIds.length === 0) {
      return;
    }

    try {
      setItems(await moveLibraryItems(selectedItemIds, moveFolderId));

      clearSelection();
    } catch (error) {
      setMoveError(
        error instanceof Error
          ? error.message
          : "Daywarden couldn't move these items.",
      );
    }
  }

  function handleOpenMerge() {
    if (!canMerge) {
      return;
    }

    setMergeTitle("");

    setMergeFolderId(selectedFolderId);

    setMergeOrder("oldest-first");

    setArchiveMergeOriginals(true);

    setMergeError("");

    setMergeOpen(true);
  }

  async function handleMerge() {
    try {
      const updated = await mergeLibraryItems({
        itemIds: selectedItemIds,

        title: mergeTitle,

        folderId: mergeFolderId,

        order: mergeOrder,

        archiveOriginals: archiveMergeOriginals,
      });

      setItems(updated);

      clearSelection();
    } catch (error) {
      setMergeError(
        error instanceof Error
          ? error.message
          : "Daywarden couldn't merge these items.",
      );
    }
  }

  useEffect(() => {
    async function loadLibrary() {
      const [savedFolders, savedItems, lastFolderId] = await Promise.all([
        getLibraryFolders(),
        getLibraryItems(),
        getLastLibraryFolderId(),
      ]);

      setFolders(savedFolders);

      setItems(savedItems);

      setSelectedFolderId(lastFolderId);
    }

    void loadLibrary();
  }, []);

  const visibleItems = items.filter((item) => {
    if (showArchive) {
      return Boolean(item.archivedAt);
    }

    if (item.archivedAt || item.folderId !== selectedFolderId) {
      return false;
    }

    if (libraryFilter === "notes") {
      return item.type === "note";
    }

    if (libraryFilter === "lists") {
      return item.type === "list";
    }

    return true;
  });

  function resetComposer() {
    setCreateMode(null);
    setTitle("");
    setContent("");
    setNewFolderName("");
  }

  function beginCreate(mode: Exclude<CreateMode, null>) {
    setCreateMode(mode);
    setTitle("");
    setContent("");
    setNewFolderName("");
  }

  function closeNewItemFlow() {
    setNewPickerOpen(false);
    resetComposer();
  }

  async function handleFolderChange(folderId: string) {
    setSelectedFolderId(folderId);

    await saveLastLibraryFolderId(folderId);
  }

  async function handleCreateNote() {
    if (!title.trim() && !content.trim()) {
      return;
    }

    const updated = await createLibraryNote(selectedFolderId, title, content);

    setItems(updated);

    closeNewItemFlow();
  }

  async function handleCreateList() {
    const lines = content.split("\n");

    if (!title.trim() && lines.every((line) => !line.trim())) {
      return;
    }

    const updated = await createLibraryList(selectedFolderId, title, lines);

    setItems(updated);

    closeNewItemFlow();
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      return;
    }

    const updatedFolders = await createLibraryFolder(newFolderName);

    setFolders(updatedFolders);

    const newestFolder = updatedFolders[updatedFolders.length - 1];

    if (newestFolder) {
      setSelectedFolderId(newestFolder.id);

      await saveLastLibraryFolderId(newestFolder.id);
    }

    closeNewItemFlow();
  }

  async function handleArchive(itemId: string) {
    setItems(await archiveLibraryItem(itemId));
    clearSelection();
  }

  async function handleArchiveEditingItem() {
    if (!editingItem) {
      return;
    }

    await handleArchive(editingItem.id);

    closeItemEditor();
  }

  async function handleRestore(itemId: string) {
    setItems(await restoreLibraryItem(itemId));
  }

  async function handlePermanentDelete(itemId: string) {
    const confirmed = window.confirm(
      "Delete this Library item permanently? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setItems(await permanentlyDeleteLibraryItem(itemId));
  }

  function openItemEditor(item: LibraryItem) {
    if (item.archivedAt) {
      return;
    }

    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditContent(
      item.type === "note"
        ? item.content
        : item.items.map((checklistItem) => checklistItem.text).join("\n"),
    );
  }

  function closeItemEditor() {
    setEditingItemId(null);
    setEditTitle("");
    setEditContent("");
  }

  async function handleSaveItemEdit() {
    if (!editingItem) {
      return;
    }

    if (editingItem.type === "note") {
      if (!editTitle.trim() && !editContent.trim()) {
        return;
      }

      setItems(await updateLibraryNote(editingItem.id, editTitle, editContent));
    } else {
      const lines = editContent.split("\n");

      if (!editTitle.trim() && lines.every((line) => !line.trim())) {
        return;
      }

      setItems(await updateLibraryList(editingItem.id, editTitle, lines));
    }

    closeItemEditor();
  }

  function handleCardClick(event: MouseEvent<HTMLElement>, item: LibraryItem) {
    if (
      showArchive ||
      selectionMode ||
      isInteractiveLibraryTarget(event.target)
    ) {
      return;
    }

    openItemEditor(item);
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLElement>,
    item: LibraryItem,
  ) {
    if (showArchive || selectionMode || event.target !== event.currentTarget) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openItemEditor(item);
  }

  return (
    <section className="library-view">
      <div className="library-toolbar">
        {!showArchive ? (
          <label>
            <span>Folder</span>

            <select
              value={selectedFolderId}
              onChange={(event) => void handleFolderChange(event.target.value)}
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <strong>Archive</strong>
        )}

        <button
          type="button"
          onClick={() => {
            setShowArchive(!showArchive);

            setLibraryFilter("all");
            setNewPickerOpen(false);

            resetComposer();
            clearSelection();
          }}
        >
          {showArchive ? "Back to Library" : "Archive"}
        </button>
      </div>

      {!showArchive && (
        <>
          <div className="library-filter-actions">
            <div
              className="library-filter-group"
              role="group"
              aria-label="Filter Library items"
            >
              <button
                type="button"
                className={libraryFilter === "all" ? "active" : ""}
                aria-pressed={libraryFilter === "all"}
                onClick={() => setLibraryFilter("all")}
              >
                All
              </button>

              <button
                type="button"
                className={libraryFilter === "notes" ? "active" : ""}
                aria-pressed={libraryFilter === "notes"}
                onClick={() => setLibraryFilter("notes")}
              >
                Notes
              </button>

              <button
                type="button"
                className={libraryFilter === "lists" ? "active" : ""}
                aria-pressed={libraryFilter === "lists"}
                onClick={() => setLibraryFilter("lists")}
              >
                Lists
              </button>
            </div>

            <button
              type="button"
              className="library-new-button"
              onClick={() => {
                resetComposer();
                setNewPickerOpen(true);
              }}
            >
              + New
            </button>
          </div>

        </>
      )}

      {selectionMode && (
        <div className="library-selection-bar">
          <button
            type="button"
            className="library-selection-close"
            aria-label="Cancel selection"
            onClick={clearSelection}
          >
            ×
          </button>

          <strong>
            {selectedItemIds.length}{" "}
            {selectedItemIds.length === 1 ? "selected" : "selected"}
          </strong>

          <div className="library-selection-actions">
            <button
              type="button"
              className="library-move-button"
              disabled={!canMove}
              onClick={handleOpenMove}
            >
              Move
            </button>

            <button
              type="button"
              className="library-merge-button"
              disabled={!canMerge}
              onClick={handleOpenMerge}
            >
              Merge
            </button>
          </div>
        </div>
      )}

      {selectionMode && selectedItems.length >= 2 && selectedTypes.size > 1 && (
        <p className="library-selection-hint">
          Select only Notes or only Lists to merge.
        </p>
      )}

      <div className="library-items">
        {visibleItems.length === 0 && (
          <p className="library-empty">
            {showArchive ? "Archive is empty." : "Nothing here yet."}
          </p>
        )}

        {visibleItems.map((item) => (
          <LongPressSelectable
            key={item.id}
            selected={selectedItemIds.includes(item.id)}
            selectionMode={selectionMode}
            disabled={showArchive || selectionMode}
            onEnterSelection={() => enterSelection(item.id)}
            onToggleSelection={() => toggleSelection(item.id)}
          >
            <article
              className={[
                "library-card",
                `library-card-${item.type}`,
                !showArchive && !selectionMode ? "library-card-editable" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              role={!showArchive && !selectionMode ? "button" : undefined}
              tabIndex={!showArchive && !selectionMode ? 0 : undefined}
              aria-label={
                !showArchive && !selectionMode
                  ? `Edit ${item.title}`
                  : undefined
              }
              onClick={(event) => handleCardClick(event, item)}
              onKeyDown={(event) => handleCardKeyDown(event, item)}
            >
              <div className="library-card-header">
                <div>
                  <span className="library-item-kind">
                    {item.type === "note" ? "Note" : "List"}
                  </span>

                  <h3>{item.title}</h3>
                </div>
              </div>

              <div className="library-card-preview">
                {item.type === "note" ? (
                  <p className="library-note-content library-note-preview">
                    {item.content || "Empty note"}
                  </p>
                ) : (
                  <div className="library-list-preview">
                    {item.items.length === 0 ? (
                      <p className="library-list-empty">Empty list</p>
                    ) : (
                      <ul className="library-checklist library-checklist-full">
                        {item.items.map((checklistItem) => (
                          <li key={checklistItem.id}>
                            <label>
                              <input
                                type="checkbox"
                                checked={checklistItem.checked}
                                disabled={showArchive}
                                onChange={async () => {
                                  setItems(
                                    await toggleLibraryChecklistItem(
                                      item.id,
                                      checklistItem.id,
                                    ),
                                  );
                                }}
                              />

                              <span>{checklistItem.text}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              {!selectionMode && showArchive && (
                <div className="library-card-actions">
                  <button
                    type="button"
                    onClick={() => void handleRestore(item.id)}
                  >
                    Restore
                  </button>

                  <button
                    type="button"
                    className="library-permanent-delete"
                    onClick={() => void handlePermanentDelete(item.id)}
                  >
                    Delete permanently
                  </button>
                </div>
              )}
            </article>
          </LongPressSelectable>
        ))}
      </div>

      <ModalSheet
        open={newPickerOpen}
        tone="library"
        ariaLabel={
          createMode === "note"
            ? "New Library Note"
            : createMode === "list"
              ? "New Library List"
              : createMode === "folder"
                ? "New Library Folder"
                : "Create Library item"
        }
        onClose={closeNewItemFlow}
      >
        {createMode === null ? (
          <div className="library-new-picker">
            <div>
              <h2>New Library item</h2>

              <p>Choose what you want to create.</p>
            </div>

            <div className="library-new-options">
              <button type="button" onClick={() => beginCreate("note")}>
                <strong>Note</strong>
                <span>Write and keep reference text.</span>
              </button>

              <button type="button" onClick={() => beginCreate("list")}>
                <strong>List</strong>
                <span>Create a checklist you can use directly.</span>
              </button>

              <button type="button" onClick={() => beginCreate("folder")}>
                <strong>Folder</strong>
                <span>Organize Library items into another folder.</span>
              </button>
            </div>
          </div>
        ) : createMode === "folder" ? (
          <div className="library-quick-composer">
            <div className="library-quick-composer-heading">
              <strong>New Library Folder</strong>
            </div>

            <label>
              Folder name

              <input
                type="text"
                value={newFolderName}
                placeholder="Recipes"
                onChange={(event) => setNewFolderName(event.target.value)}
              />
            </label>

            <div className="library-quick-actions">
              <button type="button" onClick={closeNewItemFlow}>
                Cancel
              </button>

              <button
                type="button"
                className="library-quick-save"
                onClick={() => void handleCreateFolder()}
              >
                Create folder
              </button>
            </div>
          </div>
        ) : (
          <div className="library-quick-composer">
            <div className="library-quick-composer-heading">
              <strong>
                {createMode === "note"
                  ? "New Library Note"
                  : "New Library List"}
              </strong>
            </div>

            <label>
              Folder

              <select
                value={selectedFolderId}
                onChange={(event) =>
                  void handleFolderChange(event.target.value)
                }
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Title
              <span className="optional-label">optional</span>

              <input
                type="text"
                value={title}
                placeholder={
                  createMode === "note"
                    ? "Garden ideas"
                    : "Weekend shopping"
                }
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label>
              {createMode === "note" ? "Note" : "List items"}

              <textarea
                rows={8}
                value={content}
                placeholder={
                  createMode === "note"
                    ? "Write something..."
                    : "One item per line"
                }
                onChange={(event) => setContent(event.target.value)}
              />
            </label>

            <div className="library-quick-actions">
              <button type="button" onClick={closeNewItemFlow}>
                Cancel
              </button>

              <button
                type="button"
                className="library-quick-save"
                onClick={() =>
                  void (createMode === "note"
                    ? handleCreateNote()
                    : handleCreateList())
                }
              >
                Save to Library
              </button>
            </div>
          </div>
        )}
      </ModalSheet>

      <ModalSheet
        open={moveOpen}
        tone="library"
        ariaLabel="Move Library items"
        onClose={() => setMoveOpen(false)}
      >
        <div className="library-move-form">
          <div>
            <h2>
              Move {selectedItemIds.length}{" "}
              {selectedItemIds.length === 1 ? "item" : "items"}
            </h2>

            <p>Choose the folder these Library items should move to.</p>
          </div>

          <label>
            Folder

            <select
              value={moveFolderId}
              onChange={(event) => setMoveFolderId(event.target.value)}
            >
              {moveDestinationFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>

          {moveError && <p className="form-error">{moveError}</p>}

          <div className="library-move-actions">
            <button type="button" onClick={() => setMoveOpen(false)}>
              Cancel
            </button>

            <button
              type="button"
              className="library-move-confirm"
              disabled={!moveFolderId}
              onClick={() => void handleMove()}
            >
              Move
            </button>
          </div>
        </div>
      </ModalSheet>

      <ModalSheet
        open={editingItem !== null}
        tone="library"
        ariaLabel={
          editingItem ? `Edit ${editingItem.title}` : "Edit Library item"
        }
        onClose={closeItemEditor}
      >
        {editingItem && (
          <div className="library-edit-form">
            <div className="library-edit-heading">
              <span className="library-item-kind">
                {editingItem.type === "note" ? "Note" : "List"}
              </span>

              <h2>Edit {editingItem.type === "note" ? "note" : "list"}</h2>
            </div>

            <label>
              Title
              <input
                type="text"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
              />
            </label>

            <label>
              {editingItem.type === "note" ? "Note" : "List items"}

              <textarea
                value={editContent}
                rows={10}
                placeholder={
                  editingItem.type === "list"
                    ? "One item per line"
                    : "Write something..."
                }
                onChange={(event) => setEditContent(event.target.value)}
              />
            </label>

            {editingItem.type === "list" && (
              <p className="library-edit-hint">
                One item per line. Existing checked items keep their state where
                possible.
              </p>
            )}

            <div className="library-edit-actions">
              <button
                type="button"
                className="library-edit-archive"
                onClick={() => void handleArchiveEditingItem()}
              >
                Archive
              </button>

              <button type="button" onClick={closeItemEditor}>
                Cancel
              </button>

              <button
                type="button"
                className="library-edit-save"
                onClick={() => void handleSaveItemEdit()}
              >
                Save changes
              </button>
            </div>
          </div>
        )}
      </ModalSheet>

      <ModalSheet
        open={mergeOpen}
        tone="library"
        ariaLabel="Merge Library items"
        onClose={() => setMergeOpen(false)}
      >
        <div className="library-merge-form">
          <div>
            <h2>
              Merge {selectedItems.length}{" "}
              {selectedItems[0]?.type === "list" ? "lists" : "notes"}
            </h2>

            <p>
              The selected items will become one new Library{" "}
              {selectedItems[0]?.type === "list" ? "list" : "note"}.
            </p>
          </div>

          <label>
            Title
            <input
              type="text"
              value={mergeTitle}
              placeholder={
                selectedItems[0]?.type === "list"
                  ? "Merged list"
                  : "Merged note"
              }
              onChange={(event) => setMergeTitle(event.target.value)}
            />
          </label>

          <label>
            Folder
            <select
              value={mergeFolderId}
              onChange={(event) => setMergeFolderId(event.target.value)}
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="library-merge-options">
            <legend>Order</legend>

            <label>
              <input
                type="radio"
                name="merge-order"
                checked={mergeOrder === "oldest-first"}
                onChange={() => setMergeOrder("oldest-first")}
              />
              Oldest first
            </label>

            <label>
              <input
                type="radio"
                name="merge-order"
                checked={mergeOrder === "newest-first"}
                onChange={() => setMergeOrder("newest-first")}
              />
              Newest first
            </label>
          </fieldset>

          <fieldset className="library-merge-options">
            <legend>After merging</legend>

            <label>
              <input
                type="radio"
                name="merge-originals"
                checked={archiveMergeOriginals}
                onChange={() => setArchiveMergeOriginals(true)}
              />
              Archive original items
            </label>

            <label>
              <input
                type="radio"
                name="merge-originals"
                checked={!archiveMergeOriginals}
                onChange={() => setArchiveMergeOriginals(false)}
              />
              Keep original items
            </label>
          </fieldset>

          {mergeError && <p className="form-error">{mergeError}</p>}

          <div className="library-merge-actions">
            <button type="button" onClick={() => setMergeOpen(false)}>
              Cancel
            </button>

            <button
              type="button"
              className="library-merge-confirm"
              onClick={() => void handleMerge()}
            >
              Merge
            </button>
          </div>
        </div>
      </ModalSheet>
    </section>
  );
}

export default LibraryView;
