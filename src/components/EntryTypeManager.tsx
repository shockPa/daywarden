import type { EntryTypeDefinition } from "../types/entryType";

interface EntryTypeManagerProps {
  entryTypes: EntryTypeDefinition[];

  removedCustomEntryTypes: EntryTypeDefinition[];

  hiddenIds: string[];

  onToggleHidden: (entryTypeId: string) => void;

  onMove: (entryTypeId: string, direction: -1 | 1) => void;

  onRemove: (entryTypeId: string) => void;

  onRestore: (entryTypeId: string) => void;

  onClose: () => void;
}

function EntryTypeManager({
  entryTypes,
  removedCustomEntryTypes,
  hiddenIds,
  onToggleHidden,
  onMove,
  onRemove,
  onRestore,
  onClose,
}: EntryTypeManagerProps) {
  return (
    <section className="card type-manager">
      <div className="entry-form-header">
        <div>
          <h2>Entry types</h2>

          <p className="manager-description">
            Choose what appears on Today and arrange the order.
          </p>
        </div>

        <button
          className="close-button"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="manager-list">
        {entryTypes.map((entryType, index) => {
          const hidden = hiddenIds.includes(entryType.id);

          return (
            <div className="manager-row" key={entryType.id}>
              <div className="manager-name">
                <strong>{entryType.name}</strong>

                <span>{entryType.builtIn ? "Built-in" : "Custom"}</span>
              </div>

              <div className="manager-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  aria-label={`Move ${entryType.name} up`}
                  onClick={() => onMove(entryType.id, -1)}
                >
                  ↑
                </button>

                <button
                  type="button"
                  disabled={index === entryTypes.length - 1}
                  aria-label={`Move ${entryType.name} down`}
                  onClick={() => onMove(entryType.id, 1)}
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() => onToggleHidden(entryType.id)}
                >
                  {hidden ? "Show" : "Hide"}
                </button>

                {!entryType.builtIn && (
                  <button
                    className="remove-type"
                    type="button"
                    onClick={() => onRemove(entryType.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {removedCustomEntryTypes.length > 0 && (
        <div className="removed-types">
          <h3>Removed</h3>

          {removedCustomEntryTypes.map((entryType) => (
            <div className="manager-row" key={entryType.id}>
              <div className="manager-name">
                <strong>{entryType.name}</strong>

                <span>Custom</span>
              </div>

              <button type="button" onClick={() => onRestore(entryType.id)}>
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default EntryTypeManager;
