# Stripe Webhook Checklist — Wallet Top-Up

Your **create-wallet-checkout** and **stripe-webhook** metadata are already aligned. No code changes needed for that.

## create-wallet-checkout sends (metadata)
- `type: 'wallet_topup'`
- `payer_profile_id: <profile id>`
- `note: <optional>`

## stripe-webhook reads (wallet_topup)
- `metadata.type === 'wallet_topup'` ✓
- `metadata.payer_profile_id` (or `payerProfileId`) ✓
- `metadata.note` ✓

So when Stripe sends `checkout.session.completed`, the webhook will credit the correct profile.

---

## What you still need to do (in Stripe + Supabase)

### 1. Add webhook endpoint in Stripe
- Go to **Stripe Dashboard** → **Developers** → **Webhooks** → **Add endpoint**.
- **Endpoint URL:**  
  `https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/stripe-webhook`
- **Events to send:** enable at least **checkout.session.completed**.
- Save. Stripe will show a **Signing secret** (starts with `whsec_`). Copy it.

### 2. Set the signing secret in Supabase
In your terminal (from the project root):

```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

Paste your real `whsec_...` value from the Stripe webhook page.

### 3. (Optional) Test the webhook
- In Stripe Dashboard: open your webhook → **Send test event** → **checkout.session.completed**.
- Or with Stripe CLI:  
  `stripe listen --forward-to https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/stripe-webhook`  
  then in another terminal:  
  `stripe trigger checkout.session.completed`

### 4. Confirm in the DB
After a real or test payment, check in Supabase (Table Editor → **profiles**): the row for your profile should have an updated **wallet_balance** and **wallet_transactions** (if your schema has it).

---

## Summary
- **Metadata:** Already aligned; no code change.
- **You do:** Add endpoint in Stripe, subscribe to `checkout.session.completed`, set `STRIPE_WEBHOOK_SECRET` in Supabase, then test Add Funds end-to-end.
