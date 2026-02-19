# Add funds not working / "Timeout" errors

If you see errors like:

- `fetchCurrentUserProfile exceeded 45000ms`
- `auth.getSession exceeded 45000ms`
- `posts.globalFeed exceeded 45000ms`

**the app cannot reach your Supabase backend in time.** Everything (login, add funds, profile load) depends on Supabase responding. When it doesn’t, you get timeouts and add funds can’t complete.

## #1 cause: Supabase project is **paused**

On the **free tier**, Supabase **pauses** projects after a period of inactivity. When paused:

- Every request (auth, DB, storage) hangs or times out.
- Login, add funds, and loading the app will fail or hit 45s timeouts.

**Fix:**

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)** and open your project.
2. If the project is paused, you’ll see an option to **Restore project** (e.g. under **Settings → General** or on the project overview).
3. Click **Restore** and wait until the project is running again.
4. Refresh your app and try **Add funds** (and login) again.

## Other checks

- **Internet** – Make sure you’re online and not blocked by a firewall/VPN.
- **Env** – In your app’s `.env`, confirm:
  - `VITE_SUPABASE_URL` = your project URL (e.g. `https://xxxx.supabase.co`)
  - `VITE_SUPABASE_ANON_KEY` = your project’s anon/public key  
  (Supabase Dashboard → Settings → API.)
- **Stripe** – Add funds uses Stripe Checkout; the webhook that credits your wallet runs on Supabase. So if Supabase is paused or timing out, the payment can succeed in Stripe but the balance won’t update until the project is restored and the webhook can run.

Once the project is **restored** and the app loads without timeouts, add funds and wallet balance should work again (and the in-app timeout alert will point you to restore if it happens again).
