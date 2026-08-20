import { useEffect, useState } from "react";

import "./App.css";

import Spark from "./components/decor/Spark";
import Doodle from "./components/decor/Doodle";

import CreateEntryTypeForm from "./components/CreateEntryTypeForm";
import DynamicEntryForm from "./components/DynamicEntryForm";
import EntryTypeManager from "./components/EntryTypeManager";
import EntryTypePicker from "./components/EntryTypePicker";
import TodayEntries from "./components/TodayEntries";

import { builtInEntryTypes } from "./data/builtInEntryTypes";
import CalendarView from "./components/CalendarView";

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
import Timeline from "./components/Timeline";

import { useRegisterSW } from "virtual:pwa-register/react";

import SettingsView from "./components/SettingsView";

import {
  getLastUpdateCheck,
  getThemeMode,
  saveLastUpdateCheck,
  saveThemeMode,
} from "./data/settingsStorage";

import type { ThemeMode } from "./types/settings";

import {
  combineLocalDateAndTime,
  getLocalDateKey,
  getLocalTimeValue,
} from "./utils/date";

import ActiveTimersPanel from "./components/ActiveTimersPanel";

import {
  finishActiveTimer,
  getActiveTimers,
  startActiveTimer,
} from "./data/activeTimerStorage";

import type { ActiveTimer } from "./types/timer";

import type { TimerValue } from "./types/entryType";

import LibraryView from "./components/LibraryView";

import LibraryQuickCapture, {
  type LibraryCaptureMode,
} from "./components/LibraryQuickCapture";

import ModalSheet from "./components/ModalSheet";

import { createId } from "./utils/id";

