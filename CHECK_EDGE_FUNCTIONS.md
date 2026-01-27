# Check Edge Functions Deployment Status

## Quick Check Method

### Option 1: Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions
2. You should see a list of all deployed functions
3. Check if these functions appear in the list:

**Required Functions:**
- ✅ `create-booking-checkout`
- ✅ `create-beat-checkout`
- ✅ `create-masterclass-checkout`
- ✅ `create-product-checkout`
- ✅ `create-wallet-checkout`
- ✅ `create-tip-checkout`
- ✅ `create-subscription-checkout`
- ✅ `stripe-webhook`
- ✅ `fetch-recording-studios`
- ✅ `invite-studio`
- ✅ `claim-roster`
- ✅ `get-claim-details`
- ✅ `import-roster`
- ✅ `request-payout`

**If any are missing:** They need to be deployed (see `SETUP_INSTRUCTIONS.md`)

---

### Option 2: Test via Browser Console

Open browser console on your app and run:

```javascript
// Test if fetch-recording-studios exists
fetch('https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/fetch-recording-studios', {
  method: 'OPTIONS'
}).then(r => {
  if (r.ok) {
    console.log('✅ fetch-recording-studios is deployed');
  } else {
    console.log('❌ fetch-recording-studios is NOT deployed (status:', r.status, ')');
  }
}).catch(e => {
  console.log('❌ fetch-recording-studios is NOT deployed (error:', e.message, ')');
});

// Test if create-booking-checkout exists
fetch('https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/create-booking-checkout', {
  method: 'OPTIONS'
}).then(r => {
  if (r.ok) {
    console.log('✅ create-booking-checkout is deployed');
  } else {
    console.log('❌ create-booking-checkout is NOT deployed (status:', r.status, ')');
  }
}).catch(e => {
  console.log('❌ create-booking-checkout is NOT deployed (error:', e.message, ')');
});
```

---

### Option 3: Test via Terminal (curl)

```bash
# Test fetch-recording-studios
curl -X OPTIONS https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/fetch-recording-studios -v

# If you get 200 OK → Function is deployed
# If you get 404 Not Found → Function is NOT deployed
# If you get CORS error → Function might be deployed but CORS not configured
```

---

## Expected Functions List

Based on your codebase, these edge functions should exist:

1. **`create-booking-checkout`** - Creates Stripe checkout for studio bookings
2. **`create-beat-checkout`** - Creates Stripe checkout for beat purchases
3. **`create-masterclass-checkout`** - Creates Stripe checkout for masterclass purchases
4. **`create-product-checkout`** - Creates Stripe checkout for kit/preset purchases
5. **`create-wallet-checkout`** - Creates Stripe checkout for wallet top-ups
6. **`create-tip-checkout`** - Creates Stripe checkout for tips
7. **`create-subscription-checkout`** - Creates Stripe checkout for subscriptions
8. **`stripe-webhook`** - Handles Stripe webhook events (⚠️ needs implementation)
9. **`fetch-recording-studios`** - Fetches studios from Google Places API
10. **`invite-studio`** - Sends invite emails to unregistered studios
11. **`claim-roster`** - Allows artists to claim roster spots
12. **`get-claim-details`** - Gets claim token details
13. **`import-roster`** - Imports roster from CSV
14. **`request-payout`** - Handles payout requests

---

## Current Status Check

**Most Likely Status:** ❌ **NOT DEPLOYED**

Based on the CORS errors you've been seeing, the functions are likely not deployed yet.

**To Deploy:** See `SETUP_INSTRUCTIONS.md` for step-by-step deployment guide.
