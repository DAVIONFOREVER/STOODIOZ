# Supabase auth timeout — 4 quick checks + reply for support

Do these in order and paste the results back to Supabase so they can finish the fix.

---

## 1. Verify env vars in the running app

**In browser:** Open your app (so the Supabase client has loaded), then DevTools → **Console**. Run:

```js
window.__supabaseEnvCheck
```

You should see something like `{ VITE_SUPABASE_URL: "SET", VITE_SUPABASE_ANON_KEY: "SET" }`. (The console is not a module, so you can't use `import.meta` there; the app sets this for you.)

- If either says **MISSING** or the object is undefined: your `.env` or `.env.local` is not loaded. Use a file named `.env` or `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then **restart the dev server**.
- **Expected:** Both SET. URL should be `https://<project-ref>.supabase.co`, anon key starts with `eyJhbGci...`.

---

## 2. Test auth health endpoint

**In a new browser tab**, open (replace `<project-ref>` with your Supabase project reference, e.g. `ijcxeispefnbfwiviyux`):

```
https://<project-ref>.supabase.co/auth/v1/health
```

- **Expected:** `{"status":"ok"}`.
- If it **hangs or fails**: project may be paused or blocked. Supabase Dashboard → your project → resume if paused; check VPN/proxy.

---

## 3. CORS and protocol

- **localhost (http)** + Supabase **https** is fine.
- If your site is **https**, make sure you’re not mixing http redirect URLs; in Supabase Dashboard → Authentication → URL Configuration, use https for Site URL / Redirect URLs if you’re on https.
- **Safari/Brave:** If you use strict privacy, try enabling “Allow cross-website tracking” for your site, or we already use `flowType: 'pkce'` in the client (see below).

---

## 4. Supabase client init (already in the app)

Your `lib/supabase.ts` uses a **single** client (singleton), with:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `persistSession: true`, `autoRefreshToken: true`
- `flowType: 'pkce'` (recommended for SPAs)
- Custom fetch with 50s timeout so requests don’t hang forever

No change needed unless Supabase suggests something else.

---

## 5. Quick reset (bad refresh token)

If you see 401/403 on refresh or repeated timeouts:

1. In your app (or Console): `(await import('./lib/supabase')).getSupabase().auth.signOut()`
2. **Hard reload** (Ctrl+Shift+R or Cmd+Shift+R).
3. Sign in again.

This clears a bad refresh token that can cause 18s timeouts.

---

## What to send back to Supabase

Copy the block below, fill in the bracketed parts, and paste in your reply.

```
4 quick checks done:

1) Env vars in app: VITE_SUPABASE_URL = [SET | MISSING], VITE_SUPABASE_ANON_KEY = [SET | MISSING]
2) Auth health: https://[PROJECT-REF].supabase.co/auth/v1/health → [ok / hung / error]
3) CORS/protocol: [e.g. localhost http, or https production]
4) Client: single instance, persistSession + autoRefreshToken + flowType: 'pkce'. No change needed.

Project ref for you to pull logs: [PROJECT-REF]
```

**Get PROJECT-REF:** Supabase Dashboard → Project Settings → General → **Reference ID** (e.g. `ijcxeispefnbfwiviyux`).

Once you send that, they can pull Auth/API logs and tell you the exact failure so you can be done with it.

---

## Reply block (Supabase’s exact format)

Use this if they asked for this layout. Fill each line using the steps below.

```
Reply block (to paste back)

VITE_SUPABASE_URL: SET or MISSING
VITE_SUPABASE_ANON_KEY: SET or MISSING
Auth health URL (https://[PROJECT-REF].supabase.co/auth/v1/health): ok / hung / error
CORS/protocol: e.g., "localhost http" or "production https"
Supabase client: single instance, persistSession=true, autoRefreshToken=true, flowType='pkce'
Quick reset done: yes/no
Project ref: [your ref, e.g. ijcxeispefnbfwiviyux]

If you confirm your project ref, I can pull recent Auth/API logs to correlate with your timeouts and include the exact failure reason.
```

### How to fill each line (do this now)

1. **VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY**  
   App running → DevTools → Console → type:
   ```js
   window.__supabaseEnvCheck
   ```
   You’ll see `{ VITE_SUPABASE_URL: "SET" or "MISSING", VITE_SUPABASE_ANON_KEY: "SET" or "MISSING" }`. (You can’t use `import.meta` in the console — the app exposes this instead.)
   Write **SET** or **MISSING** for each in your reply.

2. **Auth health URL**  
   Replace `[PROJECT-REF]` with your ref (Dashboard → Project Settings → General). Open in a new tab:
   `https://YOUR-REF.supabase.co/auth/v1/health`  
   If you see `{"status":"ok"}` → write **ok**. If it never loads → **hung**. If error page → **error**.

3. **CORS/protocol**  
   Are you on `http://localhost:...` or a live `https://...` site? Write e.g. **localhost http** or **production https**.

4. **Supabase client**  
   Leave as-is: **single instance, persistSession=true, autoRefreshToken=true, flowType='pkce'**

5. **Quick reset done**  
   Did you sign out, hard reload, then sign in? **yes** or **no**.

6. **Project ref**  
   Paste your ref (e.g. **ijcxeispefnbfwiviyux**). That’s what they need to pull logs.
