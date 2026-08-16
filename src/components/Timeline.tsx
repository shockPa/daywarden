import EntryCard from "./EntryCard";

import type { DaywardenEntry } from "../types/entry";
import type { EntryTypeDefinition } from "../types/entryType";
import { getLocalDateKey } from "../utils/date";

interface TimelineProps {
  entries: DaywardenEntry[];

  entryTypes: EntryTypeDefinition[];

  onEdit: (entry: DaywardenEntry) => void;

  onDelete: (entry: DaywardenEntry) => void;
}

function formatDayHeading(dateString: string): string {
  const date = new Date(dateString);

  const today = new Date();

  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const dateKey = getLocalDateKey(dateString);

  if (dateKey === getLocalDateKey(today)) {
    return "Today";
  }

  if (dateKey === getLocalDateKey(yesterday)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function Timeline({ entries, entryTypes, onEdit, onDelete }: TimelineProps) {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const groupedEntries = new Map<string, DaywardenEntry[]>();

  for (const entry of sortedEntries) {
    const dateKey = getLocalDateKey(entry.createdAt);

    const group = groupedEntries.get(dateKey);

    if (group) {
      group.push(entry);
    } else {
      groupedEntries.set(dateKey, [entry]);
    }
  }

  if (entries.length === 0) {
    return (
      <section className="timeline">
        <div className="timeline-empty">
          <h2>Your log is empty</h2>

          <p>Entries you record will appear here, grouped by day.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="timeline">
      {Array.from(groupedEntries.entries()).map(([dateKey, dayEntries]) => (
        <section className="timeline-day" key={dateKey}>
          <div className="timeline-day-heading">
            <h2>{formatDayHeading(dayEntries[0].createdAt)}</h2>

            <span>
              {dayEntries.length}{" "}
              {dayEntries.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          <div className="timeline-day-entries">
            {dayEntries.map((entry) => {
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
        </section>
      ))}
    </section>
  );
}

export default Timeline;
