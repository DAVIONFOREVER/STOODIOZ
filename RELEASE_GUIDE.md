# 🚀 Complete Release Guide - Stoodioz App

## ⚠️ CRITICAL: Differences Between Local & Production

### Why Things Work Locally But Not Online:

1. **Database Schema**: Your local database might have different columns than production
2. **Environment Variables**: Local `.env` file vs Vercel environment variables
3. **Edge Functions**: Must be deployed to Supabase (not just in your code)
4. **Database Migrations**: Must be run in Supabase SQL Editor
5. **API Keys/Secrets**: Must be set in both Vercel AND Supabase

---

## 📋 STEP-BY-STEP RELEASE CHECKLIST

### PHASE 1: Database Setup (MUST DO FIRST)

#### Step 1.1: Add Missing Columns to Artists Table
1. Go to: **Supabase Dashboard → SQL Editor**
2. Open file: `ADD_MISSING_COLUMNS.sql` in your project
3. Copy ALL the SQL code
4. Paste into Supabase SQL Editor
5. Click **"Run"**
6. ✅ Verify: Check that `artists` table now has:
   - `rating_overall`
   - `sessions_completed`
   - `ranking_tier`
   - `is_on_streak`
   - `on_time_rate`
   - `completion_rate`
   - `repeat_hire_rate`
   - `strength_tags`
   - `local_rank_text`
   - `purchased_masterclass_ids`

#### Step 1.2: Run Other Migrations
1. Go to: **Supabase Dashboard → SQL Editor**
2. Run: `RUN_THIS_SQL.sql` (if not already done)
   - Creates `unregistered_studios` table
   - Allows profile deletion

#### Step 1.3: Verify Database Schema
- Check that all tables exist: `artists`, `engineers`, `producers`, `stoodioz`, `labels`, `profiles`, `unregistered_studios`
- Verify RLS (Row Level Security) policies are set correctly

---

### PHASE 2: Supabase Edge Functions (MUST DEPLOY)

#### Step 2.1: Deploy `fetch-recording-studios` Function
1. Go to: **Supabase Dashboard → Edge Functions**
2. Click **"Create a new function"**
3. Name: `fetch-recording-studios`
4. Copy code from: `supabase/functions/fetch-recording-studios/index.ts`
5. **IMPORTANT**: Remove the import line and add this at the top:
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
6. Click **"Deploy"**
7. ✅ Verify: Function appears in the list

#### Step 2.2: Deploy `invite-studio` Function (if exists)
- Follow same steps as 2.1
- See: `DEPLOY_INVITE_STUDIO.md` for details

---

### PHASE 3: Set Secrets & API Keys

#### Step 3.1: Supabase Secrets (For Edge Functions)
1. Go to: **Supabase Dashboard → Settings → Edge Functions → Secrets**
2. Add these secrets:
   - **Key**: `GOOGLE_PLACES_API_KEY`
     **Value**: `AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8`
   - **Key**: `RESEND_API_KEY` (optional, for emails)
     **Value**: Your Resend API key (if using)

#### Step 3.2: Vercel Environment Variables (For Frontend)
1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add these variables:
   - **Key**: `VITE_SUPABASE_URL`
     **Value**: `https://ijcxeispefnbfwiviyux.supabase.co`
   - **Key**: `VITE_SUPABASE_ANON_KEY`
     **Value**: Your Supabase anon key (from Supabase Dashboard → Settings → API)
   - **Key**: `VITE_API_KEY`
     **Value**: Your Google Gemini API key
   - **Key**: `VITE_GOOGLE_MAPS_API_KEY`
     **Value**: Your Google Maps API key
3. ✅ **IMPORTANT**: Make sure these are set for **Production**, **Preview**, AND **Development** environments
4. Click **"Save"** for each variable

---

### PHASE 4: Test Production Build Locally

#### Step 4.1: Build Test
```bash
cd "/Users/DAVIONFOREVER/Downloads/STOODIOZ-main 2"
npm run build
npm run preview
```

#### Step 4.2: Check for Errors
- Open browser to `http://localhost:4173` (or the port shown)
- Check browser console for errors
- Test key features:
  - ✅ User login/registration
  - ✅ Profile loading (all types: artist, engineer, producer, stoodio)
  - ✅ Map view
  - ✅ Booking flow
  - ✅ Messaging

#### Step 4.3: Fix Any Build Errors
- If you see errors, fix them before deploying
- Common issues:
  - Missing imports
  - TypeScript errors
  - Missing environment variables

---

### PHASE 5: Deploy to Vercel

#### Step 5.1: Verify GitHub Connection
1. Go to: **Vercel Dashboard → Your Project → Settings → Git**
2. Verify: Repository is connected to `DAVIONFOREVER/STOODIOZ`
3. Verify: Production branch is `main`

