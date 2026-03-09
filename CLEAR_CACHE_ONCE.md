# Clear cache once so timeouts and Stripe return work

If you still see **"exceeded 18000ms"** in the console or the **"Connection to the server timed out"** alert after Add Funds, the browser is using an old cached bundle.

**Do this once:**

1. Open your app at `http://127.0.0.1:5174` (or your dev URL).
2. Open **DevTools** (F12) → **Application** tab (Chrome) or **Storage** (Firefox).
3. Under **Storage** / **Local storage** or **Application**, find **Clear site data** (or select your origin and click **Clear site data**).
4. Close DevTools and **hard refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac).

After that you should see **38000** or **32000** in any timeout errors (not 18000), and the Stripe-return flow will suppress the alert and keep you from being kicked to the landing page.
