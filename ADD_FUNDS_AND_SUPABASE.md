# Add funds not working + timeout errors

## What you're seeing

- **"fetchCurrentUserProfile exceeded 45000ms"** (or 18000ms after the latest change)
- **"auth.getSession exceeded … ms"**
- **"posts.globalFeed exceeded … ms"**
- Add funds button does nothing useful or you get logged out / sent to landing

## Why this happens

**Your app cannot reach Supabase** within the timeout. When that happens:

1. Login/hydration never finishes (or takes forever and then times out).
2. Add funds needs a valid session and a call to create a Stripe checkout session. If `getSession()` or profile fetch times out, the app can’t complete the flow.

So add funds “doesn’t work” because the **backend (Supabase) is unreachable**, not because the add-funds code is wrong.

## What to do (in order)

### 1. Restore your Supabase project (most common)

Free-tier projects **pause after inactivity**. When paused, every request times out.

- Go to [supabase.com/dashboard](https://supabase.com/dashboard) and open your project.
- If it says **Paused**, click **Restore project** and wait until it’s running.
- Reload your app and try again (login, then add funds).

### 2. Check .env

Your app must have the correct Supabase URL and anon key:

- `VITE_SUPABASE_URL` = your project URL (e.g. `https://xxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` = your project’s anon/public key

Get both from: Supabase Dashboard → **Project Settings** → **API** (Project URL and anon public key).

Wrong URL or key → requests never succeed → timeouts and “add funds” never completes.

### 3. Check network

- Try another network or disable VPN.
- In the browser console, check for failed requests to `*.supabase.co` (CORS, block, or net::ERR_*).

### 4. After Supabase is reachable: add funds and wallet

- **Stripe checkout:** Add funds uses Stripe Checkout. The edge function `create-wallet-checkout` must be deployed and callable; the app needs a valid session so it can pass `payerProfileId`.
- **Wallet balance update:** The **Stripe webhook** must be configured and must credit the wallet. See **WALLET_ADD_FUNDS_VERIFY.md** for webhook and `payer_profile_id` checks.

## Summary

- **Timeouts** = Supabase not responding in time → usually **paused project** or wrong **.env**.
- **Restore project** and fix **.env** first; then retry login and add funds.
- After that, if the balance still doesn’t update, use **WALLET_ADD_FUNDS_VERIFY.md** for webhook and metadata.
