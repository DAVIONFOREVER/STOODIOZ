# RECOMMENDED: Stripe Webhook — Do These 2 Steps

Use **stripe-webhook** (already deployed). No webhook-handler needed.

---

## Step 1 — Stripe Dashboard

1. Go to **https://dashboard.stripe.com/webhooks** → **Add endpoint**.
2. **Endpoint URL** (copy exactly):
   ```
   https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/stripe-webhook
   ```
3. **Events to send:** click **Select events** and enable **all** of these (your stripe-webhook handles them):
   - **checkout.session.completed** (Add Funds, bookings, tips, beats, masterclass)
   - **account.updated** (Stripe Connect payouts_enabled)
   - **customer.subscription.created**
   - **customer.subscription.deleted**
   - **invoice.paid**
   - **invoice.payment_failed**
   Then **Add events** → **Add endpoint**.
4. On the new endpoint’s page, open **Signing secret** → **Reveal** → **Copy** (starts with `whsec_`).

---

## Step 2 — Terminal (project folder)

Paste your signing secret and run (replace `whsec_xxxxxxxx` with what you copied):

```bash
cd "/Users/DAVIONFOREVER/Downloads/STOODIOZ-main 2"
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

---

## Done

After that, when you complete Add Funds in the app, Stripe will call stripe-webhook, and your **wallet_balance** in Supabase will be updated. Refresh the app (or wait for the refetch) to see the new balance.

To test: Stripe Dashboard → your webhook → **Send test event** → **checkout.session.completed**, then check Supabase Table Editor → **profiles** → your row → **wallet_balance** / **wallet_transactions**.
