# Critical Fixes Needed

## Issue 1: useBookings Hook Error ✅ FIXED
- **Error**: `ReferenceError: useBookings is not defined`
- **Fix**: Changed from `useBookings(useNavigation().navigate)` to using the already destructured `navigate` variable

## Issue 2: Table Doesn't Exist (404 Error) ⚠️ NEEDS ACTION
- **Error**: `404` for `unregistered_studios` table
- **Cause**: Migration hasn't been run yet
- **Fix**: Run the migration:
  ```bash
  supabase migration up
  ```
  Or manually run the SQL in `supabase/migrations/20260129_unregistered_studios.sql` in your Supabase SQL editor

## Issue 3: CORS Error for Edge Function ⚠️ NEEDS ACTION
- **Error**: CORS policy blocking edge function
- **Cause**: Edge function might not be deployed or needs to be redeployed
- **Fix**: Deploy the edge function:
  ```bash
  supabase functions deploy fetch-recording-studios
  supabase functions deploy invite-studio
  ```

## Quick Fix Steps:

1. **Run the migration** (creates the table):
   ```bash
   supabase migration up
   ```
   Or in Supabase Dashboard → SQL Editor → Run the migration SQL

2. **Deploy edge functions**:
   ```bash
   supabase functions deploy fetch-recording-studios
   supabase functions deploy invite-studio
   ```

3. **Set the Google Places API key secret**:
   ```bash
   supabase secrets set GOOGLE_PLACES_API_KEY=AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8
   ```

4. **Restart your dev server** to pick up the changes

After these steps, the fetch button should work!
