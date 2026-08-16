import type { EntryTypeDefinition } from "../types/entryType";

interface EntryTypePickerProps {
  entryTypes: EntryTypeDefinition[];
  selectedEntryTypeId: string | null;
  onSelect: (entryType: EntryTypeDefinition) => void;
}

function EntryTypePicker({
  entryTypes,
  selectedEntryTypeId,
  onSelect,
}: EntryTypePickerProps) {
  return (
    <div className="entry-type-picker">
      {entryTypes.map((entryType) => {
        const selected = entryType.id === selectedEntryTypeId;

        return (
          <button
            key={entryType.id}
            type="button"
            className={`entry-type-button ${selected ? "selected" : ""}`}
            onClick={() => onSelect(entryType)}
          >
            {entryType.name}
          </button>
        );
      })}
    </div>
  );
}

export default EntryTypePicker;
