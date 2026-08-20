import { getDaywardenDb } from "./db";

import type { DaywardenSettingValue } from "./db";

import type { DaywardenEntry } from "../types/entry";

import type { EntryTypeDefinition } from "../types/entryType";

import {
  DEFAULT_LIBRARY_FOLDER_ID,
  type LibraryFolder,
  type LibraryItem,
} from "../types/library";

import type { ActiveTimer } from "../types/timer";

type BackupSettingEntry = [string, DaywardenSettingValue];

interface BackupPayloadV1 {
  format: "daywarden-backup";

  version: 1;

  createdAt: string;

  data: {
    entries: DaywardenEntry[];

    customEntryTypes: EntryTypeDefinition[];

    settings: BackupSettingEntry[];
  };
}

interface BackupPayloadV2 {
  format: "daywarden-backup";

  version: 2;

  createdAt: string;

  data: {
    entries: DaywardenEntry[];

    customEntryTypes: EntryTypeDefinition[];

    settings: BackupSettingEntry[];

    libraryFolders: LibraryFolder[];

    libraryItems: LibraryItem[];

    activeTimers: ActiveTimer[];
  };
}

type DaywardenBackupPayload = BackupPayloadV1 | BackupPayloadV2;

interface EncryptedBackupEnvelope {
  format: "daywarden-encrypted-backup";

  version: 1;

  encryption: {
    algorithm: "AES-GCM";

    keyDerivation: "PBKDF2";

    hash: "SHA-256";

    iterations: number;

    salt: string;

    iv: string;
  };

  ciphertext: string;
}

const PBKDF2_ITERATIONS = 600_000;

const encoder = new TextEncoder();

const decoder = new TextDecoder();

export const ENCRYPTED_BACKUP_UNAVAILABLE_MESSAGE =
  "Encrypted backup and restore require a secure HTTPS connection.";

export function canUseEncryptedBackups(): boolean {
  return (
    window.isSecureContext &&
    typeof crypto !== "undefined" &&
    Boolean(crypto.subtle)
  );
}

function requireEncryptedBackupSupport(): void {
  if (!canUseEncryptedBackups()) {
    throw new Error(ENCRYPTED_BACKUP_UNAVAILABLE_MESSAGE);
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);

  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/*
 * Web Crypto's TypeScript definitions
 * require a normal ArrayBuffer rather
 * than the broader ArrayBufferLike.
 */
function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);

  copy.set(bytes);

  return copy.buffer;
}

async function deriveEncryptionKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const passwordBytes = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    bytesToArrayBuffer(passwordBytes),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",

      hash: "SHA-256",

      salt: bytesToArrayBuffer(salt),

      iterations,
    },
    keyMaterial,
    {
      name: "AES-GCM",

      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

async function createBackupPayload(): Promise<BackupPayloadV2> {
  const database = await getDaywardenDb();

  const transaction = database.transaction(
    [
      "entries",
      "customEntryTypes",
      "settings",
      "libraryFolders",
      "libraryItems",
      "activeTimers",
    ],
    "readonly",
  );

  const entryStore = transaction.objectStore("entries");

  const entryTypeStore = transaction.objectStore("customEntryTypes");

  const settingsStore = transaction.objectStore("settings");

  const folderStore = transaction.objectStore("libraryFolders");

  const libraryItemStore = transaction.objectStore("libraryItems");

  const timerStore = transaction.objectStore("activeTimers");

  const [
    entries,
    customEntryTypes,
    settingKeys,
    settingValues,
    libraryFolders,
    libraryItems,
    activeTimers,
  ] = await Promise.all([
    entryStore.getAll(),

    entryTypeStore.getAll(),

    settingsStore.getAllKeys(),

    settingsStore.getAll(),

    folderStore.getAll(),

    libraryItemStore.getAll(),

    timerStore.getAll(),
  ]);

  await transaction.done;

  const settings: BackupSettingEntry[] = settingKeys.map((key, index) => [
    String(key),

    settingValues[index],
  ]);

  return {
    format: "daywarden-backup",

    version: 2,

    createdAt: new Date().toISOString(),

    data: {
      entries,

      customEntryTypes,

      settings,

      libraryFolders,

      libraryItems,

      activeTimers,
    },
  };
}

async function encryptBackup(password: string): Promise<string> {
  const payload = await createBackupPayload();

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveEncryptionKey(password, salt, PBKDF2_ITERATIONS);

  const plaintext = encoder.encode(JSON.stringify(payload));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",

      iv: bytesToArrayBuffer(iv),
    },
    key,
    bytesToArrayBuffer(plaintext),
  );

  const envelope: EncryptedBackupEnvelope = {
    format: "daywarden-encrypted-backup",

    version: 1,

    encryption: {
      algorithm: "AES-GCM",

      keyDerivation: "PBKDF2",

      hash: "SHA-256",

      iterations: PBKDF2_ITERATIONS,

      salt: bytesToBase64(salt),

      iv: bytesToBase64(iv),
    },

    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };

  return JSON.stringify(envelope);
}

function getBackupFilename(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `daywarden-backup-` + `${year}-${month}-${day}` + `.dwbackup`;
}

