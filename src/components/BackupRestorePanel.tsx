import { useState } from "react";

import {
  canUseEncryptedBackups,
  downloadEncryptedBackup,
  ENCRYPTED_BACKUP_UNAVAILABLE_MESSAGE,
  restoreEncryptedBackup,
} from "../data/backup";

function BackupRestorePanel() {
  const encryptedBackupsAvailable = canUseEncryptedBackups();

  const [backupPassword, setBackupPassword] = useState("");

  const [confirmBackupPassword, setConfirmBackupPassword] = useState("");

  const [restorePassword, setRestorePassword] = useState("");

  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const [backupBusy, setBackupBusy] = useState(false);

  const [restoreBusy, setRestoreBusy] = useState(false);

  const [backupMessage, setBackupMessage] = useState("");

  const [restoreMessage, setRestoreMessage] = useState("");

  async function handleBackup() {
    setBackupMessage("");

    if (backupPassword.length < 8) {
      setBackupMessage("Use a backup password of at least 8 characters.");

      return;
    }

    if (backupPassword !== confirmBackupPassword) {
      setBackupMessage("The passwords do not match.");

      return;
    }

    setBackupBusy(true);

    try {
      await downloadEncryptedBackup(backupPassword);

      setBackupMessage("Encrypted backup created.");

      setBackupPassword("");

      setConfirmBackupPassword("");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === ENCRYPTED_BACKUP_UNAVAILABLE_MESSAGE
      ) {
        setBackupMessage(error.message);
      } else {
        setBackupMessage("Daywarden couldn't create the backup.");
      }
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRestore() {
    setRestoreMessage("");

    if (!restoreFile) {
      setRestoreMessage("Choose a Daywarden backup file first.");

      return;
    }

    if (!restorePassword) {
      setRestoreMessage("Enter the backup password.");

      return;
    }

    const confirmed = window.confirm(
      "Restore this backup? Your current Daywarden data on this device will be replaced.",
    );

    if (!confirmed) {
      return;
    }

    setRestoreBusy(true);

    try {
      await restoreEncryptedBackup(restoreFile, restorePassword);

      /*
       * Reload so App.tsx reads the
       * restored IndexedDB state.
       */
      window.location.reload();
    } catch (error) {
      if (error instanceof Error) {
        setRestoreMessage(error.message);
      } else {
        setRestoreMessage("Daywarden couldn't restore this backup.");
      }
    } finally {
      setRestoreBusy(false);
    }
  }

  return (
    <div className="backup-panel">
      {!encryptedBackupsAvailable && (
        <p className="backup-warning" role="status">
          Encrypted backup and restore require a secure HTTPS connection. Open
          Daywarden over HTTPS to use encryption.
        </p>
      )}
      <div className="backup-block">
        <strong>Create backup</strong>

        <p>Save an encrypted copy of your Daywarden data safely.</p>

        <label>
          Backup password
          <input
            type="password"
            autoComplete="new-password"
            value={backupPassword}
            onChange={(event) => setBackupPassword(event.target.value)}
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            value={confirmBackupPassword}
            onChange={(event) => setConfirmBackupPassword(event.target.value)}
          />
        </label>

        <p className="backup-warning">
          Daywarden cannot recover this password if you forget it.
        </p>

        <button
          className="settings-action"
          type="button"
          disabled={backupBusy || !encryptedBackupsAvailable}
          onClick={handleBackup}
        >
          {backupBusy ? "Creating backup..." : "Create encrypted backup"}
        </button>

        {backupMessage && (
          <p className="settings-note" aria-live="polite">
            {backupMessage}
          </p>
        )}
      </div>

      <div className="backup-divider" />

      <div className="backup-block">
        <strong>Restore backup</strong>

        <p>Restore Daywarden from an encrypted backup file.</p>

        <label>
          Backup file
          <input
            type="file"
            accept=".dwbackup"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;

              setRestoreFile(file);

              setRestoreMessage("");
            }}
          />
        </label>

        {restoreFile && (
          <p className="selected-backup-file">Selected: {restoreFile.name}</p>
        )}

        <label>
          Backup password
          <input
            type="password"
            autoComplete="current-password"
            value={restorePassword}
            onChange={(event) => setRestorePassword(event.target.value)}
          />
        </label>

        <p className="backup-warning">
          Restoring replaces the current Daywarden data on this device.
        </p>

        <button
          className="settings-action destructive-action"
          type="button"
          disabled={restoreBusy || !encryptedBackupsAvailable}
          onClick={handleRestore}
        >
          {restoreBusy ? "Restoring..." : "Restore backup"}
        </button>

        {restoreMessage && (
          <p className="settings-note" aria-live="polite">
            {restoreMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default BackupRestorePanel;
