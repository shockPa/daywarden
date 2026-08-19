import { useState } from "react";

import type {
  ColorDirection,
  EntryFieldDefinition,
  EntryFieldType,
  EntryTypeDefinition,
  SummaryMode,
} from "../types/entryType";

import { createId } from "../utils/id";

interface CreateEntryTypeFormProps {
  onSave: (entryType: EntryTypeDefinition) => Promise<void> | void;

  onCancel: () => void;
}

interface DraftField {
  id: string;
  name: string;
  type: EntryFieldType;

  includeInSummary: boolean;

  showInCalendar: boolean;

  colorDirection: ColorDirection;
}

interface FieldTypeOption {
  type: EntryFieldType;
  label: string;
}

const fieldTypeOptions: FieldTypeOption[] = [
  {
    type: "text",
    label: "Text / Note",
  },
  {
    type: "number",
    label: "Number",
  },
  {
    type: "scale",
    label: "Scale 0–100",
  },
  {
    type: "faces",
    label: "Faces",
  },
  {
    type: "time",
    label: "Time",
  },
  {
    type: "time-range",
    label: "Time range",
  },
  {
    type: "duration",
    label: "Duration",
  },
  {
    type: "timer",
    label: "Timer",
  },
  {
    type: "checkbox",
    label: "Yes / No",
  },
  {
    type: "list",
    label: "List",
  },
];

function getDefaultSummaryMode(type: EntryFieldType): SummaryMode {
  switch (type) {
    case "number":
      return "sum";

    case "scale":
    case "faces":
      return "average";

    case "duration":
      return "sum";

    case "time-range":
      return "duration-from-range";

    case "checkbox":
      return "count";

    case "timer":
      return "duration-from-timer";

    case "text":
    case "time":
    case "list":
    default:
      return "none";
  }
}

function canSummarize(type: EntryFieldType): boolean {
  return getDefaultSummaryMode(type) !== "none";
}

function createDraftField(): DraftField {
  return {
    id: createId(),
    name: "",
    type: "text",

    includeInSummary: false,

    colorDirection: "neutral",

    showInCalendar: false,
  };
}

