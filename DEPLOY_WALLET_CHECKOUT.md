# Fix Add Funds 400: Deploy create-wallet-checkout

The live Supabase Edge Function can be a different version than this repo. When it returns `"amount_dollars is required"`, the deployed function doesn’t match the client. Deploy **this repo’s** function so the live one accepts `amount_dollars` (and still accepts `amountCents` for backward compatibility).

## Steps (run in your terminal)

1. **Log in to Supabase** (once):
   ```bash
   npx supabase login
   ```
   Follow the browser prompt to authenticate.

2. **Link the project** (once, from the repo root):
   ```bash
   cd "/Users/DAVIONFOREVER/Downloads/STOODIOZ-main 2"
   npx supabase link --project-ref ijcxeispefnbfwiviyux
   ```
   Use your database password if prompted.

3. **Deploy the wallet checkout function**:
   ```bash
   npx supabase functions deploy create-wallet-checkout --no-verify-jwt
   ```
   Confirm replace if asked.

4. **Set the Stripe secret** (if not set already):
   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxx
   ```
   Use your real Stripe secret key (or `sk_test_xxxx` for testing).

5. **Try Add Funds again** in the app (hard refresh first).

## What this fixes

- This repo’s `supabase/functions/create-wallet-checkout/index.ts` accepts **both** `amount_dollars` and `amountCents` / `amount`.
- The app sends `amount_dollars` (and optional `success_url`, `cancel_url`, `payer_profile_id`, `note`).
- After deploy, the live function will match the client and the 400 should stop.
