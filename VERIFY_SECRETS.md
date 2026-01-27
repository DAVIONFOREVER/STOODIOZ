# Quick Secret Verification

## ✅ How to Verify Secrets Are Set

### Option 1: Test the Edge Function (Easiest)
1. Go to your app and try to use the "Fetch Recording Studios" feature
2. If it works → secrets are set ✅
3. If you get an error about missing API key → secret not set ❌

### Option 2: Check Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/settings/secrets
2. You should see:
   - `GOOGLE_PLACES_API_KEY` ✅ (if set)
   - `RESEND_API_KEY` (optional - only if you want email sending)

### Option 3: Test via Supabase CLI
```bash
supabase secrets list
```

---

## 🔍 What Secrets Are Actually Needed?

**Required:**
- `GOOGLE_PLACES_API_KEY` - For fetching recording studios from Google Places API

**Optional:**
- `RESEND_API_KEY` - Only needed if you want the invite-studio function to send emails (otherwise it just logs)

---

## ✅ If Secrets Are Already Set

If you've already set `GOOGLE_PLACES_API_KEY`, you're done with this step! 

The edge functions will automatically pick up the secret when they run. No restart needed - Supabase edge functions read secrets at runtime.

---

## 🚨 If You're Still Getting Errors

If the edge function says the key is missing even though you set it:
1. Make sure you deployed the edge function AFTER setting the secret
2. The secret name must be exactly: `GOOGLE_PLACES_API_KEY` (case-sensitive)
3. Try redeploying the function: `supabase functions deploy fetch-recording-studios`
