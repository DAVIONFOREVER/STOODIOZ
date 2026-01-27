# Quick Start Guide

## 🚀 Get Your App Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your actual API keys:
   - Get Supabase URL and anon key from: https://supabase.com/dashboard
   - Get Gemini API key from: https://aistudio.google.com/app/apikey
   - Get Google Maps API key from: https://console.cloud.google.com/apis/credentials

### Step 3: Run Database Migrations
Go to your Supabase Dashboard → SQL Editor and run:
- `supabase/migrations/20260129_unregistered_studios.sql`
- `supabase/migrations/20260131_allow_profile_delete.sql`

### Step 4: Deploy Edge Functions
See `SETUP_INSTRUCTIONS.md` and `DEPLOY_INVITE_STUDIO.md` for detailed steps.

### Step 5: Start Development Server
```bash
npm run dev
```

Visit: http://localhost:5173

---

## 📋 For Production Release

See `RELEASE_READINESS_CHECKLIST.md` for a complete list of items to check before launching.

---

## 🆘 Troubleshooting

**"Users not loading"**
- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
- Check browser console for errors
- Verify Supabase connection in `.env`

**"400 Bad Request" errors**
- Make sure all migrations are run
- Check that edge functions are deployed
- Verify API keys are correct

**"CORS errors"**
- Ensure edge functions are deployed
- Check Supabase CORS settings
- Verify domain is whitelisted

---

## 📚 More Help

- `SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `FIXES_NEEDED.md` - Known issues and fixes
- `RELEASE_READINESS_CHECKLIST.md` - Complete release checklist
