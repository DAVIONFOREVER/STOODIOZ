# Step-by-Step: Deploy `invite-studio` Function

## ✅ Good News!

I tested all your functions - **most are already deployed!** You only need to deploy **ONE** function:

- ❌ `invite-studio` - **NOT DEPLOYED** (this is the one we need)

All the others are already working! ✅

---

## How to Deploy `invite-studio` (5 Minutes)

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard/project/ijcxeispefnbfwiviyux/edge-functions**
2. You should see a list of functions (or an empty list if it's your first time)

### Step 2: Create New Function

1. Click the button that says **"Create a new function"** or **"New Function"** (usually at the top right)
2. A form or editor will appear

### Step 3: Name the Function

1. In the **"Function name"** field, type exactly: `invite-studio`
   - ⚠️ **IMPORTANT:** Use lowercase, with a hyphen (not underscore)
   - ✅ Correct: `invite-studio`
   - ❌ Wrong: `invite_studio` or `InviteStudio`

### Step 4: Copy the Code

1. Open this file on your computer: `supabase/functions/invite-studio/index.ts`
2. **Select ALL** the code (Ctrl+A or Cmd+A)
3. **Copy** it (Ctrl+C or Cmd+C)

### Step 5: Paste the Code (EASIEST WAY!)

**Option A: Use the Ready-to-Paste File (Recommended!)**
1. Open this file on your computer: `invite-studio-READY-TO-PASTE.ts`
2. **Select ALL** the code (Ctrl+A or Cmd+A)
3. **Copy** it (Ctrl+C or Cmd+C)
4. **Paste** it into the Supabase editor
5. **Skip to Step 6** - you're done! ✅

**Option B: Manual Method (If you prefer)**
1. Open: `supabase/functions/invite-studio/index.ts`
2. **Select ALL** the code (Ctrl+A or Cmd+A)
3. **Copy** it (Ctrl+C or Cmd+C)
4. **Paste** it into the Supabase editor
5. **Find this line** (should be near the top, line 2):
   ```typescript
   import { corsHeaders, handleCors } from '../_shared/cors.ts';
   ```
6. **DELETE that entire line**
7. **Replace it with this code** (paste this right where you deleted the import):
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

### Step 6: Deploy

1. Look for a button that says **"Deploy"** or **"Save"** or **"Create Function"**
2. Click it
3. Wait for it to finish (usually 10-30 seconds)
4. You should see a success message like "Function deployed successfully"

### Step 7: Verify It Worked

1. After deployment, you should see `invite-studio` in your list of functions
2. The status should show as "Active" or "Deployed"

---

## What This Function Does

This function sends invitation emails to unregistered studios when someone clicks the "Invite" button on the map. Without it, the invite button won't work.

---

## Troubleshooting

### "Function name already exists"
- The function might already be deployed
- Check the list - if you see `invite-studio`, it's already done!

### "Deployment failed"
- Make sure you replaced the import line correctly
- Check for any red error messages in the editor
- Try copying the code again from the file

### "Can't find the file"
- The file is at: `supabase/functions/invite-studio/index.ts`
- If you can't find it, let me know and I'll help locate it

---

## After Deployment

Once deployed, the "Invite" button on unregistered studios in the map should work!

**Optional:** You can also set up email sending by adding a `RESEND_API_KEY` secret in Supabase (Settings → Secrets), but the function will work without it (it will just log to console in development).

---

## Need Help?

If you get stuck at any step, tell me:
1. Which step you're on
2. What error message you see (if any)
3. What the screen looks like

I'll help you through it! 🚀
