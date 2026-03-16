# Add Money → Wallet: Systematic Checklist

Use this to get funds loading into the app wallet. Follow in order.

---

## Flow (what must happen)

1. **User** clicks Add Funds → app calls **create-wallet-checkout** (local handler in dev, or Supabase edge function in prod).
2. **Stripe** creates a Checkout session with `metadata: { type: 'wallet_topup', payer_profile_id: <profiles.id> }`.
3. **User** pays on Stripe and is redirected to the app with `?stripe=success`.
4. **Stripe** sends `checkout.session.completed` to your **webhook URL** (Supabase `stripe-webhook`).
5. **stripe-webhook** reads `metadata.payer_profile_id`, adds the amount to that profile’s `wallet_balance` and appends to `wallet_transactions`.
6. **App** refetches the user (or polls `wallet_balance`) and shows the new balance.

If funds never appear, the break is usually at **4** (webhook not called) or **5** (webhook fails or wrong profile id).

---

## Step 1: Database has wallet columns

The webhook updates `profiles.wallet_balance` and `profiles.wallet_transactions`. Those columns must exist.

- [ ] In **Supabase → SQL Editor**, run the contents of **`supabase/ADD_FUNDS_RUN_IN_SUPABASE_WALLET.sql`** (or `supabase/migrations/20260203_stripe_events_and_wallet.sql`). This adds `wallet_balance`, `wallet_transactions`, etc. to `profiles`.
- [ ] In **Supabase → Table Editor → profiles**, confirm your user’s row has columns **wallet_balance** and **wallet_transactions** (they may be 0 and []).

---

## Step 2: Checkout session is created (redirect to Stripe works)

- [ ] You can click **Add Funds**, enter an amount, and get redirected to **Stripe Checkout** (or a popup opens to Stripe).
- [ ] **If this fails:**
  - **Dev:** Ensure `.env` has `STRIPE_SECRET_KEY=sk_test_...`. Restart the dev server. The app uses the local handler at `server/create-wallet-checkout-handler.mjs`.
  - **Prod / Supabase:** Deploy the edge function and set secrets:
    - `npx supabase functions deploy create-wallet-checkout --no-verify-jwt`
    - In **Supabase → Project Settings → Edge Functions → Secrets**: set **STRIPE_SECRET_KEY** (and that the function URL is correct).

---

## Step 3: Stripe webhook endpoint exists and is correct

The **only** thing that credits the wallet is the **stripe-webhook** function when Stripe sends `checkout.session.completed`. No webhook = no balance update.

- [ ] **Stripe Dashboard → Developers → Webhooks**: you have an endpoint whose URL is your **stripe-webhook** function, e.g.  
  `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`  
  (replace `<YOUR_PROJECT_REF>` with your Supabase project ref, e.g. from Supabase Dashboard URL or `VITE_SUPABASE_URL`).
- [ ] That endpoint is subscribed to at least **checkout.session.completed** (others optional: account.updated, customer.subscription.*, invoice.*).
- [ ] You have the **Signing secret** for this endpoint (starts with `whsec_...`). You will use it in Step 4.

---

## Step 4: stripe-webhook is deployed and has secrets

- [ ] **Supabase → Edge Functions**: **stripe-webhook** is deployed (from this repo: `supabase/functions/stripe-webhook/`).
- [ ] **Supabase → Project Settings → Edge Functions → Secrets** (or Dashboard → Edge Functions → stripe-webhook → Secrets):
  - **STRIPE_WEBHOOK_SECRET** = the `whsec_...` signing secret from Stripe (Step 3).
  - **SUPABASE_URL** and **SUPABASE_SERVICE_ROLE_KEY** are set (often provided by default for Supabase-hosted functions; if not, set them to your project URL and service role key).

Redeploy after changing secrets if needed:
`npx supabase functions deploy stripe-webhook --no-verify-jwt`

---

## Step 5: Correct profile id is sent and used

The webhook credits the profile where **profiles.id** = `metadata.payer_profile_id` from the Checkout session.

