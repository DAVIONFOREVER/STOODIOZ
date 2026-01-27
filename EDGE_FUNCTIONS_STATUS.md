# Edge Functions Deployment Status Check

## Functions That Should Exist

Based on your codebase, here are all the edge functions:

1. `create-booking-checkout` - Studio booking payments
2. `create-beat-checkout` - Beat purchase payments
3. `create-masterclass-checkout` - Masterclass purchase payments
4. `create-product-checkout` - Kit/preset purchase payments
5. `create-wallet-checkout` - Wallet top-up payments
6. `create-tip-checkout` - Tip payments
7. `create-subscription-checkout` - Subscription payments
8. `stripe-webhook` - Handles Stripe webhook events
9. `fetch-recording-studios` - Fetches studios from Google Places
10. `invite-studio` - Sends invite emails to studios
11. `claim-roster` - Artist roster claiming
12. `get-claim-details` - Gets claim details
13. `import-roster` - CSV roster import
14. `request-payout` - Payout requests

## How to Check Deployment Status

### Method 1: Supabase Dashboard (Most Reliable)

1. Go to: https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions
2. Check the list - deployed functions will appear there
3. If the list is empty or missing functions → They're not deployed

### Method 2: Browser Console Test

Open your app's browser console and paste:

```javascript
// Test all critical functions
const functions = [
  'fetch-recording-studios',
  'create-booking-checkout',
  'create-beat-checkout',
  'create-masterclass-checkout',
  'create-product-checkout',
  'create-wallet-checkout',
  'create-tip-checkout',
  'create-subscription-checkout',
  'stripe-webhook',
  'invite-studio'
];

async function checkFunctions() {
  for (const func of functions) {
    try {
      const res = await fetch(`https://ijcxeispefnbfwiviyux.supabase.co/functions/v1/${func}`, {
        method: 'OPTIONS'
      });
      console.log(`${res.ok ? '✅' : '❌'} ${func}: ${res.status} ${res.statusText}`);
    } catch (e) {
      console.log(`❌ ${func}: ${e.message}`);
    }
  }
}

checkFunctions();
```

### Method 3: Quick Manual Check

Try using a feature that requires an edge function:
- **Map fetch button** → Tests `fetch-recording-studios`
- **Book a studio** → Tests `create-booking-checkout`
- **Buy a beat** → Tests `create-beat-checkout`

If you get CORS errors → Function is NOT deployed

## Current Status (Based on Your Errors)

**Most Likely:** ❌ **NOT DEPLOYED**

The CORS errors you've been seeing indicate the functions aren't deployed yet.

## Next Steps

If functions are NOT deployed:
1. See `SETUP_INSTRUCTIONS.md` for deployment guide
2. Deploy via Supabase Dashboard (easiest)
3. Or use Supabase CLI: `supabase functions deploy <function-name>`
