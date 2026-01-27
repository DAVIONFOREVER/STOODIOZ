export async function ariaAction<T>(name: string, inputs: any, opts: { idempotencyKey?: string, requesterId?: string } = {}) {
  // In production, this would call the deployed function URL directly.
  // The vite.config.ts proxy handles redirecting this for local development.
  const res = await fetch(`/api/aria/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : {})
    },
    body: JSON.stringify({ inputs, requester_account_id: opts.requesterId ?? null })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