- [ ] The app sends **profiles.id** (auth user id = profile row id), not an artist/engineer/label row id. The code uses `currentUser.profile_id ?? currentUser.id`; both should be the same UUID as **profiles.id**.
- [ ] After one test payment: **Stripe Dashboard → Payments** → open the payment → **Metadata**. You should see **payer_profile_id** (or payerProfileId) = a UUID. That UUID must match **profiles.id** in Supabase for the user who added funds.

---

## Step 6: Verify webhook is called and succeeds

- [ ] **Stripe Dashboard → Developers → Webhooks** → your endpoint → **Recent deliveries**. After you complete a test Add Funds payment, there should be a **checkout.session.completed** delivery with status **200** (or 2xx). If it’s 4xx/5xx or “Failed”, open it and check the response body and Stripe’s retry logs.
- [ ] **Supabase → Edge Functions → stripe-webhook → Logs**: after the same payment, you should see a successful run (no uncaught errors). If you see “Missing stripe signature or webhook secret” or “profiles wallet PATCH failed”, fix the secret or DB (Steps 1 and 4).

---

## Step 7: Verify balance in the database

- [ ] In **Supabase → Table Editor → profiles**, find the row where **id** = the same UUID as **metadata.payer_profile_id** from Step 5. Check **wallet_balance** and **wallet_transactions**. After a successful webhook run, **wallet_balance** should be the amount you added (in dollars), and **wallet_transactions** should have at least one entry (e.g. ADD_FUNDS).

If Step 6 is 200 and Step 7 still shows 0, the webhook might be updating a different row (wrong id) or the PATCH might be failing silently; re-check Step 4 (service role key) and Step 5 (correct profile id).

---

## Step 8: App shows the balance

- [ ] After returning from Stripe (`?stripe=success`), the app refetches the user and/or polls **wallet_balance**. You should see the updated balance in the dashboard (e.g. Label Financials, Artist/Engineer/Producer wallet).
- [ ] If the DB has the correct balance but the app does not: do a **full refresh** (F5). If it still doesn’t show, check browser console for errors on the profile fetch or wallet poll; the app reads **profiles.wallet_balance** via `fetchCurrentUserProfile` (select *) and `fetchWalletBalanceOnly`.

---

## Quick reference: where things live

| What | Where |
|------|--------|
| Create checkout (dev) | `server/create-wallet-checkout-handler.mjs` |
| Create checkout (prod) | Supabase edge function `create-wallet-checkout` |
| Metadata on session | `type: 'wallet_topup'`, `payer_profile_id: profiles.id` |
| Credit wallet | Supabase edge function `stripe-webhook` → `handleCheckoutSessionCompleted` → `type === 'wallet_topup'` → `appendWalletTransaction` → `updateProfileWallet` |
| DB columns | `profiles.wallet_balance`, `profiles.wallet_transactions` (migration: `20260203_stripe_events_and_wallet.sql`) |
| App balance source | `currentUser.wallet_balance`, `walletBalanceFromPoll` (from refetch / wallet poll after return) |

---

## Common failures

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| Redirect to Stripe never happens | Missing STRIPE_SECRET_KEY or wrong URL | Step 2 |
| Redirect works, payment succeeds, balance stays 0 | Webhook not called or webhook fails | Steps 3, 4, 6 |
| Webhook 400 | Wrong or missing STRIPE_WEBHOOK_SECRET | Step 4 |
| Webhook 500 / “PATCH failed” | Missing wallet columns or wrong SUPABASE_SERVICE_ROLE_KEY | Steps 1, 4 |
| Wrong profile credited | metadata.payer_profile_id ≠ profiles.id (e.g. role table id sent) | Step 5; ensure app sends profiles.id |
| DB has balance, app doesn’t | Refetch/poll not running or failing | Step 8; refresh; check console |

---

## One-line summary

**Funds load only when Stripe sends `checkout.session.completed` to your deployed `stripe-webhook`, with STRIPE_WEBHOOK_SECRET set and `metadata.payer_profile_id` = your `profiles.id`, and the `profiles` table has `wallet_balance` / `wallet_transactions`.**  
Work through the steps above in order to find where the chain breaks.
