import { useMemo, useRef, useState } from "react";

import type { ReactNode } from "react";

import EntryCard from "./EntryCard";
import PeriodSummary from "./PeriodSummary";

import type { DaywardenEntry } from "../types/entry";

import type { EntryTypeDefinition } from "../types/entryType";

import {
  getISOWeekNumber,
  getLocalDateKey,
  getMonthWeeks,
  parseLocalDateKey,
} from "../utils/date";

import { buildEntryTypeSummaries } from "../utils/summary";

interface CalendarViewProps {
  entries: DaywardenEntry[];

  entryTypes: EntryTypeDefinition[];

  onEdit: (entry: DaywardenEntry) => void;

  onDelete: (entry: DaywardenEntry) => void;
}

interface LongPressButtonProps {
  children: ReactNode;

  className?: string;

  ariaLabel: string;

  onTap: () => void;

  onLongPress: () => void;
}

type SelectionKind = "day" | "week" | "multi";

const LONG_PRESS_MS = 550;

function LongPressButton({
  children,
  className,
  ariaLabel,
  onTap,
  onLongPress,
}: LongPressButtonProps) {
  const timerRef = useRef<number | null>(null);

  const longPressedRef = useRef(false);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);

      timerRef.current = null;
    }
  }

  function handlePointerDown() {
    longPressedRef.current = false;

    clearTimer();

    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true;

      onLongPress();
    }, LONG_PRESS_MS);
  }

  function handleClick() {
    if (longPressedRef.current) {
      longPressedRef.current = false;

      return;
    }

    onTap();
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onContextMenu={(event) => event.preventDefault()}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

function getMonthKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function parseMonthKey(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1, 12);
}

function formatShortDate(dateKey: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(parseLocalDateKey(dateKey));
}