export async function downloadEncryptedBackup(password: string): Promise<void> {
  requireEncryptedBackupSupport();

  const contents = await encryptBackup(password);

  const blob = new Blob([contents], {
    type: "application/octet-stream",
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;

  anchor.download = getBackupFilename();

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEncryptedEnvelope(value: unknown): value is EncryptedBackupEnvelope {
  if (!isRecord(value)) {
    return false;
  }

  if (value.format !== "daywarden-encrypted-backup" || value.version !== 1) {
    return false;
  }

  if (!isRecord(value.encryption)) {
    return false;
  }

  return (
    value.encryption.algorithm === "AES-GCM" &&
    value.encryption.keyDerivation === "PBKDF2" &&
    value.encryption.hash === "SHA-256" &&
    typeof value.encryption.iterations === "number" &&
    typeof value.encryption.salt === "string" &&
    typeof value.encryption.iv === "string" &&
    typeof value.ciphertext === "string"
  );
}

function hasValidSettings(value: unknown): value is BackupSettingEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (setting) =>
        Array.isArray(setting) &&
        setting.length === 2 &&
        typeof setting[0] === "string",
    )
  );
}

function isBackupPayloadV1(value: unknown): value is BackupPayloadV1 {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.format !== "daywarden-backup" ||
    value.version !== 1 ||
    typeof value.createdAt !== "string" ||
    !isRecord(value.data)
  ) {
    return false;
  }

  return (
    Array.isArray(value.data.entries) &&
    Array.isArray(value.data.customEntryTypes) &&
    hasValidSettings(value.data.settings)
  );
}

function isBackupPayloadV2(value: unknown): value is BackupPayloadV2 {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.format !== "daywarden-backup" ||
    value.version !== 2 ||
    typeof value.createdAt !== "string" ||
    !isRecord(value.data)
  ) {
    return false;
  }

  return (
    Array.isArray(value.data.entries) &&
    Array.isArray(value.data.customEntryTypes) &&
    hasValidSettings(value.data.settings) &&
    Array.isArray(value.data.libraryFolders) &&
    Array.isArray(value.data.libraryItems) &&
    Array.isArray(value.data.activeTimers)
  );
}

async function decryptBackup(
  contents: string,
  password: string,
): Promise<DaywardenBackupPayload> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("This is not a valid Daywarden backup.");
  }

  if (!isEncryptedEnvelope(parsed)) {
    throw new Error("This is not a supported Daywarden backup.");
  }

  const salt = base64ToBytes(parsed.encryption.salt);

  const iv = base64ToBytes(parsed.encryption.iv);

  const encrypted = base64ToBytes(parsed.ciphertext);

  const key = await deriveEncryptionKey(
    password,
    salt,
    parsed.encryption.iterations,
  );

  let decrypted: ArrayBuffer;

  try {
    decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",

        iv: bytesToArrayBuffer(iv),
      },
      key,
      bytesToArrayBuffer(encrypted),
    );
  } catch {
    throw new Error("The password is incorrect or the backup file is damaged.");
  }

  let payload: unknown;

  try {
    payload = JSON.parse(decoder.decode(decrypted));
  } catch {
    throw new Error("The backup contents could not be read.");
  }

  if (isBackupPayloadV2(payload)) {
    return payload;
  }

  if (isBackupPayloadV1(payload)) {
    return payload;
  }

  throw new Error("This Daywarden backup uses an unsupported format.");
}

function createInboxFolder(): LibraryFolder {
  const now = new Date().toISOString();

  return {
    id: DEFAULT_LIBRARY_FOLDER_ID,

    name: "Inbox",

    sortOrder: 0,

    createdAt: now,

    updatedAt: now,
  };
}

export async function restoreEncryptedBackup(
  file: File,
  password: string,
): Promise<void> {
  requireEncryptedBackupSupport();

  const contents = await file.text();

  /*
   * Decrypt and validate BEFORE
   * touching the current database.
   */
  const backup = await decryptBackup(contents, password);

  const database = await getDaywardenDb();

  const transaction = database.transaction(
    [
      "entries",
      "customEntryTypes",
      "settings",
      "libraryFolders",
      "libraryItems",
      "activeTimers",
    ],
    "readwrite",
  );

  const entryStore = transaction.objectStore("entries");

  const entryTypeStore = transaction.objectStore("customEntryTypes");

  const settingsStore = transaction.objectStore("settings");

  const folderStore = transaction.objectStore("libraryFolders");

  const libraryItemStore = transaction.objectStore("libraryItems");

  const timerStore = transaction.objectStore("activeTimers");

  /*
   * Restore means replacement,
   * not merging.
   */
  await Promise.all([
    entryStore.clear(),

    entryTypeStore.clear(),

    settingsStore.clear(),

    folderStore.clear(),

    libraryItemStore.clear(),

    timerStore.clear(),
  ]);

  for (const entry of backup.data.entries) {
    await entryStore.put(entry);
  }

  for (const entryType of backup.data.customEntryTypes) {
    await entryTypeStore.put(entryType);
  }

  for (const [key, value] of backup.data.settings) {
    await settingsStore.put(value, key);
  }

  if (backup.version === 2) {
    let hasInbox = false;

    for (const folder of backup.data.libraryFolders) {
      await folderStore.put(folder);

      if (folder.id === DEFAULT_LIBRARY_FOLDER_ID) {
        hasInbox = true;
      }
    }

    /*
     * Protect against a damaged or
     * unusual backup without Inbox.
     */
    if (!hasInbox) {
      await folderStore.put(createInboxFolder());
    }

    for (const item of backup.data.libraryItems) {
      await libraryItemStore.put(item);
    }

    for (const timer of backup.data.activeTimers) {
      await timerStore.put(timer);
    }
  } else {
    /*
     * Version-1 backups existed
     * before Library and timers.
     *
     * Restoring one therefore gives
     * us an empty Library with Inbox
     * and no running timers.
     */
    await folderStore.put(createInboxFolder());
  }

  await transaction.done;
}
