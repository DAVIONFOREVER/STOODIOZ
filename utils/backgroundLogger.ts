/**
 * Background logger for debugging. Only runs in development.
 * No UI, no user-visible changes. Used to capture failures in catch blocks
 * so we can see them in logs without affecting the app.
 */
const INGEST_URL = 'http://127.0.0.1:7242/ingest/cc967317-43d1-4243-8dbd-a2cbfedc53fb';

function isDev(): boolean {
  return typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env?.DEV === true;
}

export function logBackground(
  location: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (!isDev()) return;
  const payload = { location, message, data: data ?? {}, timestamp: Date.now() };
  console.debug('[bg]', location, message, data);
  fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
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
  fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
