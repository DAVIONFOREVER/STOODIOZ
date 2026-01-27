# Release Readiness Checklist

## 🔴 Critical (Must Fix Before Release)

### 1. Database Migrations
- [ ] **Run all pending migrations** in Supabase
  - Migration: `20260129_unregistered_studios.sql` (creates `unregistered_studios` table)
  - Migration: `20260131_allow_profile_delete.sql` (allows profile deletion)
  - **How to**: Go to Supabase Dashboard → SQL Editor → Run each migration file

### 2. Edge Functions Deployment
- [ ] **Deploy `fetch-recording-studios` function**
  - See: `SETUP_INSTRUCTIONS.md` for detailed steps
  - **Status**: Code exists but needs deployment
- [ ] **Deploy `invite-studio` function**
  - See: `DEPLOY_INVITE_STUDIO.md` for detailed steps
  - **Status**: Code exists but needs deployment

### 3. Environment Variables & Secrets
- [x] ✅ **Set Supabase Edge Function Secrets** (COMPLETED)
  - `GOOGLE_PLACES_API_KEY` - Set in Supabase Dashboard
  - `RESEND_API_KEY` (optional, for email sending)
  - **Verification**: See `VERIFY_SECRETS.md` to confirm secrets are working

### 4. Security Issues
- [ ] **Remove hardcoded API keys from `.env` file** (if committing to git)
  - Current `.env` contains test keys - ensure `.gitignore` excludes it
  - Create `.env.example` with placeholder values
- [ ] **Review RLS (Row Level Security) policies** - ensure all tables have proper access controls
- [ ] **Verify CORS settings** are correct for production domain

### 5. Known Bugs (From Recent Fixes)
- [x] ✅ Fixed: `location_text` column error in database queries
- [x] ✅ Fixed: Followers/Following sections missing from ArtistProfile
- [x] ✅ Fixed: Feed & Activity section visibility
- [ ] **Verify**: All profile types (Artist, Engineer, Producer, Stoodio) load without errors
- [ ] **Test**: Profile deletion works (after migration is applied)

---

## 🟡 Important (Should Fix Soon)

### 6. Production Build
- [ ] **Test production build**:
  ```bash
  npm run build
  npm run preview
  ```
- [ ] **Verify**: No console errors in production build
- [ ] **Check**: All assets load correctly (images, fonts, etc.)
- [ ] **Test**: All routes work (no 404s on refresh)

### 7. Error Handling
- [ ] **Review error boundaries** - ensure graceful error handling
- [ ] **Add loading states** for all async operations
- [ ] **Improve error messages** - make them user-friendly
- [ ] **Test**: Network failures, API timeouts, invalid data

### 8. Performance Optimization
- [ ] **Check bundle size** - ensure it's optimized
  ```bash
  npm run build
  # Check dist folder size
  ```
- [ ] **Enable code splitting** if not already done
- [ ] **Optimize images** - ensure all images are compressed
- [ ] **Review**: Check `PERFORMANCE_FIXES_APPLIED.md` for applied optimizations

### 9. Browser Compatibility
- [ ] **Test in major browsers**:
  - Chrome/Edge (latest)
  - Firefox (latest)
  - Safari (latest)
  - Mobile browsers (iOS Safari, Chrome Mobile)
- [ ] **Check**: Responsive design works on all screen sizes

### 10. API & Database
- [ ] **Verify**: All Supabase queries work correctly
- [ ] **Test**: Real-time subscriptions work
- [ ] **Check**: Storage bucket permissions are correct
- [ ] **Verify**: All edge functions are accessible

---

## 🟢 Nice to Have (Can Add Later)

### 11. Testing
- [ ] **Add unit tests** for critical functions
- [ ] **Add integration tests** for key user flows
- [ ] **Manual testing checklist**:
  - [ ] User registration/login
  - [ ] Profile creation/editing
  - [ ] Booking flow
  - [ ] Messaging
  - [ ] Payments (Stripe)
  - [ ] File uploads
  - [ ] Search functionality

### 12. Documentation
- [ ] **User documentation** - how to use the app
- [ ] **API documentation** - for developers
- [ ] **Deployment guide** - for production setup
- [ ] **Troubleshooting guide** - common issues and solutions

### 13. Monitoring & Analytics
- [ ] **Set up error tracking** (e.g., Sentry, LogRocket)
- [ ] **Add analytics** (e.g., Google Analytics, Mixpanel)
- [ ] **Monitor**: API response times, error rates
- [ ] **Set up alerts** for critical failures

### 14. Incomplete Features (TODOs)
- [ ] **Stripe webhook persistence** (`supabase/functions/stripe-webhook/index.ts` line 26)
  - Currently has TODO comment - needs to persist effects to Supabase tables
- [ ] **Label demo submission flow** (`components/LabelProfile.tsx` line 315)
- [ ] **Producer instrumental inquiry** (`ProducerProfile.tsx` line 140)

### 15. SEO & Meta Tags
- [ ] **Add proper meta tags** (title, description, OG tags)
- [ ] **Add sitemap.xml**
- [ ] **Add robots.txt**
- [ ] **Verify**: Social media previews work

### 16. Accessibility
- [ ] **Keyboard navigation** - ensure all features are keyboard accessible
- [ ] **Screen reader support** - add ARIA labels
- [ ] **Color contrast** - ensure WCAG compliance
- [ ] **Focus indicators** - visible focus states

---

## 📋 Pre-Launch Checklist

### Final Steps Before Release:
1. [ ] **Run full test suite** (if exists)
2. [ ] **Perform security audit** - check for exposed keys, SQL injection, XSS
3. [ ] **Load testing** - test with multiple concurrent users
4. [ ] **Backup database** - ensure you have a backup before launch
5. [ ] **Set up staging environment** - test in production-like environment
6. [ ] **Review all environment variables** - ensure production values are correct
7. [ ] **Check domain/DNS** - ensure domain is configured correctly
8. [ ] **SSL certificate** - ensure HTTPS is enabled
9. [ ] **Review privacy policy & terms** - ensure they're up to date
10. [ ] **Prepare rollback plan** - know how to revert if something goes wrong

---

## 🚀 Deployment Steps

### For Vercel (Based on `vercel.json`):
1. [ ] Connect repository to Vercel
2. [ ] Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_KEY` (Gemini)
   - `VITE_GOOGLE_MAPS_API_KEY`
3. [ ] Deploy and verify

### For Other Platforms:
- Follow platform-specific deployment guides
- Ensure environment variables are set
- Configure build command: `npm run build`
- Configure output directory: `dist`

---

## 📝 Notes

- **Current Status**: App is functional but needs migrations and edge function deployments
- **Critical Path**: Run migrations → Deploy edge functions → Set secrets → Test production build
- **Estimated Time**: 2-4 hours for critical items, 1-2 days for full release readiness

---

## 🔗 Related Documentation

- `FIXES_NEEDED.md` - Known issues and fixes
- `SETUP_INSTRUCTIONS.md` - Setup guide for migrations and functions
- `DEPLOY_INVITE_STUDIO.md` - Edge function deployment guide
- `PERFORMANCE_FIXES_APPLIED.md` - Performance optimizations

---

**Last Updated**: January 26, 2026