#### Step 5.2: Trigger Deployment
1. **Option A**: Push to GitHub (auto-deploys)
   ```bash
   git add .
   git commit -m "Ready for production"
   git push
   ```
2. **Option B**: Manual deploy in Vercel Dashboard
   - Go to: **Vercel Dashboard → Your Project → Deployments**
   - Click **"Redeploy"** on latest deployment

#### Step 5.3: Monitor Deployment
1. Watch the build logs in Vercel
2. Check for build errors
3. Wait for deployment to complete (usually 2-5 minutes)

---

### PHASE 6: Post-Deployment Verification

#### Step 6.1: Test Production Site
1. Open your production URL (from Vercel)
2. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Test these features:
   - ✅ **Login/Registration**: Can users sign up?
   - ✅ **Profiles**: Do all profile types load without errors?
   - ✅ **Map View**: Does the map load and show studios?
   - ✅ **Fetch Studios**: Does the "Fetch Recording Studios" button work?
   - ✅ **Booking**: Can users create bookings?
   - ✅ **Messaging**: Do conversations work?
   - ✅ **File Uploads**: Can users upload images/files?

#### Step 6.2: Check Browser Console
1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for:
   - ❌ Red errors (fix these immediately)
   - ⚠️ Yellow warnings (can fix later)
   - ✅ No 400/500 errors from Supabase

#### Step 6.3: Check Network Tab
1. Open Developer Tools → **Network** tab
2. Filter by **XHR** or **Fetch**
3. Look for:
   - ❌ Failed requests (red status codes)
   - ⚠️ Slow requests (>5 seconds)
   - ✅ All requests return 200/201 status

---

## 🔧 TROUBLESHOOTING

### Problem: "Column does not exist" errors
**Solution**: Run `ADD_MISSING_COLUMNS.sql` in Supabase SQL Editor

### Problem: Edge functions return 404
**Solution**: Deploy edge functions in Supabase Dashboard → Edge Functions

### Problem: "Missing environment variable" error
**Solution**: 
1. Check Vercel Dashboard → Settings → Environment Variables
2. Make sure variables are set for **Production** environment
3. Redeploy after adding variables

### Problem: Features work locally but not online
**Solution**: 
1. Check if edge functions are deployed
2. Check if database migrations are run
3. Check if environment variables are set in Vercel
4. Hard refresh browser (clear cache)

### Problem: Slow loading times
**Solution**:
1. Check Supabase dashboard for slow queries
2. Check Vercel analytics for build size
3. Consider optimizing images/assets
4. Check network tab for slow API calls

---

## 📊 MONITORING CHECKLIST

After release, monitor these daily:

- [ ] **Error Rates**: Check Vercel logs for errors
- [ ] **API Response Times**: Check Supabase dashboard → API logs
- [ ] **User Reports**: Monitor for user complaints
- [ ] **Database Performance**: Check Supabase dashboard → Database → Performance
- [ ] **Edge Function Logs**: Check Supabase → Edge Functions → Logs

---

## 🎯 QUICK REFERENCE

### Required Environment Variables (Vercel):
```
VITE_SUPABASE_URL=https://ijcxeispefnbfwiviyux.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_KEY=your_gemini_key_here
VITE_GOOGLE_MAPS_API_KEY=your_maps_key_here
```

### Required Secrets (Supabase):
```
GOOGLE_PLACES_API_KEY=AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8
```

### SQL Files to Run (In Order):
1. `ADD_MISSING_COLUMNS.sql` - Adds missing columns to artists table
2. `RUN_THIS_SQL.sql` - Creates unregistered_studios table

### Edge Functions to Deploy:
1. `fetch-recording-studios`
2. `invite-studio` (if exists)

---

## ✅ FINAL CHECKLIST BEFORE GOING LIVE

- [ ] All database migrations run successfully
- [ ] All edge functions deployed
- [ ] All environment variables set in Vercel
- [ ] All secrets set in Supabase
- [ ] Production build succeeds locally (`npm run build`)
- [ ] No console errors in production site
- [ ] All key features tested in production
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active (HTTPS)
- [ ] Backup of database created

---

## 🆘 IF SOMETHING BREAKS

1. **Check Vercel Build Logs**: See what failed during build
2. **Check Supabase Logs**: See if database queries are failing
3. **Check Browser Console**: See client-side errors
4. **Rollback**: In Vercel, redeploy previous working version
5. **Fix & Redeploy**: Make fixes, push to GitHub, redeploy

---

**Last Updated**: January 26, 2026
**Status**: Ready for release after completing all phases
