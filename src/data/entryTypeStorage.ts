import { Preferences } from "@capacitor/preferences";

import type { EntryTypeDefinition } from "../types/entryType";

const CUSTOM_ENTRY_TYPES_KEY = "daywarden_custom_entry_types_v1";

export async function getCustomEntryTypes(): Promise<EntryTypeDefinition[]> {
  const { value } = await Preferences.get({
    key: CUSTOM_ENTRY_TYPES_KEY,
  });

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as EntryTypeDefinition[];
  } catch {
    return [];
  }
}

export async function saveCustomEntryTypes(
  entryTypes: EntryTypeDefinition[],
): Promise<void> {
  await Preferences.set({
    key: CUSTOM_ENTRY_TYPES_KEY,
    value: JSON.stringify(entryTypes),
  });
}

export async function addCustomEntryType(
  entryType: EntryTypeDefinition,
): Promise<EntryTypeDefinition[]> {
  const current = await getCustomEntryTypes();

  const updated = [...current, entryType];

  await saveCustomEntryTypes(updated);

  return updated;
}

export async function archiveCustomEntryType(
  entryTypeId: string,
): Promise<EntryTypeDefinition[]> {
  const current = await getCustomEntryTypes();

  const updated = current.map((entryType) =>
    entryType.id === entryTypeId
      ? {
          ...entryType,
          archived: true,
        }
      : entryType,
  );

  await saveCustomEntryTypes(updated);

  return updated;
}

export async function restoreCustomEntryType(
  entryTypeId: string,
): Promise<EntryTypeDefinition[]> {
  const current = await getCustomEntryTypes();

  const updated = current.map((entryType) =>
    entryType.id === entryTypeId
      ? {
          ...entryType,
          archived: false,
        }
      : entryType,
  );

  await saveCustomEntryTypes(updated);

  return updated;
}
