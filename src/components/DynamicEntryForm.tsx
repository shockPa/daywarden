import { useState } from "react";

import type {
  DurationValue,
  EntryFieldDefinition,
  EntryFieldValue,
  EntryTypeDefinition,
  EntryValues,
  TimeRangeValue,
} from "../types/entryType";

import { FACE_OPTIONS, normalizeFaceRating } from "../utils/faces";

interface DynamicEntryFormProps {
  entryType: EntryTypeDefinition;

  initialValues?: EntryValues;

  submitLabel?: string;

  entryDate?: string;
  entryTime?: string;

  onEntryDateChange?: (value: string) => void;

  onEntryTimeChange?: (value: string) => void;

  onSave: (values: EntryValues) => Promise<void> | void;

  onClose: () => void;
}

function getInitialValue(field: EntryFieldDefinition): EntryFieldValue {
  switch (field.type) {
    case "scale":
      return field.min ?? 0;

    case "faces":
      return 3;

    case "number":
      return 0;

    case "checkbox":
      return false;

    case "list":
      return [];

    case "time-range":
      return {
        start: "",
        end: "",
      };

    case "duration":
      return {
        hours: 0,
        minutes: 0,
      };

    case "time":
    case "text":
    default:
      return "";
  }
}

function createInitialValues(fields: EntryFieldDefinition[]): EntryValues {
  return Object.fromEntries(
    fields.map((field) => [field.id, getInitialValue(field)]),
  );
}

function DynamicEntryForm({
  entryType,
  initialValues,
  submitLabel = "Save entry",
  entryDate,
  entryTime,
  onEntryDateChange,
  onEntryTimeChange,
  onSave,
  onClose,
}: DynamicEntryFormProps) {
  const [values, setValues] = useState<EntryValues>(() => ({
    ...createInitialValues(entryType.fields),
    ...initialValues,
  }));

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  }

  function updateValue(fieldId: string, value: EntryFieldValue) {
    setValues((currentValues) => ({
      ...currentValues,
      [fieldId]: value,
    }));
  }

  function renderField(field: EntryFieldDefinition) {
    const value = values[field.id];

    switch (field.type) {
      case "text":
        return (
          <textarea
            className="field-textarea"
            rows={4}
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(event) => updateValue(field.id, event.target.value)}
          />
        );

      case "number":
        return (
          <input
            className="field-input"
            type="number"
            value={Number(value)}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(event) =>
              updateValue(field.id, Number(event.target.value))
            }
          />
        );

      case "scale": {
        const numericValue = Number(value);

        return (
          <div className="scale-field">
            <div className="scale-value">{numericValue}</div>

            <input
              type="range"
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
              value={numericValue}
              onChange={(event) =>
                updateValue(field.id, Number(event.target.value))
              }
            />

            <div className="scale-labels">
              <span>{field.min ?? 0}</span>
              <span>{field.max ?? 100}</span>
            </div>
          </div>
        );
      }

      case "faces": {
        const selectedValue = normalizeFaceRating(value);

        return (
          <div className="faces-field" role="group" aria-label={field.name}>
            {FACE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  selectedValue === option.value
                    ? "face-choice selected"
                    : "face-choice"
                }
                aria-pressed={selectedValue === option.value}
                aria-label={option.label}
                title={option.label}
                onClick={() => updateValue(field.id, option.value)}
              >
                <span className="face-choice-icon" aria-hidden="true">
                  {option.face}
                </span>

                <span className="face-choice-label">{option.label}</span>
              </button>
            ))}
          </div>
        );
      }

      case "time":
        return (
          <input
            className="field-input"
            type="time"
            value={String(value)}
            onChange={(event) => updateValue(field.id, event.target.value)}
          />
        );

      case "time-range": {
        const timeRange = value as TimeRangeValue;

        return (
          <div className="time-range">
            <label>
              <span>From</span>

              <input
                className="field-input"
                type="time"
                value={timeRange.start}
                onChange={(event) =>
                  updateValue(field.id, {
                    ...timeRange,
                    start: event.target.value,
                  })
                }
              />
            </label>

            <label>
              <span>To</span>

              <input
                className="field-input"
                type="time"
                value={timeRange.end}
                onChange={(event) =>
                  updateValue(field.id, {
                    ...timeRange,
                    end: event.target.value,
                  })
                }
              />
            </label>
          </div>
        );
      }

      case "duration": {
        const duration = value as DurationValue;

        return (
          <div className="duration-input">
            <label>
              <span>Hours</span>

              <input
                className="field-input"
                type="number"
                min="0"
                value={duration.hours}
                onChange={(event) =>
                  updateValue(field.id, {
                    ...duration,
                    hours: Math.max(0, Number(event.target.value)),
                  })
                }
              />
            </label>

            <label>
              <span>Minutes</span>

              <input
                className="field-input"
                type="number"
                min="0"
                max="59"
                value={duration.minutes}
                onChange={(event) =>
                  updateValue(field.id, {
                    ...duration,
                    minutes: Math.min(
                      59,
                      Math.max(0, Number(event.target.value)),
                    ),
                  })
                }
              />
            </label>
          </div>
        );
      }

      case "checkbox":
        return (
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => updateValue(field.id, event.target.checked)}
            />

            <span>Yes</span>
          </label>
        );

      case "list": {
        const items = value as string[];

        return (
          <textarea
            className="field-textarea"
            rows={6}
            value={items.join("\n")}
            placeholder={field.placeholder}
            onChange={(event) =>
              updateValue(field.id, event.target.value.split("\n"))
            }
          />
        );
      }

      default:
        return null;
    }
  }

  return (
    <section className="entry-form card">
      <div className="entry-form-header">
        <h2>{entryType.name}</h2>

        <button
          className="close-button"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {entryDate !== undefined &&
        entryTime !== undefined &&
        onEntryDateChange &&
        onEntryTimeChange && (
          <div className="entry-datetime">
            <label>
              Date
              <input
                type="date"
                value={entryDate}
                onChange={(event) => onEntryDateChange(event.target.value)}
                required
              />
            </label>

            <label>
              Time
              <input
                type="time"
                value={entryTime}
                onChange={(event) => onEntryTimeChange(event.target.value)}
                required
              />
            </label>
          </div>
        )}

      <div className="entry-fields">
        {entryType.fields.map((field) => (
          <div className="entry-field" key={field.id}>
            <label className="field-name">{field.name}</label>

            {renderField(field)}
          </div>
        ))}
      </div>

      <button
        className="save-button active-save"
        type="button"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? "Saving..." : submitLabel}
      </button>
    </section>
  );
}

export default DynamicEntryForm;
