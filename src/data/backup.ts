import { getDaywardenDb } from "./db";

import type { DaywardenEntry } from "../types/entry";
import type {
  EntryTypeDefinition,
  EntryTypePreferences,
} from "../types/entryType";
import type { ThemeMode } from "../types/settings";

type BackupSettingValue = EntryTypePreferences | ThemeMode | boolean | string;

interface DaywardenBackupPayload {
  format: "daywarden-backup";
  version: 1;
  createdAt: string;

  data: {
    entries: DaywardenEntry[];

    customEntryTypes: EntryTypeDefinition[];

    settings: Array<[string, BackupSettingValue]>;
  };
}

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

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);

  copy.set(bytes);

  return copy.buffer;
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

async function deriveEncryptionKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
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

async function createBackupPayload(): Promise<DaywardenBackupPayload> {
  const database = await getDaywardenDb();

  const transaction = database.transaction(
    ["entries", "customEntryTypes", "settings"],
    "readonly",
  );

  const entries = await transaction.objectStore("entries").getAll();

  const customEntryTypes = await transaction
    .objectStore("customEntryTypes")
    .getAll();

  const settings: Array<[string, BackupSettingValue]> = [];

  const settingsStore = transaction.objectStore("settings");

  let cursor = await settingsStore.openCursor();

  while (cursor) {
    settings.push([String(cursor.key), cursor.value]);

    cursor = await cursor.continue();
  }

  await transaction.done;

  return {
    format: "daywarden-backup",

    version: 1,

    createdAt: new Date().toISOString(),

    data: {
      entries,
      customEntryTypes,
      settings,
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
    plaintext,
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

function isBackupPayload(value: unknown): value is DaywardenBackupPayload {
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

  const { entries, customEntryTypes, settings } = value.data;

  if (
    !Array.isArray(entries) ||
    !Array.isArray(customEntryTypes) ||
    !Array.isArray(settings)
  ) {
    return false;
  }

  return settings.every(
    (setting) =>
      Array.isArray(setting) &&
      setting.length === 2 &&
      typeof setting[0] === "string",
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

  if (!isBackupPayload(payload)) {
    throw new Error("This Daywarden backup uses an unsupported format.");
  }

  return payload;
}

export async function restoreEncryptedBackup(
  file: File,
  password: string,
): Promise<void> {
  const contents = await file.text();

  /*
   * Decrypt and validate everything
   * BEFORE altering IndexedDB.
   */
  const backup = await decryptBackup(contents, password);

  const database = await getDaywardenDb();

  const transaction = database.transaction(
    ["entries", "customEntryTypes", "settings"],
    "readwrite",
  );

  const entryStore = transaction.objectStore("entries");

  const entryTypeStore = transaction.objectStore("customEntryTypes");

  const settingsStore = transaction.objectStore("settings");

  await entryStore.clear();

  await entryTypeStore.clear();

  await settingsStore.clear();

  for (const entry of backup.data.entries) {
    await entryStore.put(entry);
  }

  for (const entryType of backup.data.customEntryTypes) {
    await entryTypeStore.put(entryType);
  }

  for (const [key, value] of backup.data.settings) {
    await settingsStore.put(value, key);
  }

  await transaction.done;
}
