import type { DaywardenEntry } from "../types/entry";

import type {
  DurationValue,
  EntryFieldDefinition,
  EntryFieldValue,
  EntryTypeDefinition,
  TimeRangeValue,
} from "../types/entryType";

interface TodayEntriesProps {
  entries: DaywardenEntry[];

  entryTypes: EntryTypeDefinition[];

  onEdit: (entry: DaywardenEntry) => void;

  onDelete: (entry: DaywardenEntry) => void;
}

function formatDuration(duration: DurationValue): string {
  const parts: string[] = [];

  if (duration.hours > 0) {
    parts.push(`${duration.hours}h`);
  }

  if (duration.minutes > 0) {
    parts.push(`${duration.minutes}m`);
  }

  if (parts.length === 0) {
    return "0m";
  }

  return parts.join(" ");
}

function calculateTimeRangeDuration(timeRange: TimeRangeValue): string | null {
  if (!timeRange.start || !timeRange.end) {
    return null;
  }

  const [startHour, startMinute] = timeRange.start.split(":").map(Number);

  const [endHour, endMinute] = timeRange.end.split(":").map(Number);

  const start = startHour * 60 + startMinute;

  let end = endHour * 60 + endMinute;

  /*
   * Treat an earlier end time as crossing midnight.
   * 22:00 → 02:00 = 4 hours.
   */
  if (end < start) {
    end += 24 * 60;
  }

  const difference = end - start;

  return formatDuration({
    hours: Math.floor(difference / 60),

    minutes: difference % 60,
  });
}

function renderValue(
  field: EntryFieldDefinition,
  value: EntryFieldValue | undefined,
) {
  if (value === undefined) {
    return null;
  }
  switch (field.type) {
    case "text": {
      const text = String(value).trim();

      if (!text) {
        return null;
      }

      return <p className="entry-note">{text}</p>;
    }

    case "number":
    case "scale":
      return (
        <div className="entry-value">
          <span>{field.name}</span>

          <strong>{String(value)}</strong>
        </div>
      );

    case "time":
      if (!value) {
        return null;
      }

      return (
        <div className="entry-value">
          <span>{field.name}</span>

          <strong>{String(value)}</strong>
        </div>
      );

    case "time-range": {
      const timeRange = value as TimeRangeValue;

      if (!timeRange.start && !timeRange.end) {
        return null;
      }

      const duration = calculateTimeRangeDuration(timeRange);

      return (
        <div className="entry-value">
          <span>{field.name}</span>

          <strong>
            {timeRange.start || "?"}
            {" – "}
            {timeRange.end || "?"}

            {duration && ` · ${duration}`}
          </strong>
        </div>
      );
    }

    case "duration": {
      const duration = value as DurationValue;

      if (duration.hours === 0 && duration.minutes === 0) {
        return null;
      }

      return (
        <div className="entry-value">
          <span>{field.name}</span>

          <strong>{formatDuration(duration)}</strong>
        </div>
      );
    }

    case "checkbox":
      return (
        <div className="entry-value">
          <span>{field.name}</span>

          <strong>{value ? "Yes" : "No"}</strong>
        </div>
      );

    case "list": {
      const items = (value as string[]).filter((item) => item.trim() !== "");

      if (items.length === 0) {
        return null;
      }

      return (
        <div className="entry-list">
          <span>{field.name}</span>

          <ul>
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      );
    }

    default:
      return null;
  }
}

function TodayEntries({
  entries,
  entryTypes,
  onEdit,
  onDelete,
}: TodayEntriesProps) {
  const today = new Date().toDateString();

  const todaysEntries = entries
    .filter((entry) => {
      return new Date(entry.createdAt).toDateString() === today;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <section className="today-entries">
      <h2>Today</h2>

      {todaysEntries.length === 0 && (
        <p className="empty-state">Nothing recorded yet.</p>
      )}

      {todaysEntries.map((entry) => {
        const entryType = entryTypes.find(
          (type) => type.id === entry.entryTypeId,
        );

        return (
          <article className="saved-entry-card" key={entry.id}>
            <div className="saved-entry-header">
              <strong>{entry.entryTypeName}</strong>

              <time>
                {new Intl.DateTimeFormat("en", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(entry.createdAt))}
              </time>
            </div>

            {entryType ? (
              <div className="saved-entry-values">
                {entryType.fields.map((field) => (
                  <div key={field.id}>
                    {renderValue(field, entry.values[field.id])}
                  </div>
                ))}
              </div>
            ) : (
              <p>Entry details unavailable.</p>
            )}
            <div className="entry-actions">
              <button type="button" onClick={() => onEdit(entry)}>
                Edit
              </button>

              <button
                className="delete-entry-button"
                type="button"
                onClick={() => onDelete(entry)}
              >
                Delete
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default TodayEntries;