function CalendarView({
  entries,
  entryTypes,
  onEdit,
  onDelete,
}: CalendarViewProps) {
  const currentMonthKey = getMonthKey(new Date());

  const availableMonthKeys = useMemo(() => {
    const monthKeys = new Set<string>([currentMonthKey]);

    for (const entry of entries) {
      monthKeys.add(getMonthKey(entry.createdAt));
    }

    return Array.from(monthKeys).sort((a, b) => b.localeCompare(a));
  }, [entries, currentMonthKey]);

  const [visibleMonthKey, setVisibleMonthKey] = useState(currentMonthKey);

  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const [selectionKind, setSelectionKind] = useState<SelectionKind>("day");

  const [multiSelect, setMultiSelect] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);

  const [showAllEntries, setShowAllEntries] = useState(false);

  const visibleMonth = parseMonthKey(visibleMonthKey);

  const year = visibleMonth.getFullYear();

  const month = visibleMonth.getMonth();

  const weeks = getMonthWeeks(year, month);

  const visibleMonthIndex = availableMonthKeys.indexOf(visibleMonthKey);

  const hasOlderMonth =
    visibleMonthIndex !== -1 &&
    visibleMonthIndex < availableMonthKeys.length - 1;

  const hasNewerMonth = visibleMonthIndex > 0;

  const selectedDateSet = useMemo(
    () => new Set(selectedDates),
    [selectedDates],
  );

  const selectedEntries = useMemo(() => {
    if (selectedDates.length === 0) {
      return [];
    }

    return entries
      .filter((entry) => selectedDateSet.has(getLocalDateKey(entry.createdAt)))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [entries, selectedDates, selectedDateSet]);

  const summaries = useMemo(
    () => buildEntryTypeSummaries(selectedEntries, entryTypes),
    [selectedEntries, entryTypes],
  );

  function openDay(date: Date) {
    const dateKey = getLocalDateKey(date);

    if (multiSelect) {
      toggleDate(dateKey);

      return;
    }

    setSelectedDates([dateKey]);

    setSelectionKind("day");

    setShowAllEntries(false);

    setSheetOpen(true);
  }

  function longPressDay(date: Date) {
    const dateKey = getLocalDateKey(date);

    setSheetOpen(false);
    setMultiSelect(true);

    setSelectionKind("multi");

    setSelectedDates((current) =>
      current.includes(dateKey) ? current : [...current, dateKey],
    );
  }

  function getWeekKeys(week: Date[]): string[] {
    return week.map(getLocalDateKey);
  }

  function openWeek(week: Date[]) {
    if (multiSelect) {
      toggleWeek(week);

      return;
    }

    setSelectedDates(getWeekKeys(week));

    setSelectionKind("week");

    setShowAllEntries(false);

    setSheetOpen(true);
  }

  function longPressWeek(week: Date[]) {
    const weekKeys = getWeekKeys(week);

    setSheetOpen(false);
    setMultiSelect(true);

    setSelectionKind("multi");

    setSelectedDates((current) =>
      Array.from(new Set([...current, ...weekKeys])),
    );
  }

  function toggleDate(dateKey: string) {
    setSelectedDates((current) =>
      current.includes(dateKey)
        ? current.filter((key) => key !== dateKey)
        : [...current, dateKey],
    );
  }

  function toggleWeek(week: Date[]) {
    const weekKeys = getWeekKeys(week);

    const allSelected = weekKeys.every((key) => selectedDateSet.has(key));

    setSelectedDates((current) => {
      if (allSelected) {
        return current.filter((key) => !weekKeys.includes(key));
      }

      return Array.from(new Set([...current, ...weekKeys]));
    });
  }

  function clearSelection() {
    setSelectedDates([]);
    setMultiSelect(false);
    setSheetOpen(false);
    setShowAllEntries(false);
  }

  function reviewSelection() {
    if (selectedDates.length === 0) {
      return;
    }

    setSelectionKind("multi");

    setShowAllEntries(false);

    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);

    if (!multiSelect) {
      setSelectedDates([]);
    }

    setShowAllEntries(false);
  }

  function goOlder() {
    if (!hasOlderMonth) {
      return;
    }

    const nextMonthKey = availableMonthKeys[visibleMonthIndex + 1];

    setVisibleMonthKey(nextMonthKey);

    clearSelection();
  }

  function goNewer() {
    if (!hasNewerMonth) {
      return;
    }

    const nextMonthKey = availableMonthKeys[visibleMonthIndex - 1];

    setVisibleMonthKey(nextMonthKey);

    clearSelection();
  }

  function goToday() {
    setVisibleMonthKey(currentMonthKey);

    clearSelection();
  }

  const sortedSelectedDates = [...selectedDates].sort();

  let sheetTitle = "";
  let sheetSubtitle = "";

  if (selectionKind === "day" && sortedSelectedDates.length === 1) {
    sheetTitle = new Intl.DateTimeFormat("en", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(parseLocalDateKey(sortedSelectedDates[0]));
  }

  if (selectionKind === "week" && sortedSelectedDates.length > 0) {
    const firstDate = parseLocalDateKey(sortedSelectedDates[0]);

    sheetTitle = `Week ${getISOWeekNumber(firstDate)}`;

    sheetSubtitle = `${formatShortDate(
      sortedSelectedDates[0],
    )} – ${formatShortDate(
      sortedSelectedDates[sortedSelectedDates.length - 1],
    )}`;
  }

  if (selectionKind === "multi") {
    sheetTitle = `${selectedDates.length} ${
      selectedDates.length === 1 ? "day" : "days"
    } selected`;

    if (sortedSelectedDates.length === 1) {
      sheetSubtitle = formatShortDate(sortedSelectedDates[0]);
    } else if (sortedSelectedDates.length > 1) {
      sheetSubtitle = `${formatShortDate(
        sortedSelectedDates[0],
      )} – ${formatShortDate(
        sortedSelectedDates[sortedSelectedDates.length - 1],
      )}`;
    }
  }

  const todayKey = getLocalDateKey(new Date());

  return (
    <section className="calendar-view">
      <div className="calendar-month-navigation">
        <button
          type="button"
          aria-label="Older month"
          disabled={!hasOlderMonth}
          onClick={goOlder}
        >
          ‹
        </button>

        <div className="calendar-month-title">
          <strong>
            {new Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
            }).format(visibleMonth)}
          </strong>

          {visibleMonthKey !== currentMonthKey && (
            <button
              type="button"
              className="calendar-today-button"
              onClick={goToday}
            >
              Today
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label="Newer month"
          disabled={!hasNewerMonth}
          onClick={goNewer}
        >
          ›
        </button>
      </div>

      {multiSelect && (
        <div className="calendar-selection-bar">
          <button
            className="selection-clear-button"
            type="button"
            aria-label="Clear selection"
            onClick={clearSelection}
          >
            ×
          </button>

          <strong>
            {selectedDates.length}{" "}
            {selectedDates.length === 1 ? "day selected" : "days selected"}
          </strong>

          <button
            className="selection-review-button"
            type="button"
            disabled={selectedDates.length === 0}
            onClick={reviewSelection}
          >
            Review
          </button>
        </div>
      )}

      <div className="calendar-help">
        Tap a day or week to inspect it. Long-press to select several.
      </div>

      <section className="calendar-month">
        <div className="calendar-week-header">
          <span className="week-label">W</span>

          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
          <span>S</span>
        </div>

        <div className="calendar-weeks">
          {weeks.map((week, weekIndex) => {
            const weekNumber = getISOWeekNumber(week[0]);

            return (
              <div
                className="calendar-week"
                key={`${visibleMonthKey}-${weekIndex}`}
              >
                <LongPressButton
                  className="week-number"
                  ariaLabel={`Week ${weekNumber}`}
                  onTap={() => openWeek(week)}
                  onLongPress={() => longPressWeek(week)}
                >
                  {weekNumber}
                </LongPressButton>

                {week.map((day) => {
                  const dateKey = getLocalDateKey(day);

                  const isSelected = selectedDateSet.has(dateKey);

                  const isToday = dateKey === todayKey;

                  const isCurrentMonth =
                    day.getMonth() === month && day.getFullYear() === year;

                  const classes = [
                    "calendar-day",

                    isSelected ? "selected" : "",

                    isToday ? "today" : "",

                    !isCurrentMonth ? "outside-month" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <LongPressButton
                      key={dateKey}
                      className={classes}
                      ariaLabel={new Intl.DateTimeFormat("en", {
                        weekday: "long",

                        day: "numeric",

                        month: "long",

                        year: "numeric",
                      }).format(day)}
                      onTap={() => openDay(day)}
                      onLongPress={() => longPressDay(day)}
                    >
                      {day.getDate()}
                    </LongPressButton>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {sheetOpen && (
        <div className="sheet-backdrop" onClick={closeSheet}>
          <section
            className="calendar-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />

            <div className="sheet-header">
              <div>
                <h2>{sheetTitle}</h2>

                {sheetSubtitle && <p>{sheetSubtitle}</p>}

                <span>
                  {selectedEntries.length}{" "}
                  {selectedEntries.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              <div className="sheet-header-actions">
                <button
                  className="sheet-export-button"
                  type="button"
                  disabled
                  title="Export will be added next"
                >
                  Export
                </button>

                <button
                  className="sheet-close-button"
                  type="button"
                  aria-label="Close"
                  onClick={closeSheet}
                >
                  ×
                </button>
              </div>
            </div>

            {selectedEntries.length === 0 && (
              <p className="sheet-empty-state">
                Nothing was recorded during this selection.
              </p>
            )}

            <PeriodSummary summaries={summaries} />

            {selectedEntries.length > 0 && (
              <>
                <button
                  className="view-all-entries-button"
                  type="button"
                  onClick={() => setShowAllEntries((current) => !current)}
                >
                  {showAllEntries ? "Hide entries" : "View all entries"}
                </button>

                {showAllEntries && (
                  <div className="sheet-entry-list">
                    {selectedEntries.map((entry) => {
                      const entryType = entryTypes.find(
                        (type) => type.id === entry.entryTypeId,
                      );

                      return (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          entryType={entryType}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default CalendarView;
