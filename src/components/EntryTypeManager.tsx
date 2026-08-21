import { useState } from "react";

import ActivityIcon from "./ActivityIcon";
import { activityIconOptions } from "./activityIconRegistry";
import ModalSheet from "./ModalSheet";

import type { EntryTypeDefinition } from "../types/entryType";

interface EntryTypeManagerProps {
  entryTypes: EntryTypeDefinition[];

  removedCustomEntryTypes: EntryTypeDefinition[];

  hiddenIds: string[];

  iconOverrides: Record<string, string | null>;

  onToggleHidden: (entryTypeId: string) => void;

  onMove: (entryTypeId: string, direction: -1 | 1) => void;

  onIconChange: (
    entryTypeId: string,
    iconId: string | null,
  ) => void | Promise<void>;

  onRemove: (entryTypeId: string) => void;

  onRestore: (entryTypeId: string) => void;

  onClose: () => void;
}

function hasOwnIconOverride(
  iconOverrides: Record<string, string | null>,
  entryTypeId: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(iconOverrides, entryTypeId);
}

function getDisplayedIconId(
  entryType: EntryTypeDefinition,
  iconOverrides: Record<string, string | null>,
): string | null {
  if (hasOwnIconOverride(iconOverrides, entryType.id)) {
    return iconOverrides[entryType.id];
  }

  return entryType.iconId ?? null;
}

function EntryTypeManager({
  entryTypes,
  removedCustomEntryTypes,
  hiddenIds,
  iconOverrides,
  onToggleHidden,
  onMove,
  onIconChange,
  onRemove,
  onRestore,
  onClose,
}: EntryTypeManagerProps) {
  const [choosingIconForId, setChoosingIconForId] = useState<string | null>(
    null,
  );

  const choosingIconFor =
    entryTypes.find((entryType) => entryType.id === choosingIconForId) ?? null;

  const selectedIconId = choosingIconFor
    ? getDisplayedIconId(choosingIconFor, iconOverrides)
    : null;

  async function handleChooseIcon(iconId: string | null) {
    if (!choosingIconFor) {
      return;
    }

    await onIconChange(choosingIconFor.id, iconId);

    setChoosingIconForId(null);
  }

  return (
    <>
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
            const displayedIconId = getDisplayedIconId(
              entryType,
              iconOverrides,
            );

            return (
              <div className="manager-row" key={entryType.id}>
                <div className="manager-name">
                  <strong>{entryType.name}</strong>

                  <span>{entryType.builtIn ? "Built-in" : "Custom"}</span>
                </div>

                <div className="manager-actions">
                  <button
                    className="manager-icon-button"
                    type="button"
                    aria-label={`Choose icon for ${entryType.name}`}
                    onClick={() => setChoosingIconForId(entryType.id)}
                  >
                    <span className="manager-icon-preview" aria-hidden="true">
                      {displayedIconId ? (
                        <ActivityIcon iconId={displayedIconId} />
                      ) : (
                        <span className="manager-empty-icon">—</span>
                      )}
                    </span>

                    <span>Icon</span>
                  </button>

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

      <ModalSheet
        open={choosingIconFor !== null}
        ariaLabel={
          choosingIconFor
            ? `Choose icon for ${choosingIconFor.name}`
            : "Choose activity icon"
        }
        onClose={() => setChoosingIconForId(null)}
      >
        {choosingIconFor && (
          <div className="activity-icon-chooser">
            <div className="activity-icon-chooser-heading">
              <h2>{choosingIconFor.name}</h2>

              <p>Choose an icon, or leave this activity empty.</p>
            </div>

            <div className="activity-icon-grid">
              <button
                type="button"
                className={
                  selectedIconId === null
                    ? "activity-icon-option selected"
                    : "activity-icon-option"
                }
                aria-pressed={selectedIconId === null}
                onClick={() => void handleChooseIcon(null)}
              >
                <span className="activity-icon-option-art activity-icon-option-empty">
                  —
                </span>

                <span>Empty</span>
              </button>

              {activityIconOptions.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  className={
                    selectedIconId === icon.id
                      ? "activity-icon-option selected"
                      : "activity-icon-option"
                  }
                  aria-pressed={selectedIconId === icon.id}
                  onClick={() => void handleChooseIcon(icon.id)}
                >
                  <ActivityIcon
                    iconId={icon.id}
                    className="activity-icon-option-art"
                  />

                  <span>{icon.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </ModalSheet>
    </>
  );
}

export default EntryTypeManager;
