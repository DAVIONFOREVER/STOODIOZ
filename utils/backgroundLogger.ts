/**
 * Background logger for debugging. Only runs in development.
 * No UI, no user-visible changes. Used to capture failures in catch blocks
 * so we can see them in logs without affecting the app.
 * Ingest fetch only runs when VITE_INGEST_ENABLED=true to avoid ERR_CONNECTION_REFUSED when no server is running.
 */
const INGEST_URL = 'http://127.0.0.1:7242/ingest/cc967317-43d1-4243-8dbd-a2cbfedc53fb';

function isDev(): boolean {
  return typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env?.DEV === true;
}

function isIngestEnabled(): boolean {
  return isDev() && (import.meta as any).env?.VITE_INGEST_ENABLED === 'true';
}

/** Send a payload to the debug ingest. No-op unless VITE_INGEST_ENABLED=true in dev. Use this to avoid ERR_CONNECTION_REFUSED when no ingest server is running. */
export function ingest(payload: Record<string, unknown>): void {
  if (!isIngestEnabled()) return;
  fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function logBackground(
  location: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (!isDev()) return;
  const payload = { location, message, data: data ?? {}, timestamp: Date.now() };
  console.debug('[bg]', location, message, data);
  if (isIngestEnabled()) {
    fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
}

export function logBackgroundError(
  location: string,
  message: string,
  error: unknown,
  data?: Record<string, unknown>
): void {
  if (!isDev()) return;
  const errMsg = error instanceof Error ? error.message : String(error);
  const payload = {
    location,
    message,
    data: { ...(data ?? {}), errorMessage: errMsg.slice(0, 200) },
    timestamp: Date.now(),
  };
  console.debug('[bg]', location, message, errMsg, data);
  if (isIngestEnabled()) {
    fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
}
