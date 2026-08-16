import { useEffect, useState } from "react";

import "./App.css";

import CreateEntryTypeForm from "./components/CreateEntryTypeForm";
import DynamicEntryForm from "./components/DynamicEntryForm";
import EntryTypeManager from "./components/EntryTypeManager";
import EntryTypePicker from "./components/EntryTypePicker";
import TodayEntries from "./components/TodayEntries";

import { builtInEntryTypes } from "./data/builtInEntryTypes";

import {
  addCustomEntryType,
  archiveCustomEntryType,
  getCustomEntryTypes,
  restoreCustomEntryType,
} from "./data/entryTypeStorage";

import {
  getEntryTypePreferences,
  saveEntryTypePreferences,
} from "./data/entryTypePreferencesStorage";

import {
  addEntry,
  deleteEntry,
  getEntries,
  updateEntry,
} from "./data/entryStorage";

import type { DaywardenEntry } from "./types/entry";

import type {
  EntryTypeDefinition,
  EntryTypePreferences,
  EntryValues,
} from "./types/entryType";

function orderEntryTypes(
  entryTypes: EntryTypeDefinition[],
  order: string[],
): EntryTypeDefinition[] {
  const orderMap = new Map(order.map((id, index) => [id, index]));

  return [...entryTypes].sort((a, b) => {
    const aIndex = orderMap.get(a.id);

    const bIndex = orderMap.get(b.id);

    if (aIndex === undefined && bIndex === undefined) {
      return 0;
    }

    if (aIndex === undefined) {
      return 1;
    }

    if (bIndex === undefined) {
      return -1;
    }

    return aIndex - bIndex;
  });
}

