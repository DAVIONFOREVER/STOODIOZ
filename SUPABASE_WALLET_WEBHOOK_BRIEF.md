# Wallet top-up: webhook + create-wallet-checkout — for Supabase support

Use this with Supabase (and Stripe) to fix wallet credit after add-funds. **No app code changes required** unless Supabase suggests them.

---

## 1. Stripe Dashboard

- **Webhooks → Endpoint URL**  
  Use: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`  
  (Replace `<project-ref>` with your Supabase project reference.)

- **Events**  
  Ensure **checkout.session.completed** is selected and delivery shows **2xx** for that event.

---

## 2. Supabase Edge Function secrets

Our **stripe-webhook** function expects these env vars (set in **Supabase Dashboard → Project Settings → Edge Functions → Secrets** or via CLI):

| Secret name in code | What to set |
|---------------------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_... or sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe (whsec_...) |

**Note:** The code reads `STRIPE_WEBHOOK_SECRET` (not `STRIPE_WEBHOOK_SIGNING_SECRET`). Set the Stripe webhook signing secret under the name `STRIPE_WEBHOOK_SECRET`.

The webhook uses **SERVICE_ROLE** for DB access: it calls Supabase REST with `SUPABASE_SERVICE_ROLE_KEY` (and `SUPABASE_URL`) from the function runtime, not the anon key.

---

## 3. create-wallet-checkout (snippet)

This is the Edge Function that creates the Stripe Checkout session for wallet top-up. It does **not** set `client_reference_id`; metadata carries the profile id.

```ts
// supabase/functions/create-wallet-checkout/index.ts (relevant part)
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  line_items: [{
    quantity: 1,
    price_data: {
      currency: 'usd',
      product_data: { name: 'Wallet Top-Up' },
      unit_amount: amountCents,
    },
  }],
  metadata: {
    type: 'wallet_topup',
    payer_profile_id: String(payerProfileId),  // profiles.id
    note: note ? String(note) : '',
  },
  success_url: successUrl,  // from client, e.g. https://app.com/?stripe=success
  cancel_url: cancelUrl,
});
return new Response(JSON.stringify({ sessionId: session.id }), { ... });
```

- **client_reference_id:** Not set. If Supabase recommends it, it can be set to `auth.user.id` or the same profile id (e.g. `payerProfileId`) for debugging; the webhook currently uses **metadata.payer_profile_id** only.
- **success_url:** Passed from the client; app expects to land on `origin/?stripe=success` and then refetches the user (and wallet) via `fetchCurrentUserProfile` / hydrate. It does **not** include `{CHECKOUT_SESSION_ID}`; the app refetches profile from the DB after redirect.

---

## 4. stripe-webhook (snippet) — wallet_topup + service role

Webhook uses **Supabase REST with service role** (no anon key). Deduplication is done via `stripe_events` (see below).

**Signature verification and event recording:**

```ts
const sig = req.headers.get('stripe-signature');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
if (!sig || !webhookSecret) throw new Error('Missing stripe signature or webhook secret');
const rawBody = await req.text();
const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

const shouldProcess = await recordStripeEvent(event.id, event.type, event.created);
if (!shouldProcess) return new Response(JSON.stringify({ received: true, deduped: true }), ...);

