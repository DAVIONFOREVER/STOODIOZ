# Quick Fix: CORS Error for Edge Functions

## The Problem
The edge function `fetch-recording-studios` is not deployed to Supabase, causing a CORS error.

## Quick Solution (3 Steps)

### Step 1: Deploy the Function via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions
2. Click **"Create a new function"**
3. Name it: `fetch-recording-studios`
4. Copy the code from: `supabase/functions/fetch-recording-studios/index.ts`
5. **IMPORTANT**: Replace the import line at the top with this inline code:

```typescript
// Replace this line:
import { corsHeaders, handleCors } from '../_shared/cors.ts';

// With this:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }
  return null;
}
```

6. Click **"Deploy"**

### Step 2: Set the Google Places API Key

1. Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/settings/secrets
2. Click **"Add new secret"**
3. Key: `GOOGLE_PLACES_API_KEY`
4. Value: `AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8`
5. Click **"Save"**

### Step 3: Restart Your Dev Server

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## Test It

After deploying:
1. Go to the Map view
2. Click the "Fetch Recording Studios" button
3. Enter a city (e.g., "Los Angeles, CA")
4. Click "Fetch"

The CORS error should be gone!

## If It Still Doesn't Work

1. **Check the function is deployed**: Go back to Edge Functions page and verify `fetch-recording-studios` appears in the list
2. **Check the secret is set**: Go to Settings → Secrets and verify `GOOGLE_PLACES_API_KEY` is there
3. **Clear browser cache**: Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
4. **Check browser console**: Look for any new error messages

## Alternative: Use Supabase CLI

If you have the CLI installed:

```bash
cd "/Users/DAVIONFOREVER/Downloads/STOODIOZ-main 2"
supabase link --project-ref ijcxeispefnbfwiviyux
supabase functions deploy fetch-recording-studios
supabase secrets set GOOGLE_PLACES_API_KEY=AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8
```