function App() {
  const [customEntryTypes, setCustomEntryTypes] = useState<
    EntryTypeDefinition[]
  >([]);

  const [preferences, setPreferences] = useState<EntryTypePreferences>({
    order: [],
    hiddenIds: [],
  });

  const [entries, setEntries] = useState<DaywardenEntry[]>([]);

  const [selectedEntryType, setSelectedEntryType] =
    useState<EntryTypeDefinition | null>(null);

  const [creatingEntryType, setCreatingEntryType] = useState(false);

  const [managingEntryTypes, setManagingEntryTypes] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [savedCustomEntryTypes, savedPreferences, savedEntries] =
        await Promise.all([
          getCustomEntryTypes(),
          getEntryTypePreferences(),
          getEntries(),
        ]);

      setCustomEntryTypes(savedCustomEntryTypes);

      setPreferences(savedPreferences);

      setEntries(savedEntries);
    }

    loadData();
  }, []);

  /*
   * Include archived definitions here
   * because old entries may still need them.
   */

  const [editingEntry, setEditingEntry] = useState<DaywardenEntry | null>(null);

  const allEntryTypeDefinitions = [...builtInEntryTypes, ...customEntryTypes];

  const activeCustomEntryTypes = customEntryTypes.filter(
    (entryType) => !entryType.archived,
  );

  const removedCustomEntryTypes = customEntryTypes.filter(
    (entryType) => entryType.archived,
  );

  const activeEntryTypes = [...builtInEntryTypes, ...activeCustomEntryTypes];

  const orderedEntryTypes = orderEntryTypes(
    activeEntryTypes,
    preferences.order,
  );

  const visibleEntryTypes = orderedEntryTypes.filter(
    (entryType) => !preferences.hiddenIds.includes(entryType.id),
  );

  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  function handleSelectEntryType(entryType: EntryTypeDefinition) {
    setCreatingEntryType(false);
    setManagingEntryTypes(false);
    setEditingEntry(null);

    setSelectedEntryType(entryType);
  }

  function handleCreateEntryType() {
    setSelectedEntryType(null);
    setManagingEntryTypes(false);
    setEditingEntry(null);
    setCreatingEntryType(true);
  }

  async function handleSaveEntryType(entryType: EntryTypeDefinition) {
    const updated = await addCustomEntryType(entryType);

    setCustomEntryTypes(updated);

    /*
     * Put a newly created type
     * at the end of the current order.
     */
    const updatedPreferences = {
      ...preferences,

      order: [...orderedEntryTypes.map((type) => type.id), entryType.id],
    };

    setPreferences(updatedPreferences);

    await saveEntryTypePreferences(updatedPreferences);

    setCreatingEntryType(false);

    setSelectedEntryType(entryType);
  }

  async function handleSaveEntry(values: EntryValues) {
    if (!selectedEntryType) {
      return;
    }

    if (editingEntry) {
      const updatedEntry: DaywardenEntry = {
        ...editingEntry,

        entryTypeId: selectedEntryType.id,

        entryTypeName: selectedEntryType.name,

        values,
      };

      const updatedEntries = await updateEntry(updatedEntry);

      setEntries(updatedEntries);
    } else {
      const entry: DaywardenEntry = {
        id: crypto.randomUUID(),

        entryTypeId: selectedEntryType.id,

        entryTypeName: selectedEntryType.name,

        createdAt: new Date().toISOString(),

        values,
      };

      const updatedEntries = await addEntry(entry);

      setEntries(updatedEntries);
    }

    setEditingEntry(null);
    setSelectedEntryType(null);
  }

  function handleEditEntry(entry: DaywardenEntry) {
    const entryType = allEntryTypeDefinitions.find(
      (type) => type.id === entry.entryTypeId,
    );

    if (!entryType) {
      return;
    }

    setCreatingEntryType(false);
    setManagingEntryTypes(false);

    setEditingEntry(entry);

    setSelectedEntryType(entryType);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDeleteEntry(entry: DaywardenEntry) {
    const confirmed = window.confirm(
      `Delete this ${entry.entryTypeName} entry?`,
    );

    if (!confirmed) {
      return;
    }

    const updatedEntries = await deleteEntry(entry.id);

    setEntries(updatedEntries);

    if (editingEntry?.id === entry.id) {
      setEditingEntry(null);
      setSelectedEntryType(null);
    }
  }

  async function handleToggleHidden(entryTypeId: string) {
    const currentlyHidden = preferences.hiddenIds.includes(entryTypeId);

    const hiddenIds = currentlyHidden
      ? preferences.hiddenIds.filter((id) => id !== entryTypeId)
      : [...preferences.hiddenIds, entryTypeId];

    const updatedPreferences = {
      ...preferences,
      hiddenIds,
    };

    setPreferences(updatedPreferences);

    await saveEntryTypePreferences(updatedPreferences);
  }

  async function handleMove(entryTypeId: string, direction: -1 | 1) {
    const ids = orderedEntryTypes.map((entryType) => entryType.id);

    const currentIndex = ids.indexOf(entryTypeId);

    if (currentIndex === -1) {
      return;
    }

    const targetIndex = currentIndex + direction;

    if (targetIndex < 0 || targetIndex >= ids.length) {
      return;
    }

    const reordered = [...ids];

    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];

    const updatedPreferences = {
      ...preferences,
      order: reordered,
    };

    setPreferences(updatedPreferences);

    await saveEntryTypePreferences(updatedPreferences);
  }

  async function handleRemove(entryTypeId: string) {
    const updated = await archiveCustomEntryType(entryTypeId);

    setCustomEntryTypes(updated);

    const updatedPreferences = {
      ...preferences,

      order: preferences.order.filter((id) => id !== entryTypeId),

      hiddenIds: preferences.hiddenIds.filter((id) => id !== entryTypeId),
    };

    setPreferences(updatedPreferences);

    await saveEntryTypePreferences(updatedPreferences);

    if (selectedEntryType?.id === entryTypeId) {
      setSelectedEntryType(null);
    }
  }

  async function handleRestore(entryTypeId: string) {
    const updated = await restoreCustomEntryType(entryTypeId);

    setCustomEntryTypes(updated);

    const updatedPreferences = {
      ...preferences,

      order: [
        ...orderedEntryTypes.map((entryType) => entryType.id),

        entryTypeId,
      ],
    };

    setPreferences(updatedPreferences);

    await saveEntryTypePreferences(updatedPreferences);
  }

  return (
    <main className="app">
      <header className="header">
        <div className="top-bar">
          <div className="daywarden-logo">Daywarden</div>

          <button
            className="settings-button"
            type="button"
            aria-label="Manage entry types"
            onClick={() => {
              setSelectedEntryType(null);

              setCreatingEntryType(false);

              setManagingEntryTypes((current) => !current);
            }}
          >
            ⚙
          </button>
        </div>

        <p className="date">{today}</p>

        <h1>What did you do today?</h1>
      </header>

      {managingEntryTypes ? (
        <EntryTypeManager
          entryTypes={orderedEntryTypes}
          removedCustomEntryTypes={removedCustomEntryTypes}
          hiddenIds={preferences.hiddenIds}
          onToggleHidden={handleToggleHidden}
          onMove={handleMove}
          onRemove={handleRemove}
          onRestore={handleRestore}
          onClose={() => setManagingEntryTypes(false)}
        />
      ) : (
        <>
          <EntryTypePicker
            entryTypes={visibleEntryTypes}
            selectedEntryTypeId={selectedEntryType?.id ?? null}
            onSelect={handleSelectEntryType}
          />

          <button
            className="create-entry-type"
            type="button"
            onClick={handleCreateEntryType}
          >
            + Create your own
          </button>

          {creatingEntryType && (
            <CreateEntryTypeForm
              onSave={handleSaveEntryType}
              onCancel={() => setCreatingEntryType(false)}
            />
          )}

          {selectedEntryType && (
            <DynamicEntryForm
              key={editingEntry?.id ?? selectedEntryType.id}
              entryType={selectedEntryType}
              initialValues={editingEntry?.values}
              submitLabel={editingEntry ? "Save changes" : "Save entry"}
              onSave={handleSaveEntry}
              onClose={() => {
                setEditingEntry(null);

                setSelectedEntryType(null);
              }}
            />
          )}

          <TodayEntries
            entries={entries}
            entryTypes={allEntryTypeDefinitions}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
          />
        </>
      )}

      <nav className="navigation">
        <button className="nav-active">Today</button>

        <button>Calendar</button>

        <button>Log</button>

        <button>Search</button>
      </nav>
    </main>
  );
}

export default App;
