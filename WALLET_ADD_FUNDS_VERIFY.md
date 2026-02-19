# Wallet add-funds: why balance might not update

If the app shows "Payment successful" (or a late notification) but the wallet balance stays at zero, the payment went through Stripe but **the backend never credited your profile**. That can mean "money in limbo" until the webhook is fixed.

## What the app does

- **Stripe return:** We show a notification like: *"Payment successful. Your balance will update shortly—refresh the page if it doesn't."* We do **not** claim "Funds are in your wallet" until you see the balance change.
- **Balance update:** Only the **Stripe webhook** (Supabase edge function `stripe-webhook`) credits the wallet. It runs when Stripe sends `checkout.session.completed` to your webhook URL.

## Why the balance might not update

1. **Webhook not configured**
   - In Stripe Dashboard: **Developers → Webhooks** add an endpoint (e.g. your Supabase function URL for `stripe-webhook`).
   - Subscribe to **checkout.session.completed** (and any other events you handle).
   - Without this, Stripe never notifies your app, so the wallet is never updated.

2. **Wrong profile id**
   - The webhook credits the profile whose **profiles.id** equals `metadata.payer_profile_id` from the checkout session.
   - The app sends `payerProfileId = currentUser.profile_id ?? currentUser.id`. That **must** be the **profiles** row id (the UUID from the `profiles` table), not the artist/engineer/stoodio row id. If your code passes the role table id, the webhook may update the wrong row or fail.

3. **Webhook fails**
   - Check Supabase function logs for `stripe-webhook` (and Stripe Dashboard → Webhooks → event logs). If the function errors (e.g. missing env, bad request, DB error), Stripe may retry; fix the error so the handler can credit the wallet.

## Quick checks

- **Stripe Dashboard → Webhooks:** Endpoint exists and has received `checkout.session.completed` for the payment.
- **Stripe Dashboard → Payments:** Open the payment → check **Metadata** includes `payer_profile_id` (or `payerProfileId`) and that this value is a **profiles.id** in your DB.
- **Supabase:** In `profiles`, find the row with that id and confirm `wallet_balance` and `wallet_transactions` after the webhook ran.

Once the webhook is configured and `payer_profile_id` is the correct profiles.id, new top-ups will show in the wallet after a short delay (and the app’s refetch will show the new balance).
