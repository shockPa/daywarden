import { useEffect, useState } from "react";

import {
  archiveLibraryItem,
  createLibraryFolder,
  createLibraryList,
  createLibraryNote,
  getLastLibraryFolderId,
  getLibraryFolders,
  getLibraryItems,
  permanentlyDeleteLibraryItem,
  restoreLibraryItem,
  saveLastLibraryFolderId,
  toggleLibraryChecklistItem,
} from "../data/libraryStorage";

import type { LibraryFolder, LibraryItem } from "../types/library";

import ModalSheet from "./ModalSheet";

import LongPressSelectable from "./LongPressSelectable";

import {
  mergeLibraryItems,
  type LibraryMergeOrder,
} from "../data/libraryStorage";

type CreateMode = "note" | "list" | "folder" | null;

function LibraryView() {
  const [folders, setFolders] = useState<LibraryFolder[]>([]);

  const [items, setItems] = useState<LibraryItem[]>([]);

  const [selectedFolderId, setSelectedFolderId] = useState("");

  const [createMode, setCreateMode] = useState<CreateMode>(null);

  const [showArchive, setShowArchive] = useState(false);

  const [title, setTitle] = useState("");

  const [content, setContent] = useState("");

  const [newFolderName, setNewFolderName] = useState("");

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const [mergeOpen, setMergeOpen] = useState(false);

  const [mergeTitle, setMergeTitle] = useState("");

  const [mergeFolderId, setMergeFolderId] = useState("");

  const [mergeOrder, setMergeOrder] =
    useState<LibraryMergeOrder>("oldest-first");

  const [archiveMergeOriginals, setArchiveMergeOriginals] = useState(true);

  const [mergeError, setMergeError] = useState("");

  const selectedItems = items.filter((item) =>
    selectedItemIds.includes(item.id),
  );

  const selectionMode = selectedItemIds.length > 0;

  const selectedTypes = new Set(selectedItems.map((item) => item.type));

  const canMerge =
    selectedItems.length >= 2 && selectedTypes.size === 1 && !showArchive;

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

    setMergeOpen(false);

    setMergeError("");
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

    return !item.archivedAt && item.folderId === selectedFolderId;
  });

  function resetComposer() {
    setCreateMode(null);
    setTitle("");
    setContent("");
    setNewFolderName("");
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

    resetComposer();
  }

  async function handleCreateList() {
    const lines = content.split("\n");

    if (!title.trim() && lines.every((line) => !line.trim())) {
      return;
    }

    const updated = await createLibraryList(selectedFolderId, title, lines);

    setItems(updated);

    resetComposer();
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

    resetComposer();
  }

  async function handleArchive(itemId: string) {
    setItems(await archiveLibraryItem(itemId));
    clearSelection();
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

            resetComposer();
          }}
        >
          {showArchive ? "Back to Library" : "Archive"}
        </button>
      </div>

      {!showArchive && (
        <>
          <div className="library-create-actions">
            <button type="button" onClick={() => setCreateMode("note")}>
              + Note
            </button>

            <button type="button" onClick={() => setCreateMode("list")}>
              + List
            </button>

            <button type="button" onClick={() => setCreateMode("folder")}>
              + Folder
            </button>
          </div>

          {createMode === "folder" && (
            <div className="library-composer">
              <label>
                Folder name
                <input
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                />
              </label>

              <div className="library-composer-actions">
                <button type="button" onClick={resetComposer}>
                  Cancel
                </button>

                <button type="button" onClick={() => void handleCreateFolder()}>
                  Create folder
                </button>
              </div>
            </div>
          )}

          {(createMode === "note" || createMode === "list") && (
            <div className="library-composer">
              <label>
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label>
                {createMode === "note" ? "Note" : "List items"}

                <textarea
                  value={content}
                  placeholder={
                    createMode === "list"
                      ? "One item per line"
                      : "Write something..."
                  }
                  rows={7}
                  onChange={(event) => setContent(event.target.value)}
                />
              </label>

              <div className="library-composer-actions">
                <button type="button" onClick={resetComposer}>
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void (createMode === "note"
                      ? handleCreateNote()
                      : handleCreateList())
                  }
                >
                  Save
                </button>
              </div>
            </div>
          )}
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

          <button
            type="button"
            className="library-merge-button"
            disabled={!canMerge}
            onClick={handleOpenMerge}
          >
            Merge
          </button>
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
            <article className="library-card">
              <div className="library-card-header">
                <div>
                  <span className="library-item-kind">
                    {item.type === "note" ? "Note" : "List"}
                  </span>

                  <h3>{item.title}</h3>
                </div>
              </div>

              {item.type === "note" ? (
                <p className="library-note-content">{item.content}</p>
              ) : (
                <ul className="library-checklist">
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
              {!selectionMode && (
                <div className="library-card-actions">
                  {showArchive ? (
                    <>
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
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleArchive(item.id)}
                    >
                      Archive
                    </button>
                  )}
                </div>
              )}
            </article>
          </LongPressSelectable>
        ))}
      </div>
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
