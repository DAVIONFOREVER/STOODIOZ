# Check if Edge Function is Deployed

## Quick Check

**The edge function `fetch-recording-studios` is NOT deployed.** 

The CORS error you're seeing means the function doesn't exist at:
```
https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/fetch-recording-studios
```

## How to Verify

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions

2. **Check if `fetch-recording-studios` appears in the list:**
   - If it's NOT there → **Function is NOT deployed** (this is your current situation)
   - If it IS there → Function is deployed, but might have other issues

## Deploy It Now

### Option 1: Supabase Dashboard (Easiest - 5 minutes)

1. Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions
2. Click **"Create a new function"** (or "New Function")
3. Name: `fetch-recording-studios`
4. Copy ALL code from: `supabase/functions/fetch-recording-studios/index.ts`
5. **IMPORTANT**: In the function editor, replace the first line:
   ```typescript
   // DELETE this line:
   import { corsHeaders, handleCors } from '../_shared/cors.ts';
   
   // ADD this instead (at the top of the file):
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
6. Click **"Deploy"** button
7. Wait for deployment to complete (you'll see a success message)

### Option 2: Supabase CLI

```bash
cd "/Users/DAVIONFOREVER/Downloads/STOODIOZ-main 2"
supabase link --project-ref ijcxeispefnbfwiviyux
supabase functions deploy fetch-recording-studios
```

## After Deployment

1. **Set the Google Places API Key secret:**
   - Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/settings/secrets
   - Add secret: `GOOGLE_PLACES_API_KEY` = `AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8`

2. **Test it:**
   - Go back to Edge Functions page
   - Click on `fetch-recording-studios`
   - Click "Invoke" tab
   - Try a test call with: `{"location": "Nashville, TN"}`
   - Should return a success response

3. **Restart your dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

## Current Status

❌ **Edge function is NOT deployed**  
❌ **CORS error will continue until deployed**  
✅ **Code is ready - just needs deployment**
