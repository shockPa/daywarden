import { useEffect, useState } from "react";

import {
  createLibraryList,
  createLibraryNote,
  getLastLibraryFolderId,
  getLibraryFolders,
  saveLastLibraryFolderId,
} from "../data/libraryStorage";

import type { LibraryFolder } from "../types/library";

import ModalSheet from "./ModalSheet";

export type LibraryCaptureMode = "note" | "list" | null;

interface LibraryQuickCaptureProps {
  mode: LibraryCaptureMode;

  onOpen: (mode: Exclude<LibraryCaptureMode, null>) => void;

  onClose: () => void;
}

function LibraryQuickCapture({
  mode,
  onOpen,
  onClose,
}: LibraryQuickCaptureProps) {
  const [folders, setFolders] = useState<LibraryFolder[]>([]);

  const [selectedFolderId, setSelectedFolderId] = useState("");

  const [title, setTitle] = useState("");

  const [content, setContent] = useState("");

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadFolders() {
      const [savedFolders, lastFolderId] = await Promise.all([
        getLibraryFolders(),
        getLastLibraryFolderId(),
      ]);

      setFolders(savedFolders);

      setSelectedFolderId(lastFolderId);
    }

    void loadFolders();
  }, []);

  function clearComposer() {
    setTitle("");
    setContent("");
  }

  function handleClose() {
    clearComposer();

    onClose();
  }

  async function handleFolderChange(folderId: string) {
    setSelectedFolderId(folderId);

    await saveLastLibraryFolderId(folderId);
  }

  async function handleSave() {
    if (!selectedFolderId) {
      setMessage("Choose a Library folder.");

      return;
    }

    if (!title.trim() && !content.trim()) {
      setMessage(
        mode === "note"
          ? "Write something before saving."
          : "Add at least one list item.",
      );

      return;
    }

    setSaving(true);

    setMessage("");

    try {
      if (mode === "note") {
        await createLibraryNote(selectedFolderId, title, content);
      }

      if (mode === "list") {
        await createLibraryList(selectedFolderId, title, content.split("\n"));
      }

      const folder = folders.find(
        (candidate) => candidate.id === selectedFolderId,
      );

      setMessage(`Saved to ${folder?.name ?? "Library"}.`);

      clearComposer();

      onClose();
    } catch {
      setMessage("Daywarden couldn't save this Library item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="library-quick-capture">
      <div className="library-quick-heading">
        <span>Library</span>

        <small>Keep, don't log</small>
      </div>

      <div className="library-capture-actions">
        <button
          type="button"
          className={
            mode === "note"
              ? "library-capture-button active"
              : "library-capture-button"
          }
          onClick={() => onOpen("note")}
        >
          <span aria-hidden="true" className="library-capture-icon">
            ▤
          </span>
          Library Note
        </button>

        <button
          type="button"
          className={
            mode === "list"
              ? "library-capture-button active"
              : "library-capture-button"
          }
          onClick={() => onOpen("list")}
        >
          <span aria-hidden="true" className="library-capture-icon">
            ☑
          </span>
          Library List
        </button>
      </div>

      {mode && (
        <ModalSheet
          open={mode !== null}
          tone="library"
          ariaLabel={mode === "list" ? "New Library List" : "New Library Note"}
          onClose={handleClose}
        >
          {mode && (
            <div className="library-quick-composer">
              <div className="library-quick-composer-heading">
                <strong>
                  {mode === "note" ? "New Library Note" : "New Library List"}
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
                    mode === "note" ? "Garden ideas" : "Weekend shopping"
                  }
                  onChange={(event) => {
                    setTitle(event.target.value);

                    setMessage("");
                  }}
                />
              </label>

              <label>
                {mode === "note" ? "Note" : "List items"}

                <textarea
                  rows={8}
                  value={content}
                  placeholder={
                    mode === "note" ? "Write something..." : "One item per line"
                  }
                  onChange={(event) => {
                    setContent(event.target.value);

                    setMessage("");
                  }}
                />
              </label>

              <div className="library-quick-actions">
                <button type="button" onClick={handleClose}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="library-quick-save"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Saving..." : "Save to Library"}
                </button>
              </div>
            </div>
          )}
        </ModalSheet>
      )}

      {message && (
        <p className="library-capture-message" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  );
}

export default LibraryQuickCapture;
