# Reply to Supabase re: webhook and wallet

**We are using `stripe-webhook`, not `webhook-handler`.**

Our Stripe endpoint URL is:
```
https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/stripe-webhook
```
We are **not** using `https://xxx.functions.supabase.co/webhook-handler`.

---

## 1) Secrets and endpoint URL

- Our **stripe-webhook** function reads **STRIPE_WEBHOOK_SECRET** (not WEBHOOK_SECRET_PRIMARY/SECONDARY).
- We have set in Supabase: **STRIPE_WEBHOOK_SECRET** = the `whsec_...` from our Stripe webhook endpoint.
- In Stripe we created an endpoint with URL **https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/stripe-webhook** and subscribed to checkout.session.completed (and other events). The signing secret for that endpoint is what we put in STRIPE_WEBHOOK_SECRET.

**Please keep reading STRIPE_WEBHOOK_SECRET** in the deployed stripe-webhook (do not switch to WEBHOOK_SECRET_PRIMARY unless you are changing to webhook-handler). We are not using webhook-handler for wallet.

---

## 2) Stripe events

We subscribed the stripe-webhook endpoint to: checkout.session.completed, account.updated, customer.subscription.created/deleted, invoice.paid, invoice.payment_failed. We will confirm in Stripe that recent deliveries are 2xx.

---

## 3) Wallet table and user mapping (for reference)

- **Table:** `public.profiles`
- **Columns:** `id` (uuid, primary key), `wallet_balance` (numeric), `wallet_transactions` (jsonb array of transaction objects)
- **User mapping for wallet top-up:** We put **metadata.payer_profile_id** on the Checkout Session when creating it (in create-wallet-checkout). So for `checkout.session.completed` with `metadata.type === 'wallet_topup'`, the user to credit is **session.metadata.payer_profile_id** (same as profiles.id).
- **Crediting:** We use the service role (SUPABASE_SERVICE_ROLE_KEY) in the function to PATCH `profiles` (wallet_balance and wallet_transactions). Idempotency is handled by recording `event.id` in a `stripe_events` table and skipping if already processed.

---

## 4) Balance crediting logic

Our **stripe-webhook** Edge Function (in the repo) **already** implements this: it verifies the Stripe signature, parses `checkout.session.completed`, and for `metadata.type === 'wallet_topup'` it credits **metadata.payer_profile_id** by updating `profiles.wallet_balance` and appending to `profiles.wallet_transactions`. So we do **not** need to add crediting logic to webhook-handler; we need **stripe-webhook** to remain deployed and to use **STRIPE_WEBHOOK_SECRET**.

---

## 5) Summary

- **Use stripe-webhook** (URL above), not webhook-handler.
- **Secret:** STRIPE_WEBHOOK_SECRET = Stripe endpoint signing secret (whsec_...).
- **Wallet:** public.profiles (id, wallet_balance, wallet_transactions); user = session.metadata.payer_profile_id for wallet_topup.
- No change to WEBHOOK_SECRET_PRIMARY/SECONDARY needed unless we switch to webhook-handler (we are not).

Please ensure the deployed **stripe-webhook** is the one from our repo (with STRIPE_WEBHOOK_SECRET and the crediting logic). If the deployed version was overwritten by a template that expects WEBHOOK_SECRET_PRIMARY, we can redeploy from our repo with `supabase functions deploy stripe-webhook`.
