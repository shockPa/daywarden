import { useEffect, useMemo, useRef, useState } from "react";

import type { ReactNode } from "react";

import EntryCard from "./EntryCard";
import PeriodSummary from "./PeriodSummary";
import ModalSheet from "./ModalSheet";

import type { DaywardenEntry } from "../types/entry";

import type {
  ColorDirection,
  DurationValue,
  EntryFieldDefinition,
  EntryTypeDefinition,
  TimeRangeValue,
  TimerValue,
} from "../types/entryType";

import { getFaceOption } from "../utils/faces";

import {
  getCalendarLensEntryTypeIds,
  saveCalendarLensEntryTypeIds,
} from "../data/settingsStorage";

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

  addableEntryTypes: EntryTypeDefinition[];

  onAddEntry: (entryType: EntryTypeDefinition, dateKey: string) => void;

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

type SelectionKind = "day" | "week" | "month" | "multi";

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

type LensMetric =
  | {
      kind: "scale";
      fieldId: string;
      label: string;
      value: number;
      colorDirection: ColorDirection;
    }
  | {
      kind: "face";
      fieldId: string;
      label: string;
      face: string;
      faceLabel: string;
    }
  | {
      kind: "text";
      fieldId: string;
      label: string;
      value: string;
    };

interface CalendarLensVisualizationProps {
  entryType: EntryTypeDefinition;
  entries: DaywardenEntry[];
  compact?: boolean;
  maxMetrics?: number;
}

function isDurationValue(value: unknown): value is DurationValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "hours" in value &&
    "minutes" in value &&
    typeof value.hours === "number" &&
    typeof value.minutes === "number"
  );
}

function isTimeRangeValue(value: unknown): value is TimeRangeValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "start" in value &&
    "end" in value &&
    typeof value.start === "string" &&
    typeof value.end === "string"
  );
}

function isTimerValue(value: unknown): value is TimerValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "startedAt" in value &&
    "endedAt" in value &&
    typeof value.startedAt === "string" &&
    typeof value.endedAt === "string"
  );
}

function durationToMinutes(value: DurationValue): number {
  return Math.max(0, value.hours * 60 + value.minutes);
}

function timeRangeToMinutes(value: TimeRangeValue): number {
  if (!value.start || !value.end) {
    return 0;
  }

  const [startHour, startMinute] = value.start.split(":").map(Number);
  const [endHour, endMinute] = value.end.split(":").map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return 0;
  }

  const start = startHour * 60 + startMinute;

  let end = endHour * 60 + endMinute;

  if (end < start) {
    end += 24 * 60;
  }

  return Math.max(0, end - start);
}

function timerToMinutes(value: TimerValue): number {
  const start = new Date(value.startedAt).getTime();
  const end = new Date(value.endedAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return Math.max(0, Math.round((end - start) / 60_000));
}

function formatMinutes(totalMinutes: number): string {
  const roundedMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  }

  return `${hours} ${hours === 1 ? "hr" : "hrs"} ${minutes} min`;
}

