import type { DaywardenEntry } from "../types/entry";

import type {
  DurationValue,
  EntryFieldDefinition,
  EntryFieldValue,
  EntryTypeDefinition,
  TimeRangeValue,
  TimerValue,
} from "../types/entryType";

interface EntryCardProps {
  entry: DaywardenEntry;

  entryType?: EntryTypeDefinition;

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

function formatTimerTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",

    minute: "2-digit",
  }).format(new Date(value));
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

function formatTimerDuration(value: TimerValue): string {
  const start = new Date(value.startedAt).getTime();

  const end = new Date(value.endedAt).getTime();

  const totalMinutes = Math.max(0, Math.round((end - start) / 60_000));

  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ` + `${minutes} min`;
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
   * If the end is earlier than the start,
   * treat it as crossing midnight.
   *
   * 22:00 → 02:00 = 4 hours
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

    case "timer": {
      if (!isTimerValue(value)) {
        return null;
      }

      return (
        <div className="entry-value">
          <span>{field.name}</span>

          <strong>
            {formatTimerTime(value.startedAt)}
            {" – "}
            {formatTimerTime(value.endedAt)}
            {" · "}
            {formatTimerDuration(value)}
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

function EntryCard({ entry, entryType, onEdit, onDelete }: EntryCardProps) {
  return (
    <article className="saved-entry-card">
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
        <p className="entry-unavailable">Entry details unavailable.</p>
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
}

export default EntryCard;