function CreateEntryTypeForm({ onSave, onCancel }: CreateEntryTypeFormProps) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<DraftField[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function addField() {
    setFields((currentFields) => [...currentFields, createDraftField()]);
  }

  function removeField(fieldId: string) {
    setFields((currentFields) =>
      currentFields.filter((field) => field.id !== fieldId),
    );
  }

  function updateField(fieldId: string, updates: Partial<DraftField>) {
    setFields((currentFields) =>
      currentFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              ...updates,
            }
          : field,
      ),
    );
  }

  function handleFieldTypeChange(fieldId: string, type: EntryFieldType) {
    const supportsCalendarVisual = type === "scale" || type === "faces";

    updateField(fieldId, {
      type,

      includeInSummary: canSummarize(type),

      showInCalendar: supportsCalendarVisual,

      colorDirection: "neutral",
    });
  }

  async function handleSave() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Give this entry type a name.");
      return;
    }

    if (fields.length === 0) {
      setError("Add at least one field.");
      return;
    }

    const hasEmptyFieldName = fields.some((field) => !field.name.trim());

    if (hasEmptyFieldName) {
      setError("Every field needs a name.");
      return;
    }

    const timerFieldCount = fields.filter(
      (field) => field.type === "timer",
    ).length;

    if (timerFieldCount > 1) {
      setError("An entry type can only have one Timer field.");

      return;
    }

    const normalizedNames = fields.map((field) =>
      field.name.trim().toLowerCase(),
    );

    const hasDuplicateFieldNames =
      new Set(normalizedNames).size !== normalizedNames.length;

    if (hasDuplicateFieldNames) {
      setError("Field names must be unique within an entry type.");
      return;
    }

    setError("");
    setSaving(true);

    const fieldDefinitions: EntryFieldDefinition[] = fields.map((field) => {
      const defaultSummaryMode = getDefaultSummaryMode(field.type);

      const definition: EntryFieldDefinition = {
        id: field.id,
        name: field.name.trim(),
        type: field.type,

        includeInSummary: field.includeInSummary && canSummarize(field.type),

        summaryMode:
          field.includeInSummary && canSummarize(field.type)
            ? defaultSummaryMode
            : "none",

        ...(field.type === "scale" || field.type === "faces"
          ? {
              showInCalendar: field.showInCalendar,
            }
          : {}),

        ...(field.type === "scale"
          ? {
              min: 0,
              max: 100,
              step: 1,
              colorDirection: field.colorDirection,
            }
          : {}),
      };

      return definition;
    });

    const entryType: EntryTypeDefinition = {
      id: `custom-${createId()}`,
      name: trimmedName,
      builtIn: false,
      fields: fieldDefinitions,
    };

    try {
      await onSave(entryType);
    } catch {
      setError("Daywarden couldn't save this entry type.");
      setSaving(false);
    }
  }

  return (
    <section className="card create-type-form">
      <div className="entry-form-header">
        <h2>Create your own</h2>

        <button
          className="close-button"
          type="button"
          aria-label="Close"
          onClick={onCancel}
        >
          ×
        </button>
      </div>

      <div className="create-type-section">
        <label className="field-name" htmlFor="entry-type-name">
          Name
        </label>

        <input
          id="entry-type-name"
          className="field-input"
          type="text"
          value={name}
          placeholder="Ultimate Workout"
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />
      </div>

      <div className="custom-fields-header">
        <div>
          <h3>Fields</h3>

          <p>Choose what you want to record each time.</p>
        </div>
      </div>

      {fields.length === 0 && <div className="no-fields">No fields yet.</div>}

      <div className="custom-field-list">
        {fields.map((field, index) => {
          const summarizable = canSummarize(field.type);

          return (
            <div className="custom-field-card" key={field.id}>
              <div className="custom-field-title">
                <strong>Field {index + 1}</strong>

                <button
                  className="remove-field-button"
                  type="button"
                  onClick={() => removeField(field.id)}
                >
                  Remove
                </button>
              </div>

              <label>
                <span className="field-label">Name</span>

                <input
                  className="field-input"
                  type="text"
                  value={field.name}
                  placeholder="Pain"
                  onChange={(event) => {
                    updateField(field.id, {
                      name: event.target.value,
                    });

                    setError("");
                  }}
                />
              </label>

              <label>
                <span className="field-label">Type</span>

                <select
                  className="field-input"
                  value={field.type}
                  onChange={(event) =>
                    handleFieldTypeChange(
                      field.id,
                      event.target.value as EntryFieldType,
                    )
                  }
                >
                  {fieldTypeOptions.map((option) => (
                    <option key={option.type} value={option.type}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {summarizable && (
                <label className="summary-toggle">
                  <input
                    type="checkbox"
                    checked={field.includeInSummary}
                    onChange={(event) =>
                      updateField(field.id, {
                        includeInSummary: event.target.checked,
                      })
                    }
                  />

                  <span>Include in summaries</span>
                </label>
              )}

              {(field.type === "scale" || field.type === "faces") && (
                <label className="summary-toggle">
                  <input
                    type="checkbox"
                    checked={field.showInCalendar}
                    onChange={(event) =>
                      updateField(field.id, {
                        showInCalendar: event.target.checked,
                      })
                    }
                  />

                  <span>Show in Calendar</span>
                </label>
              )}

              {field.type === "scale" && (
                <label>
                  <span className="field-label">Calendar meaning</span>

                  <select
                    className="field-input"
                    value={field.colorDirection}
                    onChange={(event) =>
                      updateField(field.id, {
                        colorDirection: event.target.value as ColorDirection,
                      })
                    }
                  >
                    <option value="neutral">Neutral</option>

                    <option value="higher-is-better">Higher is better</option>

                    <option value="higher-is-worse">Higher is worse</option>
                  </select>
                </label>
              )}
            </div>
          );
        })}
      </div>

      <button className="add-field-button" type="button" onClick={addField}>
        + Add field
      </button>

      {error && <p className="form-error">{error}</p>}

      <button
        className="save-button active-save"
        type="button"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? "Saving..." : "Save entry type"}
      </button>
    </section>
  );
}

export default CreateEntryTypeForm;