switch (event.type) {
  case 'checkout.session.completed': {
    const session = event.data.object;
    await handleCheckoutSessionCompleted(session);
    break;
  }
  // ... other events
}
```

**Wallet credit (handleCheckoutSessionCompleted for type === 'wallet_topup'):**

```ts
if (type === 'wallet_topup') {
  const payerId = metadata.payer_profile_id || metadata.payerProfileId;
  const note = metadata.note || '';
  if (payerId) {
    const tx = buildTx({
      description: 'Wallet top-up',
      amount,
      category: 'ADD_FUNDS',
      note,
    });
    await appendWalletTransaction(String(payerId), tx, amount);
  } else {
    console.warn('[stripe-webhook] wallet_topup: missing payer_profile_id in metadata', { metadata: Object.keys(metadata) });
  }
  return;
}
```

**appendWalletTransaction** (uses service role):

- GET `profiles?id=eq.<profileId>` (select includes `wallet_balance`, `wallet_transactions`).
- PATCH same profile: `wallet_balance = current + amount`, `wallet_transactions = [...currentTx, newTx].slice(-200)`.

All requests use:

- `apikey: SUPABASE_SERVICE_ROLE_KEY`
- `authorization: Bearer SUPABASE_SERVICE_ROLE_KEY`

So RLS does not apply to these requests.

---

## 5. DB: wallet tables and dedup

- **Wallet:** Stored on **profiles**: `wallet_balance` (number), `wallet_transactions` (JSONB array). No separate wallet table.
- **Dedup / double-credit:** We use a **stripe_events** table. Before processing any event we:
  - Try to insert a row with `event_id` (Stripe event id), `event_type`, `stripe_created_at`.
  - If a row with that `event_id` already exists (we check with a GET first), we skip processing and return `{ received: true, deduped: true }`.
  - So the same event is not applied twice. There is no unique constraint on `event_id` in the snippet; adding one is recommended so retries cannot double-insert.

**Suggested DB check:** Ensure `stripe_events` has a **unique constraint on event_id** so Stripe retries cannot create duplicate rows and accidentally bypass our “already processed” check.

---

## 6. Quick verification checklist (for you / Supabase)

- [ ] **Stripe → Webhooks:** Endpoint = `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`, event **checkout.session.completed** subscribed, deliveries show 2xx.
- [ ] **Supabase → Edge Function secrets:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (signing secret from Stripe) set for the project.
- [ ] **stripe-webhook** runs with service role: it uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from the runtime (no anon key).
- [ ] **create-wallet-checkout:** `metadata.payer_profile_id` is set to the **profiles.id** that should be credited; success_url is the app URL that triggers a fresh profile (and wallet) read.
- [ ] **profiles:** Has `wallet_balance` and `wallet_transactions`; no RLS blocking service role.
- [ ] **stripe_events:** Exists; ideally add a **unique constraint on event_id** to prevent double-credit on retries.

---

## 7. Optional: debug table (if Supabase suggests it)

If Supabase recommends instrumenting the webhook, you can add a small debug table and log:

- `event_type`
- `event_id`
- For `checkout.session.completed`: `metadata.payer_profile_id`, resolved profile id, amount, and whether `appendWalletTransaction` was called.

That would make it easy to see exactly what the webhook received and which profile/amount it tried to credit.

---

## 8. Do this now (Supabase’s list)

### Step 1 — Stripe Dashboard

- Set webhook endpoint to: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` (replace `<project-ref>` with your Supabase project ref).
- Subscribe to **checkout.session.completed**.
- Confirm recent deliveries show **2xx**. If not, copy the failing delivery details to send to Supabase.

### Step 2 — Supabase Edge Function secrets

Set these (Dashboard → Project Settings → Edge Functions → Secrets):

- `STRIPE_SECRET_KEY` = `sk_...`
- `STRIPE_WEBHOOK_SECRET` = `whsec_...`

Your code reads these exact names (not `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SIGNING_SECRET`).

### Step 3 — Optional DB hardening (recommended)

Run in Supabase SQL Editor (or your DB client) to prevent double-credit on Stripe retries:

```sql
ALTER TABLE stripe_events
ADD CONSTRAINT stripe_events_event_id_unique UNIQUE (event_id);
```

If the constraint already exists, you’ll get an error — that’s fine. If your table/column names differ, tell Supabase and they’ll adapt.

---

## 9. Reply template for Supabase

Copy the block below, fill in the bracketed bits, and paste back to Supabase so they can trace end-to-end.

```
Confirmations:

• Webhook endpoint URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
• Subscribed events: checkout.session.completed (and any others I use)
• Last checkout.session.completed delivery: [2xx or paste error status/code]
• Edge Function secrets set: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET

[Optional] One example session:
• Amount (cents or dollars): 
• Target profile_id (profiles.id that should be credited): 

[Optional] Last 1–2 webhook event IDs from Stripe (Developers → Webhooks → click a delivery → Event ID):
• Event ID 1: 
• Event ID 2: 
```

Supabase will use this to either say “all good; watch the next top-up” or give a precise 1–2 line patch.

---

You can share this file (and the snippets above) with Supabase so they can pinpoint any gap and suggest changes **without** you changing app code until they confirm what’s needed.
