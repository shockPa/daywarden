import EntryCard from "./EntryCard";

import type { DaywardenEntry } from "../types/entry";
import type { EntryTypeDefinition } from "../types/entryType";

interface TodayEntriesProps {
  entries: DaywardenEntry[];

  entryTypes: EntryTypeDefinition[];

  onEdit: (entry: DaywardenEntry) => void;

  onDelete: (entry: DaywardenEntry) => void;
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
          <EntryCard
            key={entry.id}
            entry={entry}
            entryType={entryType}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </section>
  );
}

export default TodayEntries;
