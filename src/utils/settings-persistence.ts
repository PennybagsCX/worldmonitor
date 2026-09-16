export interface ExportedSettings {
  version: number;
  timestamp: string;
  variant: string;
  data: Record<string, string>;
}

export interface ImportResult {
  success: boolean;
  keysImported: number;
  error?: string;
}

import { CLOUD_SYNC_KEYS } from './sync-keys';
import { invalidatePanelStorageCacheForKeys } from './panel-storage';
import { safeStorageSnapshot } from './safe-storage';

const MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024;

const SETTINGS_KEY_PREFIXES: readonly string[] = [
  ...CLOUD_SYNC_KEYS,
  // device-local / export-only (excluded from cloud sync)
  'worldmonitor-live-channels',
  'worldmonitor-active-channel',
  'worldmonitor-runtime-feature-toggles',
  'wm-globe-render-scale',
  'wm-live-streams-always-on',
  'worldmonitor-webcam-prefs',
  'wm-map-theme:',
  'map-height',
  'map-split-height',
  'map-col-width',
  'map-side',
  'map-pinned',
  'mobile-map-collapsed',
  'positive-threshold',
];

function isSettingsKey(key: string): boolean {
  return SETTINGS_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isMonitorList(value: unknown): boolean {
  return Array.isArray(value) && value.every(monitor =>
    isRecord(monitor)
    && typeof monitor.id === 'string'
    && typeof monitor.color === 'string'
    && Array.isArray(monitor.keywords)
    && monitor.keywords.every(keyword => typeof keyword === 'string')
    && (monitor.name === undefined || typeof monitor.name === 'string')
    && (monitor.lat === undefined || (typeof monitor.lat === 'number' && Number.isFinite(monitor.lat)))
    && (monitor.lon === undefined || (typeof monitor.lon === 'number' && Number.isFinite(monitor.lon))),
  );
}

function parseImportedEntries(parsed: unknown): Array<[string, string]> {
  if (!isRecord(parsed) || !isRecord(parsed.data)) {
    throw new Error('Invalid format: expected an object with a data property.');
  }
  if (parsed.version !== 1) {
    throw new Error(`Unsupported settings version: ${parsed.version}`);
  }

  const entries: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!isSettingsKey(key)) continue;
    if (typeof value !== 'string') {
      throw new Error(`Invalid setting: ${key} must be a string.`);
    }
    // The monitor reader trusts the stored JSON and immediately uses array
    // and string methods. Reject invalid records before changing any settings.
    if (key === 'worldmonitor-monitors' && !isMonitorList(JSON.parse(value))) {
      throw new Error('Invalid setting: worldmonitor-monitors must contain monitor records.');
    }
    entries.push([key, value]);
  }
  return entries;
}

export const __testing__ = { isSettingsKey };

export function exportSettings(): void {
  const data: Record<string, string> = {};

  // Storage that cannot be read has no settings to export, and handing the
  // user a downloadable file anyway is worse than failing: the caller in
  // preferences-content.ts wraps this in try/catch and shows `exportSuccess`
  // when it returns, so a silent empty payload becomes a green "Exported"
  // toast over a backup containing nothing (#7833 review). Stay loud.
  //
  // Testing AVAILABILITY is not enough on its own, which an earlier round of
  // this fix got wrong: a handle can exist while enumeration or an individual
  // read throws, and the degrading accessors then return `[]`/`null` and
  // rebuild exactly that empty-but-successful backup. The snapshot reports
  // whether the reads themselves succeeded, so a partial one fails instead of
  // shipping a backup the user would only discover was empty when restoring.
  const snapshot = safeStorageSnapshot();
  if (!snapshot.ok) {
    throw new Error('Settings export could not read browser storage.');
  }

  let variant = 'full';
  for (const [key, value] of snapshot.entries) {
    if (key === 'worldmonitor-variant' && value) variant = value;
    if (isSettingsKey(key)) data[key] = value;
  }

  const exportData: ExportedSettings = {
    version: 1,
    timestamp: new Date().toISOString(),
    variant,
    data,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `worldmonitor-settings-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importSettings(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMPORT_SIZE_BYTES) {
      reject(new Error('File is too large. Maximum size is 5MB.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const entries = parseImportedEntries(JSON.parse(result));

        let keysImported = 0;
        const importedKeys: string[] = [];
        for (const [key, value] of entries) {
          localStorage.setItem(key, value);
          keysImported++;
          importedKeys.push(key);
        }
        invalidatePanelStorageCacheForKeys(importedKeys);

        resolve({ success: true, keysImported });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
