# Wallet Balance + Booking Payment (Stripe) — Checklist

Use this to (1) get your **wallet balance** to update after a top-up, and (2) support **both** paying from wallet and paying for a session **directly with Stripe** (card) so you can book without loading money first.

---

## Part A: Why balance doesn’t update after Stripe top-up

The app **only** credits your wallet when Stripe tells the backend that payment succeeded. That happens in this order:

1. You click **Add Funds** → app calls **create-wallet-checkout** (Stripe Checkout session).
2. You pay on **Stripe** and are redirected back with `?stripe=success`.
3. **Stripe** sends a `checkout.session.completed` event to your **stripe-webhook** (Supabase Edge Function).
4. **stripe-webhook** sees `metadata.type === 'wallet_topup'`, then adds the amount to `profiles.wallet_balance` for `metadata.payer_profile_id`.
5. The app refetches your user and/or polls `wallet_balance` and shows it in the UI.

If the balance never updates, the break is usually at **step 3** (webhook not called) or **step 4** (webhook fails or wrong profile id).

---

## Part A — Step-by-step troubleshooting

### A1. Database has wallet columns

- [ ] In **Supabase → SQL Editor**, run the migration that adds `wallet_balance` and `wallet_transactions` to `profiles` (e.g. `supabase/ADD_FUNDS_RUN_IN_SUPABASE_WALLET.sql` or the stripe/wallet migration).
- [ ] In **Supabase → Table Editor → profiles**, confirm your user’s row has **wallet_balance** and **wallet_transactions** (can be `0` and `[]`).

### A2. Redirect to Stripe works (top-up starts)

- [ ] You can click **Add Funds**, enter an amount, and get redirected to **Stripe Checkout**.
- [ ] If this fails: set **STRIPE_SECRET_KEY** (e.g. in Supabase Edge Function secrets for `create-wallet-checkout`, or in `.env` for local dev) and redeploy/restart as needed.

### A3. Stripe webhook endpoint exists and is correct

- [ ] **Stripe Dashboard → Developers → Webhooks**: there is an endpoint URL pointing to your **stripe-webhook** function, e.g.  
  `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`
- [ ] That endpoint is subscribed to **checkout.session.completed** (at least).
- [ ] You have the **Signing secret** (`whsec_...`) for this endpoint (needed in A4).

### A4. stripe-webhook is deployed and has secrets

- [ ] **Supabase → Edge Functions**: **stripe-webhook** is deployed.
- [ ] In **Project Settings → Edge Functions → Secrets** (or the function’s secrets):
  - **STRIPE_WEBHOOK_SECRET** = the `whsec_...` from Stripe.
  - **SUPABASE_URL** and **SUPABASE_SERVICE_ROLE_KEY** are set.
- [ ] Redeploy after changing secrets:  
  `npx supabase functions deploy stripe-webhook --no-verify-jwt`

### A5. Correct profile id is sent and used

- [ ] The app sends **profiles.id** (same as auth user id) as `payer_profile_id` / `payerProfileId` when creating the wallet checkout — not an artist/stoodio/engineer row id.
- [ ] After a test top-up: **Stripe Dashboard → Payments** → open the payment → **Metadata**. Confirm **payer_profile_id** (or `payerProfileId`) is a UUID that matches **profiles.id** in Supabase for your account.

### A6. Webhook is called and succeeds

- [ ] **Stripe Dashboard → Developers → Webhooks** → your endpoint → **Recent deliveries**. After completing a test Add Funds payment, there is a **checkout.session.completed** delivery with status **200** (or 2xx). If 4xx/5xx or failed, check the response and fix (e.g. secret, DB, function logs).
- [ ] **Supabase → Edge Functions → stripe-webhook → Logs**: after the same payment, the run succeeds (no uncaught errors). No “Missing stripe signature or webhook secret” or “profiles wallet PATCH failed”.

### A7. Balance in the database

- [ ] In **Supabase → Table Editor → profiles**, find the row where **id** = the same UUID as **metadata.payer_profile_id** from A5. After a successful webhook run, **wallet_balance** shows the topped-up amount and **wallet_transactions** has at least one entry (e.g. ADD_FUNDS).

### A8. App shows the balance

- [ ] After returning from Stripe (`?stripe=success`), the app refetches the user and/or runs the wallet poll. The dashboard wallet balance updates (or a full refresh shows it).
- [ ] If the DB has the correct balance but the app does not: hard refresh (F5). If still wrong, check browser console for errors on profile fetch or wallet poll; the app reads **profiles.wallet_balance** via `fetchCurrentUserProfile` and `fetchWalletBalanceOnly`.

---

## Part B: Two ways to pay for a session (Stripe)

You want **both**:

- **Option 1 — Pay from wallet:** Top up first, then book using your wallet balance (balance must be ≥ session total).
- **Option 2 — Pay for session with card (Stripe):** Book and pay the session amount directly via Stripe Checkout, without loading money onto the app first.

The app already supports **Option 2** via **create-booking-checkout** and the booking flow that redirects to Stripe. The booking modal has been updated so that:

- If your **wallet balance is less than** the session total, you can still click **Request Session** and complete payment with your card on Stripe (no need to top up first).
- If you prefer to top up first, you can use **Add Funds** from the dashboard or the link in the booking modal, then book using your balance when sufficient.

Checklist for “pay for session with Stripe”:

- [ ] You can open a studio, pick time/room, and open the booking modal.
- [ ] With **low or zero** wallet balance, **Request Session** still submits and redirects you to **Stripe Checkout** to pay the session total.
- [ ] After paying on Stripe, you are redirected back and the booking appears (e.g. My Bookings) and/or confirmation view.
- [ ] (Optional) When your balance is **enough** to cover the total, the same **Request Session** flow can still use Stripe for that booking (future enhancement: “Pay from wallet” could deduct balance and skip Stripe for that path).

---

## Quick reference

| What | Where |
|------|--------|
| Create wallet top-up session | Edge function `create-wallet-checkout` |
| Credit wallet after payment | Edge function `stripe-webhook` → `handleCheckoutSessionCompleted` → `type === 'wallet_topup'` |
| Pay for session (card) | Edge function `create-booking-checkout` → Stripe Checkout → webhook confirms booking |
| Profile id for wallet | Must be **profiles.id** (UUID), not artist/stoodio/engineer id |
| App balance display | `walletBalanceFromPoll ?? currentUser.wallet_balance` (refetch + poll after Stripe return) |

---

## One-line summary

**Wallet balance updates only when Stripe sends `checkout.session.completed` to your deployed `stripe-webhook` with `STRIPE_WEBHOOK_SECRET` set and `metadata.payer_profile_id` = your `profiles.id`.**  
**You can pay for a session with your card via Stripe even when your wallet balance is low; use the checklist above to fix balance updates and verify both payment options.**
