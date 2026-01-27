# Complete Setup Instructions

You need to do **TWO things**:

## 1. Run SQL Migration (Creates the Database Table)

The SQL file exists: `supabase/migrations/20260129_unregistered_studios.sql`

### How to Run It:

**Option A: Supabase Dashboard (Easiest)**
1. Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/sql/new
2. Open the file: `supabase/migrations/20260129_unregistered_studios.sql`
3. Copy ALL the SQL code
4. Paste it into the SQL Editor
5. Click **"Run"** button
6. Wait for success message

**Option B: Supabase CLI**
```bash
cd "/Users/DAVIONFOREVER/Downloads/STOODIOZ-main 2"
supabase db push
```

This will create the `unregistered_studios` table and fix the 404 error.

---

## 2. Deploy Edge Function (TypeScript Code)

The edge function code exists: `supabase/functions/fetch-recording-studios/index.ts`

### How to Deploy It:

**Option A: Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions
2. Click **"Create a new function"**
3. Name: `fetch-recording-studios`
4. Copy ALL code from: `supabase/functions/fetch-recording-studios/index.ts`
5. **IMPORTANT**: Replace the first line:
   ```typescript
   // DELETE this:
   import { corsHeaders, handleCors } from '../_shared/cors.ts';
   
   // ADD this instead:
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

**Option B: Supabase CLI**
```bash
supabase functions deploy fetch-recording-studios
```

---

## 3. Set the Google Places API Key Secret

1. Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/settings/secrets
2. Click **"Add new secret"**
3. Key: `GOOGLE_PLACES_API_KEY`
4. Value: `AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8`
5. Click **"Save"**

---

## Summary

✅ **SQL Migration** → Creates the database table  
✅ **Edge Function** → The TypeScript code that fetches studios  
✅ **API Key Secret** → Allows the function to call Google Places API

**After all 3 steps, restart your dev server:**
```bash
npm run dev
```

Then the fetch button should work!
