# Email Service Setup Guide

## Overview
The invite-studio edge function now uses **Resend** for sending emails. Resend is a modern, developer-friendly email API that's easy to set up and has a generous free tier.

## Setup Instructions

### Option 1: Resend (Recommended)

1. **Sign up for Resend**:
   - Go to https://resend.com
   - Create a free account (100 emails/day free tier)
   - Verify your domain or use their test domain

2. **Get your API Key**:
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Copy the API key (starts with `re_`)

3. **Set up Supabase Secrets**:
   ```bash
   # Using Supabase CLI
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   supabase secrets set FROM_EMAIL=noreply@yourdomain.com
   supabase secrets set APP_ORIGIN=https://stoodioz.com
   ```

   Or in Supabase Dashboard:
   - Go to Project Settings → Edge Functions → Secrets
   - Add:
     - `RESEND_API_KEY`: Your Resend API key
     - `FROM_EMAIL`: The email address to send from (must be verified in Resend)
     - `APP_ORIGIN`: Your app's URL (for invite links)

4. **Verify Your Domain** (Optional but recommended):
   - In Resend dashboard, go to Domains
   - Add your domain (e.g., `stoodioz.com`)
   - Add the DNS records they provide
   - Once verified, you can use `noreply@stoodioz.com` as FROM_EMAIL

### Option 2: SendGrid (Alternative)

If you prefer SendGrid, update `supabase/functions/invite-studio/index.ts`:

```typescript
// Replace the sendInviteEmail function with:
async function sendInviteEmail(
  studioEmail: string,
  studioName: string,
  inviterName: string,
  inviteLink: string
): Promise<void> {
  const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@stoodioz.com';
  
  if (!SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not set');
    return;
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: studioEmail }],
        subject: `${inviterName} invited you to join Stoodioz`,
      }],
      from: { email: FROM_EMAIL },
      content: [{
        type: 'text/html',
        value: emailHtml, // Use the same HTML from Resend version
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`SendGrid error: ${response.statusText}`);
  }
}
```

Then set the secret:
```bash
supabase secrets set SENDGRID_API_KEY=SG.your_key_here
```

### Option 3: Supabase Email (If Available)

If your Supabase plan includes email, you can use Supabase's built-in email service. Check Supabase documentation for the API.

## Testing

1. **Test without email service** (development):
   - Don't set `RESEND_API_KEY`
   - The function will log the email to console
   - Check Supabase Edge Function logs

2. **Test with Resend**:
   - Set `RESEND_API_KEY` in Supabase secrets
   - Send an invite from the map
   - Check Resend dashboard → Emails to see sent emails
   - Check the recipient's inbox

## Email Template

The email includes:
- Professional HTML design
- Clear call-to-action button
- Pre-filled signup link with `?role=STOODIO` parameter
- Support contact information
- Unsubscribe/disclaimer text

## Troubleshooting

### Emails not sending:
1. Check Supabase Edge Function logs for errors
2. Verify `RESEND_API_KEY` is set correctly
3. Verify `FROM_EMAIL` is a verified domain in Resend
4. Check Resend dashboard for delivery status

### "Invalid API key" error:
- Make sure the API key starts with `re_`
- Check for extra spaces or characters
- Regenerate the key in Resend dashboard

### Emails going to spam:
- Verify your domain in Resend
- Use a custom domain for FROM_EMAIL
- Add SPF/DKIM records (Resend provides these)

## Production Checklist

- [ ] Resend account created
- [ ] API key added to Supabase secrets
- [ ] Domain verified in Resend
- [ ] FROM_EMAIL set to verified domain
- [ ] APP_ORIGIN set to production URL
- [ ] Test email sent and received
- [ ] Email template reviewed and customized if needed
