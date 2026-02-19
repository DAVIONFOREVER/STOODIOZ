# Reply to Supabase — wallet + client timeouts

Use this to answer Supabase’s steps and send the snippets they asked for.

---

## Copy-paste this block (Supabase’s exact format)

Fill in the blanks and paste your reply. Then add the “Also include” line.

```
§9 – Reply template
Webhook URL: https://[PROJECT-REF].supabase.co/functions/v1/stripe-webhook
Subscribed events: checkout.session.completed
Last checkout.session.completed delivery status: 2xx | error (paste error body)
Secrets set:
STRIPE_SECRET_KEY = yes/no
STRIPE_WEBHOOK_SECRET = yes/no
Profile to credit: profile_id=[YOUR-UUID] | Look up by email: [your@email.com]
Optional example session: $[AMOUNT] to profile_id=[UUID]
Optional last 1–2 Stripe webhook event IDs: evt_xxx, evt_yyy
App code changed: Yes — retry/backoff and 30s hydrate timeout added in apiService.ts (one retry after 2s on timeout; HYDRATE_TIMEOUT_MS for getSession/profiles in hydrate path).

Also include (recommended): see REPLY_TO_SUPABASE.md in repo.
```

**Get [PROJECT-REF]:** Supabase Dashboard → Project Settings → General → Reference ID.  
**Get profile_id:** Table Editor → `profiles` → your row → copy `id` (UUID). Or use “Look up by email: your@email.com”.

---

## Step 1 — §9 template (alternative long form)

Copy the block below, replace the bracketed parts with your real values, then paste in your reply to Supabase.

```
Confirmations:

• Webhook endpoint URL: https://[YOUR-PROJECT-REF].supabase.co/functions/v1/stripe-webhook
• Subscribed events: checkout.session.completed [list any others you have, e.g. account.updated, customer.subscription.*, invoice.paid]
• Last checkout.session.completed delivery: [2xx or paste error code/message]
• Edge Function secrets set: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET

[Optional] One example session:
• Amount (cents or dollars): [e.g. 1000 cents or $10]
• Target profile_id (profiles.id that should be credited): [see below how to get it]

[Optional] Last 1–2 webhook event IDs from Stripe (Developers → Webhooks → click a delivery → Event ID):
• Event ID 1: evt_...
• Event ID 2: evt_...
```

**How to get your project ref:** Supabase Dashboard → Project Settings → General → Reference ID.

**How to get profile_id:**  
- In the app: after login, open browser DevTools → Console and run: `window.__STOODIOZ_PROFILE_ID__` (if we expose it), or  
- In Supabase: Table Editor → `profiles` → find your row by email (column `email` or the one you use) → copy the `id` (UUID).  
If you don’t know it, reply with: “Profile lookup by email: [your@email.com]” and they can query it.

---

## Step 2 — Give Supabase your profile_id (or email)

Reply with one of:

- **“profile_id to credit: `<paste-UUID>`”**  
  Example: `profile_id to credit: a1b2c3d4-e5f6-7890-abcd-ef1234567890`

- **“Look up by email: your@email.com”**  
  So they can run: `SELECT id, email, wallet_balance, updated_at FROM profiles WHERE email = 'your@email.com';`

They will then run:

- `SELECT * FROM stripe_events ORDER BY stripe_created_at DESC LIMIT 10;`
- `SELECT id, wallet_balance, updated_at FROM profiles WHERE id = 'your-profile-id';`

---

## Step 3 — Run the dedup constraint (once)

In **Supabase → SQL Editor**, run:

```sql
ALTER TABLE stripe_events
ADD CONSTRAINT stripe_events_event_id_unique UNIQUE (event_id);
```

If you get “constraint already exists”, you’re done. If your table/column names differ, tell Supabase and they’ll adapt.

---

## Step 4 — Debug logging (only if Supabase asks)

They said they’ll add minimal webhook debug (event_id, event_type, metadata.payer_profile_id, amount, whether appendWalletTransaction ran) only if deliveries are 2xx but no credit is visible. No action for you until they ask.