type ViewMode = "today" | "calendar" | "log" | "library";

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

  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);

  async function handleStopTimer(timer: ActiveTimer, openEditor = true) {
    const endedAt = new Date().toISOString();

    const timerValue: TimerValue = {
      startedAt: timer.startedAt,

      endedAt,
    };

    const entry: DaywardenEntry = {
      id: createId(),

      entryTypeId: timer.entryTypeId,

      entryTypeName: timer.entryTypeName,

      /*
       * The activity belongs to the
       * date/time when it started.
       */
      createdAt: timer.startedAt,

      values: {
        [timer.fieldId]: timerValue,
      },
    };

    const result = await finishActiveTimer(timer.id, entry);
    setEntries(result.entries);

    setActiveTimers(result.activeTimers);

    if (openEditor) {
      handleEditEntry(entry);
    }
  }

  async function handleStopAllTimers() {
    const timersToStop = [...activeTimers];

    for (const timer of timersToStop) {
      await handleStopTimer(timer, false);
    }
  }

  const [activeView, setActiveView] = useState<ViewMode>("today");

  function handleNavigate(view: ViewMode) {
    setActiveView(view);

    setManagingEntryTypes(false);
    setCreatingEntryType(false);
    setEditingEntry(null);
    setEditingDate("");
    setEditingTime("");
    setSelectedEntryType(null);
    setLibraryCaptureMode(null);
  }

  const [entries, setEntries] = useState<DaywardenEntry[]>([]);

  const [selectedEntryType, setSelectedEntryType] =
    useState<EntryTypeDefinition | null>(null);

  const [creatingEntryType, setCreatingEntryType] = useState(false);

  const [managingEntryTypes, setManagingEntryTypes] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<
    ServiceWorkerRegistration | undefined
  >(undefined);

  const [offlineCapable, setOfflineCapable] = useState(false);

  const [checkingForUpdates, setCheckingForUpdates] = useState(false);

  const [lastUpdateCheck, setLastUpdateCheck] = useState<string | null>(null);

  const [updateMessage, setUpdateMessage] = useState("");

  const {
    offlineReady: [offlineReady],

    needRefresh: [needRefresh],

    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_serviceWorkerUrl, registration) {
      setServiceWorkerRegistration(registration);

      if (registration?.active) {
        setOfflineCapable(true);
      }
    },

    onRegisterError(error) {
      console.error("Daywarden service worker registration failed:", error);
    },
  });

  useEffect(() => {
    async function loadData() {
      const [
        savedCustomEntryTypes,
        savedPreferences,
        savedEntries,
        savedThemeMode,
        savedLastUpdateCheck,
        savedActiveTimers,
      ] = await Promise.all([
        getCustomEntryTypes(),
        getEntryTypePreferences(),
        getEntries(),
        getThemeMode(),
        getLastUpdateCheck(),
        getActiveTimers(),
      ]);

      setActiveTimers(savedActiveTimers);

      setCustomEntryTypes(savedCustomEntryTypes);

      setPreferences(savedPreferences);

      setEntries(savedEntries);

      setThemeMode(savedThemeMode);

      setLastUpdateCheck(savedLastUpdateCheck);
    }

    loadData();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.ready
      .then(() => {
        setOfflineCapable(true);
      })
      .catch(() => {
        setOfflineCapable(false);
      });
  }, []);

  const [libraryCaptureMode, setLibraryCaptureMode] =
    useState<LibraryCaptureMode>(null);

  async function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);

    await saveThemeMode(mode);
  }

  async function handleCheckForUpdates() {
    setCheckingForUpdates(true);

    setUpdateMessage("");

    try {
      if (!navigator.onLine) {
        setUpdateMessage(
          "You're offline. Connect to the internet to check for updates.",
        );

        return;
      }

      const registration =
        serviceWorkerRegistration ??
        (await navigator.serviceWorker.getRegistration());

      if (!registration) {
        setUpdateMessage("The offline service is not ready yet.");

        return;
      }

      await registration.update();

      const checkedAt = new Date().toISOString();

      setLastUpdateCheck(checkedAt);

      await saveLastUpdateCheck(checkedAt);

      setUpdateMessage("Update check complete.");
    } catch {
      setUpdateMessage("Daywarden couldn't check for updates.");
    } finally {
      setCheckingForUpdates(false);
    }
  }

  function handleInstallUpdate() {
    void updateServiceWorker(true);
  }

  /*
   * Include archived definitions here
   * because old entries may still need them.
   */

  const [editingEntry, setEditingEntry] = useState<DaywardenEntry | null>(null);

  const [editingDate, setEditingDate] = useState("");

  const [editingTime, setEditingTime] = useState("");

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

  async function handleSelectEntryType(entryType: EntryTypeDefinition) {
    const timerField = entryType.fields.find((field) => field.type === "timer");

    setLibraryCaptureMode(null);

    /*
     * Timer Entry Types behave
     * differently:
     *
     * tapping the main button starts
     * them immediately.
     */
    if (timerField) {
      const alreadyRunning = activeTimers.some(
        (timer) => timer.entryTypeId === entryType.id,
      );

      if (alreadyRunning) {
        return;
      }

      const timer: ActiveTimer = {
        id: createId(),

        entryTypeId: entryType.id,

        entryTypeName: entryType.name,

        fieldId: timerField.id,

        startedAt: new Date().toISOString(),
      };

      const updatedTimers = await startActiveTimer(timer);

      setActiveTimers(updatedTimers);

      setCreatingEntryType(false);

      setEditingEntry(null);

      setSelectedEntryType(null);

      return;
    }

    /*
     * Normal Entry Type behavior.
     */
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
    setLibraryCaptureMode(null);
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

    const hasTimer = entryType.fields.some((field) => field.type === "timer");

    if (hasTimer) {
      /*
       * Timer Entry Types should not
       * open a form immediately after
       * being created.
       *
       * The user starts the timer by
       * tapping its Today button.
       */
      setSelectedEntryType(null);
    } else {
      setSelectedEntryType(entryType);
    }
  }

  async function handleSaveEntry(values: EntryValues) {
    if (!selectedEntryType) {
      return;
    }

    const isTimerEntry = selectedEntryType.fields.some(
      (field) => field.type === "timer",
    );

    if (editingEntry) {
      const updatedEntry: DaywardenEntry = {
        ...editingEntry,

        entryTypeId: selectedEntryType.id,

        entryTypeName: selectedEntryType.name,

        createdAt: isTimerEntry
          ? editingEntry.createdAt
          : combineLocalDateAndTime(editingDate, editingTime),
        values,
      };

      const updatedEntries = await updateEntry(updatedEntry);

      setEntries(updatedEntries);
    } else {
      const entry: DaywardenEntry = {
        id: createId(),

        entryTypeId: selectedEntryType.id,

        entryTypeName: selectedEntryType.name,

        createdAt: new Date().toISOString(),

        values,
      };

      const updatedEntries = await addEntry(entry);

      setEntries(updatedEntries);
    }

    setEditingEntry(null);

    setEditingDate("");
    setEditingTime("");

    setSelectedEntryType(null);
  }

  function handleEditEntry(entry: DaywardenEntry) {
    const entryType = allEntryTypeDefinitions.find(
      (type) => type.id === entry.entryTypeId,
    );

    if (!entryType) {
      return;
    }
    setActiveView("today");

    setCreatingEntryType(false);
    setManagingEntryTypes(false);

    setEditingEntry(entry);

    setEditingDate(getLocalDateKey(entry.createdAt));

    setEditingTime(getLocalTimeValue(entry.createdAt));

    setSelectedEntryType(entryType);

    setLibraryCaptureMode(null);
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
          <div className="daywarden-brand">
            <div className="daywarden-logo">Daywarden</div>

            <Doodle
              variant={
                activeView === "today"
                  ? "loop"
                  : activeView === "calendar"
                    ? "arch-loop"
                    : activeView === "log"
                      ? "curl"
                      : "squiggle"
              }
              className={`daywarden-header-doodle daywarden-header-doodle-${activeView}`}
            />
          </div>

          <button
            className="settings-button"
            type="button"
            aria-label="Settings"
            onClick={() => {
              setSelectedEntryType(null);

              setCreatingEntryType(false);

              setManagingEntryTypes(false);

              setSettingsOpen(true);
            }}
          >
            ⚙
          </button>
        </div>

        {activeView === "today" && <p className="date">{today}</p>}

        <h1>
          {activeView === "today" && "What did you do today?"}

          {activeView === "log" && "Log"}

          {activeView === "calendar" && "Calendar"}

          {activeView === "library" && "Library"}
        </h1>
      </header>

      {settingsOpen ? (
        <SettingsView
          themeMode={themeMode}
          offlineReady={offlineCapable || offlineReady}
          needRefresh={needRefresh}
          checkingForUpdates={checkingForUpdates}
          lastUpdateCheck={lastUpdateCheck}
          updateMessage={updateMessage}
          onThemeChange={handleThemeChange}
          onCheckForUpdates={handleCheckForUpdates}
          onInstallUpdate={handleInstallUpdate}
          onManageEntryTypes={() => {
            setSettingsOpen(false);
            setManagingEntryTypes(true);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      ) : managingEntryTypes ? (
        <EntryTypeManager
          entryTypes={orderedEntryTypes}
          removedCustomEntryTypes={removedCustomEntryTypes}
          hiddenIds={preferences.hiddenIds}
          onToggleHidden={handleToggleHidden}
          onMove={handleMove}
          onRemove={handleRemove}
          onRestore={handleRestore}
          onClose={() => {
            setManagingEntryTypes(false);
            setSettingsOpen(true);
          }}
        />
      ) : (
        <>
          {activeView === "today" && (
            <>
              <ActiveTimersPanel
                timers={activeTimers}
                onStop={handleStopTimer}
                onStopAll={handleStopAllTimers}
              />
              <EntryTypePicker
                entryTypes={visibleEntryTypes}
                selectedEntryTypeId={selectedEntryType?.id ?? null}
                activeTimerEntryTypeIds={activeTimers.map(
                  (timer) => timer.entryTypeId,
                )}
                onSelect={handleSelectEntryType}
              />

              <LibraryQuickCapture
                mode={libraryCaptureMode}
                onOpen={(mode) => {
                  setCreatingEntryType(false);

                  setEditingEntry(null);

                  setEditingDate("");
                  setEditingTime("");

                  setSelectedEntryType(null);

                  setLibraryCaptureMode(mode);
                }}
                onClose={() => setLibraryCaptureMode(null)}
              />

              <button
                className="create-entry-type"
                type="button"
                onClick={handleCreateEntryType}
              >
                + Create your own
              </button>

              {creatingEntryType && (
                <ModalSheet
                  open={creatingEntryType}
                  ariaLabel="Create entry type"
                  onClose={() => setCreatingEntryType(false)}
                >
                  {creatingEntryType && (
                    <CreateEntryTypeForm
                      onSave={handleSaveEntryType}
                      onCancel={() => setCreatingEntryType(false)}
                    />
                  )}
                </ModalSheet>
              )}

              {selectedEntryType && (
                <ModalSheet
                  open={selectedEntryType !== null}
                  ariaLabel={
                    editingEntry
                      ? `Edit ${selectedEntryType?.name ?? "entry"}`
                      : `New ${selectedEntryType?.name ?? "entry"}`
                  }
                  onClose={() => {
                    setEditingEntry(null);

                    setEditingDate("");
                    setEditingTime("");

                    setSelectedEntryType(null);
                  }}
                >
                  {selectedEntryType && (
                    <DynamicEntryForm
                      key={editingEntry?.id ?? selectedEntryType.id}
                      entryType={selectedEntryType}
                      initialValues={editingEntry?.values}
                      submitLabel={editingEntry ? "Save changes" : "Save entry"}
                      entryDate={editingEntry ? editingDate : undefined}
                      entryTime={editingEntry ? editingTime : undefined}
                      onEntryDateChange={
                        editingEntry ? setEditingDate : undefined
                      }
                      onEntryTimeChange={
                        editingEntry ? setEditingTime : undefined
                      }
                      onSave={handleSaveEntry}
                      onClose={() => {
                        setEditingEntry(null);

                        setEditingDate("");
                        setEditingTime("");

                        setSelectedEntryType(null);
                      }}
                    />
                  )}
                </ModalSheet>
              )}

              <TodayEntries
                entries={entries}
                entryTypes={allEntryTypeDefinitions}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
              />
            </>
          )}

          {activeView === "log" && (
            <Timeline
              entries={entries}
              entryTypes={allEntryTypeDefinitions}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />
          )}

          {activeView === "calendar" && (
            <CalendarView
              entries={entries}
              entryTypes={allEntryTypeDefinitions}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />
          )}

          {activeView === "library" && <LibraryView />}
        </>
      )}

      {!settingsOpen && !managingEntryTypes && (
        <nav className="navigation">
          <button
            className={activeView === "today" ? "nav-active" : ""}
            type="button"
            onClick={() => handleNavigate("today")}
          >
            <span className="nav-today-label">
              {activeView === "today" && (
                <Spark variant="three" className="nav-today-spark" />
              )}
              Today
            </span>
          </button>

          <button
            className={activeView === "calendar" ? "nav-active" : ""}
            type="button"
            onClick={() => handleNavigate("calendar")}
          >
            Calendar
          </button>

          <button
            className={activeView === "log" ? "nav-active" : ""}
            type="button"
            onClick={() => handleNavigate("log")}
          >
            Log
          </button>

          <button
            className={
              activeView === "library"
                ? "nav-active library-nav-button"
                : "library-nav-button"
            }
            type="button"
            onClick={() => handleNavigate("library")}
          >
            Library
          </button>
        </nav>
      )}
    </main>
  );
}

export default App;
