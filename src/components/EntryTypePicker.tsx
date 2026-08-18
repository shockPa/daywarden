import type { EntryTypeDefinition } from "../types/entryType";

interface EntryTypePickerProps {
  entryTypes: EntryTypeDefinition[];

  selectedEntryTypeId: string | null;

  activeTimerEntryTypeIds?: string[];

  onSelect: (entryType: EntryTypeDefinition) => void;
}

function EntryTypePicker({
  entryTypes,
  selectedEntryTypeId,
  activeTimerEntryTypeIds = [],
  onSelect,
}: EntryTypePickerProps) {
  return (
    <div className="entry-type-picker">
      {entryTypes.map((entryType) => {
        const hasTimer = entryType.fields.some(
          (field) => field.type === "timer",
        );

        const timerRunning = activeTimerEntryTypeIds.includes(entryType.id);

        const classes = [
          "entry-type-button",

          selectedEntryTypeId === entryType.id ? "selected" : "",

          hasTimer ? "timer-entry-type" : "",

          timerRunning ? "timer-running" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={entryType.id}
            type="button"
            className={classes}
            disabled={timerRunning}
            onClick={() => onSelect(entryType)}
          >
            {hasTimer && (
              <span className="timer-entry-icon" aria-hidden="true">
                ⏱
              </span>
            )}

            <span>{entryType.name}</span>

            {timerRunning && (
              <span className="timer-running-label">Running</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default EntryTypePicker;
