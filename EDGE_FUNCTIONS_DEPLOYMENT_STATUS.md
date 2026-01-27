# Edge Functions Deployment Status
**Checked:** January 26, 2025

## ✅ DEPLOYED Functions

Based on testing, these functions ARE deployed:

1. ✅ **`create-booking-checkout`** - HTTP 405 (exists, accepts POST)
2. ✅ **`create-beat-checkout`** - HTTP 200 (fully working)
3. ✅ **`create-wallet-checkout`** - HTTP 200 (fully working)
4. ✅ **`stripe-webhook`** - HTTP 405 (exists, accepts POST)
5. ✅ **`fetch-recording-studios`** - HTTP 401 (exists, needs auth - this is normal)

## ❌ NOT DEPLOYED Functions

These functions are missing:

1. ❌ **`invite-studio`** - HTTP 404 (NOT FOUND)
2. ❓ **`create-masterclass-checkout`** - Not tested, status unknown
3. ❓ **`create-product-checkout`** - Not tested, status unknown
4. ❓ **`create-tip-checkout`** - Not tested, status unknown
5. ❓ **`create-subscription-checkout`** - Not tested, status unknown
6. ❓ **`claim-roster`** - Not tested, status unknown
7. ❓ **`get-claim-details`** - Not tested, status unknown
8. ❓ **`import-roster`** - Not tested, status unknown
9. ❓ **`request-payout`** - Not tested, status unknown

## ✅ Configuration Complete

### `fetch-recording-studios` - Configured ✅
- **Status:** Deployed and API key configured
- **Note:** 401 on POST is expected (needs valid auth token from app)

## Action Items

### Priority 1: Deploy Missing Functions

**Critical for app functionality:**
1. `invite-studio` - Required for map feature
2. `create-masterclass-checkout` - Required for masterclass purchases
3. `create-product-checkout` - Required for kit purchases
4. `create-tip-checkout` - Required for tips
5. `create-subscription-checkout` - Required for subscriptions

**Deploy via Supabase Dashboard:**
- Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions
- Click "Create a new function" for each missing one
- Copy code from `supabase/functions/<function-name>/index.ts`
- Replace CORS import with inline code (see `SETUP_INSTRUCTIONS.md`)
- Click "Deploy"

### Priority 2: Configure `fetch-recording-studios` ✅ DONE

~~1. Set Google Places API key:~~
   ~~- Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/settings/secrets~~
   ~~- Add: `GOOGLE_PLACES_API_KEY` = `AIzaSyD-5mkHu2bcH8ePLb-UxjJI0huatJSQok8`~~

✅ **COMPLETED** - Google Places API key is configured

## Summary

**Deployed:** ~5-6 functions  
**Missing:** ~4-5 critical functions  
**Needs Config:** ✅ All configured

**Overall Status:** ⚠️ **PARTIALLY DEPLOYED** - Some features will work, others won't.
