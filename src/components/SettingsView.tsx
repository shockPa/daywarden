import type { ThemeMode } from "../types/settings";
import BackupRestorePanel from "./BackupRestorePanel";

interface SettingsViewProps {
  themeMode: ThemeMode;

  offlineReady: boolean;

  needRefresh: boolean;

  checkingForUpdates: boolean;

  lastUpdateCheck: string | null;

  updateMessage: string;

  onThemeChange: (mode: ThemeMode) => void;

  onCheckForUpdates: () => void;

  onInstallUpdate: () => void;

  onManageEntryTypes: () => void;

  onClose: () => void;
}

function SettingsView({
  themeMode,
  offlineReady,
  needRefresh,
  checkingForUpdates,
  lastUpdateCheck,
  updateMessage,
  onThemeChange,
  onCheckForUpdates,
  onInstallUpdate,
  onManageEntryTypes,
  onClose,
}: SettingsViewProps) {
  return (
    <section className="settings-view">
      <div className="settings-heading">
        <h1>Settings</h1>

        <button
          type="button"
          className="settings-close"
          aria-label="Close settings"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <section className="settings-section">
        <h2>Appearance</h2>

        <div className="theme-options">
          {(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={
                themeMode === mode ? "theme-option selected" : "theme-option"
              }
              onClick={() => onThemeChange(mode)}
            >
              {mode === "system"
                ? "System"
                : mode === "light"
                  ? "Light"
                  : "Dark"}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>Offline & updates</h2>

        <div className="settings-row">
          <div>
            <strong>Offline access</strong>

            <p>Daywarden can run without an internet connection.</p>
          </div>

          <span className={offlineReady ? "status-good" : "status-muted"}>
            {offlineReady ? "Ready" : "Preparing"}
          </span>
        </div>

        {needRefresh ? (
          <div className="update-available">
            <div>
              <strong>Update available</strong>

              <p>A newer version of Daywarden is ready.</p>
            </div>

            <button type="button" onClick={onInstallUpdate}>
              Update
            </button>
          </div>
        ) : (
          <button
            className="settings-action"
            type="button"
            disabled={checkingForUpdates}
            onClick={onCheckForUpdates}
          >
            {checkingForUpdates ? "Checking..." : "Check for updates"}
          </button>
        )}

        {updateMessage && <p className="settings-note">{updateMessage}</p>}

        {lastUpdateCheck && (
          <p className="settings-note">
            Last checked{" "}
            {new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(lastUpdateCheck))}
          </p>
        )}
      </section>

      <section className="settings-section">
        <h2>Customization</h2>

        <button
          className="settings-action"
          type="button"
          onClick={onManageEntryTypes}
        >
          Manage entry types
        </button>
      </section>

      <section className="settings-section">
        <h2>Data</h2>

        <BackupRestorePanel />
      </section>

      <section className="settings-section">
        <h2>Privacy</h2>

        <p className="privacy-copy">
          Your Daywarden entries are stored locally on this device. They are not
          uploaded to Daywarden.
        </p>
      </section>
    </section>
  );
}

export default SettingsView;