function summarizeNumbers(
  values: number[],
  field: EntryFieldDefinition,
): number | null {
  if (values.length === 0) {
    return null;
  }

  switch (field.summaryMode) {
    case "sum":
      return values.reduce((sum, value) => sum + value, 0);

    case "count":
      return values.length;

    case "average":
    default:
      return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}

function getScaleColor(value: number, colorDirection: ColorDirection): string {
  if (colorDirection === "neutral") {
    return "hsl(210 8% 55%)";
  }

  const clamped = Math.min(100, Math.max(0, value));

  const meaningValue =
    colorDirection === "higher-is-worse" ? 100 - clamped : clamped;

  /*
   * 0   -> red
   * 50  -> yellow
   * 100 -> green
   */
  const hue = meaningValue * 1.2;

  return `hsl(${hue} 72% 46%)`;
}

function supportsCalendarLensField(field: EntryFieldDefinition): boolean {
  if (field.type === "scale" || field.type === "faces") {
    /*
     * Existing Scale fields pre-date showInCalendar.
     * Treat undefined as visible for backward compatibility.
     */
    return field.showInCalendar !== false;
  }

  if (
    field.type === "duration" ||
    field.type === "timer" ||
    field.type === "time-range" ||
    field.type === "number" ||
    field.type === "checkbox"
  ) {
    return field.includeInSummary === true;
  }

  return false;
}

function isCalendarLensEntryType(entryType: EntryTypeDefinition): boolean {
  return (
    !entryType.archived && entryType.fields.some(supportsCalendarLensField)
  );
}

function buildLensMetrics(
  entryType: EntryTypeDefinition,
  entries: DaywardenEntry[],
): LensMetric[] {
  const metrics: LensMetric[] = [];

  for (const field of entryType.fields) {
    if (!supportsCalendarLensField(field)) {
      continue;
    }

    const values = entries
      .map((entry) => entry.values[field.id])
      .filter((value) => value !== undefined);

    switch (field.type) {
      case "scale": {
        const numericValues = values.map(Number).filter(Number.isFinite);

        const summary = summarizeNumbers(numericValues, field);

        if (summary === null) {
          break;
        }

        metrics.push({
          kind: "scale",
          fieldId: field.id,
          label: field.name,
          value: Math.min(100, Math.max(0, summary)),
          colorDirection: field.colorDirection ?? "neutral",
        });

        break;
      }

      case "faces": {
        const numericValues = values
          .map(Number)
          .filter(
            (value) => Number.isFinite(value) && value >= 1 && value <= 5,
          );

        const summary = summarizeNumbers(numericValues, field);

        if (summary === null) {
          break;
        }

        const face = getFaceOption(summary);

        metrics.push({
          kind: "face",
          fieldId: field.id,
          label: field.name,
          face: face.face,
          faceLabel: face.label,
        });

        break;
      }

      case "duration": {
        const totalMinutes = values.reduce<number>(
          (sum, value) =>
            isDurationValue(value) ? sum + durationToMinutes(value) : sum,
          0,
        );

        metrics.push({
          kind: "text",
          fieldId: field.id,
          label: field.name,
          value: formatMinutes(totalMinutes),
        });

        break;
      }

      case "timer": {
        const totalMinutes = values.reduce<number>(
          (sum, value) =>
            isTimerValue(value) ? sum + timerToMinutes(value) : sum,
          0,
        );

        metrics.push({
          kind: "text",
          fieldId: field.id,
          label: field.name,
          value: formatMinutes(totalMinutes),
        });

        break;
      }

      case "time-range": {
        const totalMinutes = values.reduce<number>(
          (sum, value) =>
            isTimeRangeValue(value) ? sum + timeRangeToMinutes(value) : sum,
          0,
        );

        metrics.push({
          kind: "text",
          fieldId: field.id,
          label: field.name,
          value: formatMinutes(totalMinutes),
        });

        break;
      }

      case "number": {
        const numericValues = values.map(Number).filter(Number.isFinite);

        const summary = summarizeNumbers(numericValues, field);

        if (summary === null) {
          break;
        }

        metrics.push({
          kind: "text",
          fieldId: field.id,
          label: field.name,
          value: new Intl.NumberFormat("en", {
            maximumFractionDigits: 1,
          }).format(summary),
        });

        break;
      }

      case "checkbox": {
        const yesCount = values.filter(Boolean).length;

        metrics.push({
          kind: "text",
          fieldId: field.id,
          label: field.name,
          value: `${yesCount} yes`,
        });

        break;
      }

      default:
        break;
    }
  }

  return metrics;
}

function CalendarLensVisualization({
  entryType,
  entries,
  compact = false,
  maxMetrics = 4,
}: CalendarLensVisualizationProps) {
  if (entries.length === 0) {
    if (compact) {
      return null;
    }

    return (
      <div className="calendar-day-lens-summary empty">
        <div className="calendar-day-lens-heading">
          <span>Lens</span>
          <strong>{entryType.name}</strong>
        </div>

        <p>No {entryType.name} recorded during this selection.</p>
      </div>
    );
  }

  const metrics = buildLensMetrics(entryType, entries);

  const visibleMetrics = compact ? metrics.slice(0, maxMetrics) : metrics;

  return (
    <div
      className={
        compact ? "calendar-lens-metrics compact" : "calendar-day-lens-summary"
      }
    >
      {!compact && (
        <div className="calendar-day-lens-heading">
          <span>Lens</span>
          <strong>{entryType.name}</strong>
        </div>
      )}

      <div className="calendar-lens-metric-list">
        {visibleMetrics.map((metric) => {
          if (metric.kind === "scale") {
            return (
              <div
                className="calendar-lens-metric calendar-lens-scale"
                key={metric.fieldId}
              >
                <span className="calendar-lens-metric-label">
                  {metric.label}
                </span>

                <div
                  className="calendar-lens-track"
                  aria-label={`${metric.label} ${Math.round(metric.value)} out of 100`}
                >
                  <span
                    className="calendar-lens-fill"
                    style={{
                      width: `${metric.value}%`,
                      backgroundColor: getScaleColor(
                        metric.value,
                        metric.colorDirection,
                      ),
                    }}
                  />
                </div>
              </div>
            );
          }

          if (metric.kind === "face") {
            return (
              <div
                className="calendar-lens-metric calendar-lens-face"
                key={metric.fieldId}
              >
                <span className="calendar-lens-metric-label">
                  {metric.label}
                </span>

                <span className="calendar-lens-face-value">
                  <span className="calendar-lens-face-icon" aria-hidden="true">
                    {metric.face}
                  </span>

                  <span className="calendar-lens-face-label">
                    {metric.faceLabel}
                  </span>
                </span>
              </div>
            );
          }

          return (
            <div
              className="calendar-lens-metric calendar-lens-text"
              key={metric.fieldId}
            >
              <span className="calendar-lens-metric-label">{metric.label}</span>

              <strong className="calendar-lens-metric-value">
                {metric.value}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarView({
  entries,
  entryTypes,
  addableEntryTypes,
  onAddEntry,
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

  const lensEntryTypes = useMemo(
    () => entryTypes.filter(isCalendarLensEntryType),
    [entryTypes],
  );

  const [selectedLensEntryTypeIds, setSelectedLensEntryTypeIds] = useState<
    string[]
  >([]);

  const [calendarHelpOpen, setCalendarHelpOpen] = useState(false);

  const [addEntryPickerOpen, setAddEntryPickerOpen] = useState(false);

  const lensPickerRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedLenses() {
      const savedEntryTypeIds = await getCalendarLensEntryTypeIds();

      if (cancelled) {
        return;
      }

      if (savedEntryTypeIds !== null) {
        setSelectedLensEntryTypeIds(savedEntryTypeIds);

        return;
      }

      if (lensEntryTypes.length > 0) {
        const defaultSelection = [lensEntryTypes[0].id];

        setSelectedLensEntryTypeIds(defaultSelection);

        void saveCalendarLensEntryTypeIds(defaultSelection);
      }
    }

    void loadSavedLenses();

    return () => {
      cancelled = true;
    };
  }, [lensEntryTypes]);

  const selectedLensEntryTypes = useMemo(
    () =>
      lensEntryTypes.filter((entryType) =>
        selectedLensEntryTypeIds.includes(entryType.id),
      ),
    [lensEntryTypes, selectedLensEntryTypeIds],
  );

  const selectedLensEntryTypeIdSet = useMemo(
    () => new Set(selectedLensEntryTypes.map((entryType) => entryType.id)),
    [selectedLensEntryTypes],
  );

  const allLensesSelected =
    lensEntryTypes.length > 0 &&
    selectedLensEntryTypes.length === lensEntryTypes.length;

  const someLensesSelected =
    selectedLensEntryTypes.length > 0 && !allLensesSelected;

  let lensSelectionLabel = "No lenses";

  if (lensEntryTypes.length === 0) {
    lensSelectionLabel = "No calendar-ready activities";
  } else if (selectedLensEntryTypes.length === 1) {
    lensSelectionLabel = selectedLensEntryTypes[0].name;
  } else if (allLensesSelected) {
    lensSelectionLabel = "All lenses";
  } else if (selectedLensEntryTypes.length === 2) {
    lensSelectionLabel =
      `${selectedLensEntryTypes[0].name} + ` + selectedLensEntryTypes[1].name;
  } else if (selectedLensEntryTypes.length > 2) {
    lensSelectionLabel = `${selectedLensEntryTypes.length} lenses`;
  }

  function updateLensSelection(entryTypeIds: string[]) {
    const validEntryTypeIds = Array.from(
      new Set(
        entryTypeIds.filter((entryTypeId) =>
          lensEntryTypes.some((entryType) => entryType.id === entryTypeId),
        ),
      ),
    );

    setSelectedLensEntryTypeIds(validEntryTypeIds);
    clearSelection();

    void saveCalendarLensEntryTypeIds(validEntryTypeIds);
  }

  function toggleLensEntryType(entryTypeId: string) {
    const currentEntryTypeIds = selectedLensEntryTypes.map(
      (entryType) => entryType.id,
    );

    const nextEntryTypeIds = currentEntryTypeIds.includes(entryTypeId)
      ? currentEntryTypeIds.filter((currentId) => currentId !== entryTypeId)
      : [...currentEntryTypeIds, entryTypeId];

    updateLensSelection(nextEntryTypeIds);
  }

  function toggleAllLenses() {
    updateLensSelection(
      allLensesSelected ? [] : lensEntryTypes.map((entryType) => entryType.id),
    );
  }

  function closeLensPicker() {
    if (lensPickerRef.current) {
      lensPickerRef.current.open = false;
    }
  }

  const lensEntriesByDate = useMemo(() => {
    const grouped = new Map<string, Map<string, DaywardenEntry[]>>();

    if (selectedLensEntryTypeIdSet.size === 0) {
      return grouped;
    }

    for (const entry of entries) {
      if (!selectedLensEntryTypeIdSet.has(entry.entryTypeId)) {
        continue;
      }

      const dateKey = getLocalDateKey(entry.createdAt);

      let entriesByType = grouped.get(dateKey);

      if (!entriesByType) {
        entriesByType = new Map<string, DaywardenEntry[]>();

        grouped.set(dateKey, entriesByType);
      }

      const current = entriesByType.get(entry.entryTypeId) ?? [];

      current.push(entry);

      entriesByType.set(entry.entryTypeId, current);
    }

    return grouped;
  }, [entries, selectedLensEntryTypeIdSet]);

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

  const selectedLensEntriesByType = useMemo(() => {
    const grouped = new Map<string, DaywardenEntry[]>();

    for (const entry of selectedEntries) {
      if (!selectedLensEntryTypeIdSet.has(entry.entryTypeId)) {
        continue;
      }

      const current = grouped.get(entry.entryTypeId) ?? [];

      current.push(entry);

      grouped.set(entry.entryTypeId, current);
    }

    return grouped;
  }, [selectedEntries, selectedLensEntryTypeIdSet]);

  const reviewLensEntryTypes = useMemo(() => {
    /*
     * For one Lens, preserve the existing empty-state
     * message if nothing was recorded.
     *
     * With several Lenses selected, only show full
     * review blocks for Lenses that actually have data.
     */
    if (selectedLensEntryTypes.length <= 1) {
      return selectedLensEntryTypes;
    }

    return selectedLensEntryTypes.filter(
      (entryType) =>
        (selectedLensEntriesByType.get(entryType.id)?.length ?? 0) > 0,
    );
  }, [selectedLensEntryTypes, selectedLensEntriesByType]);

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

  function getVisibleMonthDateKeys(): string[] {
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate();

    return Array.from({ length: daysInMonth }, (_, index) =>
      getLocalDateKey(new Date(year, month, index + 1, 12)),
    );
  }

  function openMonth() {
    if (multiSelect) {
      return;
    }

    setSelectedDates(getVisibleMonthDateKeys());

    setSelectionKind("month");

    setShowAllEntries(false);

    setSheetOpen(true);
  }

  function clearSelection() {
    setSelectedDates([]);
    setMultiSelect(false);
    setSheetOpen(false);
    setShowAllEntries(false);
    setAddEntryPickerOpen(false);
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
    setAddEntryPickerOpen(false);

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

  if (selectionKind === "month") {
    sheetTitle = new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
    }).format(visibleMonth);

    if (sortedSelectedDates.length > 0) {
      sheetSubtitle = `${formatShortDate(
        sortedSelectedDates[0],
      )} – ${formatShortDate(
        sortedSelectedDates[sortedSelectedDates.length - 1],
      )}`;
    }
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
          <button
            type="button"
            className="calendar-month-review-button"
            onClick={openMonth}
            disabled={multiSelect}
            title="Review this month"
          >
            {new Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
            }).format(visibleMonth)}
          </button>

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

      <div className="calendar-lens-control">
        <div className="calendar-lens-control-row">
          <details className="calendar-lens-picker" ref={lensPickerRef}>
            <summary>
              <span className="calendar-lens-picker-name">Lenses</span>

              <strong>{lensSelectionLabel}</strong>

              <span className="calendar-lens-picker-chevron" aria-hidden="true">
                ⌄
              </span>
            </summary>

            <div className="calendar-lens-options">
              {lensEntryTypes.length === 0 ? (
                <p className="calendar-lens-empty">
                  No activities currently have fields that can appear in
                  Calendar.
                </p>
              ) : (
                <>
                  <label className="calendar-lens-option calendar-lens-option-all">
                    <input
                      type="checkbox"
                      checked={allLensesSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someLensesSelected;
                        }
                      }}
                      onChange={toggleAllLenses}
                    />

                    <span>All lenses</span>
                  </label>

                  <div className="calendar-lens-divider" />

                  {lensEntryTypes.map((entryType) => (
                    <label className="calendar-lens-option" key={entryType.id}>
                      <input
                        type="checkbox"
                        checked={selectedLensEntryTypeIds.includes(
                          entryType.id,
                        )}
                        onChange={() => toggleLensEntryType(entryType.id)}
                      />

                      <span>{entryType.name}</span>
                    </label>
                  ))}

                  <button
                    className="calendar-lens-done"
                    type="button"
                    onClick={closeLensPicker}
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </details>

          <button
            className="calendar-help-button"
            type="button"
            aria-label="How to use Calendar"
            onClick={() => setCalendarHelpOpen(true)}
          >
            ?
          </button>
        </div>
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

                  const dayLensEntries = lensEntriesByDate.get(dateKey);

                  const dayLensEntryTypes = selectedLensEntryTypes.filter(
                    (entryType) =>
                      (dayLensEntries?.get(entryType.id)?.length ?? 0) > 0,
                  );

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
                      <span className="calendar-day-number">
                        {day.getDate()}
                      </span>

                      {isCurrentMonth &&
                        selectedLensEntryTypes.length === 1 && (
                          <CalendarLensVisualization
                            entryType={selectedLensEntryTypes[0]}
                            entries={
                              dayLensEntries?.get(
                                selectedLensEntryTypes[0].id,
                              ) ?? []
                            }
                            compact
                          />
                        )}

                      {isCurrentMonth &&
                        selectedLensEntryTypes.length > 1 &&
                        dayLensEntryTypes.length > 0 && (
                          <div className="calendar-multi-lens-metrics">
                            {dayLensEntryTypes.slice(0, 3).map((entryType) => (
                              <div
                                className="calendar-multi-lens-item"
                                key={entryType.id}
                                title={entryType.name}
                              >
                                <CalendarLensVisualization
                                  entryType={entryType}
                                  entries={
                                    dayLensEntries?.get(entryType.id) ?? []
                                  }
                                  compact
                                  maxMetrics={1}
                                />
                              </div>
                            ))}

                            {dayLensEntryTypes.length > 3 && (
                              <span className="calendar-multi-lens-more">
                                +{dayLensEntryTypes.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                    </LongPressButton>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {calendarHelpOpen && (
        <ModalSheet
          open={calendarHelpOpen}
          ariaLabel="How to use Calendar"
          onClose={() => setCalendarHelpOpen(false)}
        >
          <div className="calendar-help-sheet">
            <h2>Calendar</h2>

            <p>Tap a day, week number, or month name to review that period.</p>

            <p>
              Long-press a day or week number to select and compare several
              days.
            </p>

            <p>
              Use Lenses to choose which activity summaries appear inside the
              calendar.
            </p>
          </div>
        </ModalSheet>
      )}

      {addEntryPickerOpen && selectedDates.length === 1 && (
        <ModalSheet
          open={addEntryPickerOpen}
          ariaLabel="Add activity"
          onClose={() => setAddEntryPickerOpen(false)}
        >
          <div className="calendar-add-entry-picker">
            <div>
              <h2>Add activity</h2>

              <p>
                {new Intl.DateTimeFormat("en", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(parseLocalDateKey(selectedDates[0]))}
              </p>
            </div>

            {addableEntryTypes.length === 0 ? (
              <p className="calendar-add-entry-empty">
                No activities are available to add.
              </p>
            ) : (
              <div className="calendar-add-entry-list">
                {addableEntryTypes.map((entryType) => (
                  <button
                    key={entryType.id}
                    type="button"
                    onClick={() => {
                      setAddEntryPickerOpen(false);

                      onAddEntry(entryType, selectedDates[0]);
                    }}
                  >
                    {entryType.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ModalSheet>
      )}

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
                {selectionKind === "day" && selectedDates.length === 1 && (
                  <button
                    className="sheet-add-entry-button"
                    type="button"
                    aria-label="Add activity to this day"
                    title="Add activity"
                    onClick={() => setAddEntryPickerOpen(true)}
                  >
                    +
                  </button>
                )}
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

            {selectedDates.length > 0 &&
              reviewLensEntryTypes.map((entryType) => (
                <CalendarLensVisualization
                  key={entryType.id}
                  entryType={entryType}
                  entries={selectedLensEntriesByType.get(entryType.id) ?? []}
                />
              ))}

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
