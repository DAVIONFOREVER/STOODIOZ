# Google Places API Setup for Studio Fetching

## The Problem
The fetch button doesn't work because the edge function needs the Google Places API key set as a **Supabase secret**, not just in your local `.env` file.

## Quick Fix

### Step 1: Get Your Google Maps API Key
You already have it in your `.env`:
```
VITE_GOOGLE_MAPS_API_KEY="AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8"
```

### Step 2: Enable Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Library"
4. Search for "Places API"
5. Click "Enable"

### Step 3: Set Supabase Secret
Run this command in your terminal:

```bash
supabase secrets set GOOGLE_PLACES_API_KEY=AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8
```

Or if you have Supabase CLI installed:
```bash
supabase secrets set GOOGLE_PLACES_API_KEY="AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8"
```

### Alternative: Set via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add a new secret:
   - **Name**: `GOOGLE_PLACES_API_KEY`
   - **Value**: `AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8`

## Verify It Works

After setting the secret:
1. Restart your dev server (if running)
2. Try fetching studios again from the map
3. Check the browser console for any errors

## Why This Is Needed

- **Frontend** (`.env` file): Only accessible in the browser
- **Edge Functions** (Supabase servers): Need secrets set in Supabase
- The edge function runs on Supabase's servers, not your local machine, so it can't access your `.env` file

## Testing

Once set up, you should see:
- Studios fetching successfully
- Studios appearing on the map as greyed-out icons
- No "API key not configured" errors