---

## Step 5 — Snippets for client timeouts (paste to Supabase)

They asked for the code around **posts.globalFeed**, **auth.getSession**, and **profiles.select** so they can propose a retry/backoff patch. Below are the exact snippets.

### Timeout constant and helper (apiService.ts)

```ts
// Line 9
const DB_TIMEOUT_MS = 18_000; // Fail fast when Supabase is unreachable

// Lines 73-83
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`[timeout] ${label} exceeded ${ms}ms`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}
```

### safeSelect (used by globalFeed) — apiService.ts

```ts
// Lines 136-147
async function safeSelect<T = any>(label: string, fn: () => Promise<{ data: T; error: any }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await withTimeout(fn(), DB_TIMEOUT_MS, label);
    if (error) {
      console.warn(`[apiService] ${label} error:`, error);
      return fallback;
    }
    return (data as any) ?? fallback;
  } catch (e) {
    console.warn(`[apiService] ${label} threw:`, e);
    return fallback;
  }
}
```

### fetchGlobalFeed (posts.globalFeed) — apiService.ts

```ts
// Lines 1516-1529
export async function fetchGlobalFeed(limit = 50, before?: string): Promise<any[]> {
  const supabase = getSupabase();
  const raw = await safeSelect('posts.globalFeed', async () => {
    let q = supabase
      .from(TABLES.posts)
      .select('*')
      .order('created_at', { ascending: false });
    if (before) q = (q as any).lt('created_at', before);
    const { data, error } = await (q as any).limit(limit);
    return { data, error };
  }, []);
  const rows = Array.isArray(raw) ? raw : [];
  return rows.map(normalizePostRow).filter((p) => p.authorId);
}
```

### fetchCurrentUserProfile — auth.getSession and profiles.select (apiService.ts)

**First path (supabase-js, no getSession) — 10s timeout:**

```ts
// Lines 176, 195-198
const AUTH_FAST_MS = 10_000; // Try supabase-js first; avoid blocking on getSession after redirect (e.g. Stripe)

// Try supabase-js first (no getSession)
const q = supabase.from(TABLES.profiles).select('*').eq('id', uid).single();
const { data: profile, error } = await withTimeout(q as any, AUTH_FAST_MS, 'profiles.select');
```

**REST path (uses getSession) — 18s timeout:**

```ts
// Lines 244, 255-264
const { data: sess } = await withTimeout(supabase.auth.getSession() as any, DB_TIMEOUT_MS, 'auth.getSession');
const token = sess?.session?.access_token;
// ...
const res = await fetch(`${url}/rest/v1/${TABLES.profiles}?id=eq.${encodeURIComponent(uid)}&select=*`, {
  method: 'GET',
  headers: { apikey: anon, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  signal: controller.signal,
});
// (controller aborts after DB_TIMEOUT_MS)
```

**Fallback supabase-js path (after REST fails) — 18s timeout:**

```ts
// Lines 306-308
const q = supabase.from(TABLES.profiles).select('*').eq('id', uid).single();
const { data: profile, error } = await withTimeout(q as any, DB_TIMEOUT_MS, 'profiles.select');
```

**Entry point:** `fetchCurrentUserProfile(uid: string)` is called from:

- `App.tsx`: `hydrateUser` (after auth listener and after Stripe success refetch)
- Uses: (1) supabase-js profiles.select (10s), then (2) getSession + REST profiles (18s), then (3) supabase-js profiles.select again (18s). No retry today; any timeout throws and hydrate fails.

---

## What to send Supabase now

1. **§9 template** filled (endpoint, events, last delivery 2xx/error, secrets confirmed).
2. **profile_id** (or “look up by email: …”).
3. **Optional:** paste the **Step 5 snippets** (or link to this file) so they can propose the retry/backoff patch.

They will then:

- Verify webhook path/secrets vs your code  
- Check `stripe_events` and your profile’s `wallet_balance`  
- If 2xx but no credit, give a 1–2 line patch or minimal debug logging  
- Propose a minimal retry/backoff patch for the client timeouts
