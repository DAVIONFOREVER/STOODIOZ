# Deploy Edge Functions to Fix CORS Error

## The Problem
You're getting a CORS error because the edge functions (`fetch-recording-studios` and `invite-studio`) are not deployed to your Supabase project.

## Solution: Deploy the Functions

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # Or download from: https://github.com/supabase/cli/releases
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   cd "/Users/DAVIONFOREVER/Downloads/STOODIOZ-main 2"
   supabase link --project-ref ijcxeispefnbfwiviyux
   ```

4. **Deploy the functions**:
   ```bash
   supabase functions deploy fetch-recording-studios
   supabase functions deploy invite-studio
   ```

5. **Set the Google Places API key secret**:
   ```bash
   supabase secrets set GOOGLE_PLACES_API_KEY=AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8
   ```

### Option 2: Using Supabase Dashboard (If CLI doesn't work)

1. **Go to Edge Functions in Dashboard**:
   - Navigate to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions

2. **Create `fetch-recording-studios` function**:
   - Click "Create a new function"
   - Name it: `fetch-recording-studios`
   - Copy the entire contents of `supabase/functions/fetch-recording-studios/index.ts`
   - Paste it into the function editor
   - Click "Deploy"

3. **Create `invite-studio` function**:
   - Click "Create a new function"
   - Name it: `invite-studio`
   - Copy the entire contents of `supabase/functions/invite-studio/index.ts`
   - Paste it into the function editor
   - Click "Deploy"

4. **Create the shared CORS file**:
   - In the function editor, you'll need to create a shared file
   - For `fetch-recording-studios`, add this at the top:
     ```typescript
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
   - Replace the import line with the inline code above
   - Do the same for `invite-studio`

5. **Set the Google Places API key secret**:
   - Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/settings/secrets
   - Add a new secret:
     - Key: `GOOGLE_PLACES_API_KEY`
     - Value: `AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8`
   - Click "Save"

### Option 3: Manual Deployment via Supabase Dashboard (Simplified)

If the above options don't work, you can manually create the functions:

1. **For `fetch-recording-studios`**:
   - Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions
   - Click "New Function"
   - Name: `fetch-recording-studios`
   - Copy/paste the code from `supabase/functions/fetch-recording-studios/index.ts`
   - **Important**: Replace the import line:
     ```typescript
     // Replace this:
     import { corsHeaders, handleCors } from '../_shared/cors.ts';
     
     // With this inline code:
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
   - Click "Deploy"

2. **Repeat for `invite-studio`** with the same CORS code replacement

## Verify Deployment

After deploying, test the function:
```bash
curl -X POST https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/fetch-recording-studios \
  -H "Content-Type: application/json" \
  -d '{"location": "Los Angeles, CA"}'
```

You should get a response (even if it's an error about the API key - that means the function is deployed).

## After Deployment

1. **Restart your dev server** to clear any cached errors
2. **Try the fetch button again** in the map view
3. **Check the browser console** - the CORS error should be gone

## Troubleshooting

- **Still getting CORS errors?** Make sure the function was actually deployed (check the Supabase Dashboard)
- **Function not found?** Verify the function name matches exactly: `fetch-recording-studios`
- **API key error?** Make sure you set the secret: `supabase secrets set GOOGLE_PLACES_API_KEY=your_key`
- **404 error?** The function might not be deployed. Check the Edge Functions page in the dashboard
