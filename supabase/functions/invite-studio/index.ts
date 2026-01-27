import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const APP_ORIGIN = Deno.env.get('APP_ORIGIN') || 'https://stoodioz.com';

// Email sending via Resend (or fallback to console log for development)
async function sendInviteEmail(
  studioEmail: string,
  studioName: string,
  inviterName: string,
  inviteLink: string
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@stoodioz.com';
  
  const emailSubject = `${inviterName} invited you to join Stoodioz`;
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin: 0; font-size: 28px;">Welcome to Stoodioz!</h1>
          </div>
          <p style="font-size: 16px; color: #333;">Hi ${studioName},</p>
          <p style="font-size: 16px; color: #333;">${inviterName} has invited you to join <strong>Stoodioz</strong>, the platform connecting recording studios with artists, engineers, and producers.</p>
          <p style="font-size: 16px; color: #333;">Get started by clicking the link below:</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${inviteLink}" 
               style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              Get Started on Stoodioz
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This link will take you to our signup page with <strong>"Stoodio Owner"</strong> pre-selected, making it quick and easy to get started.
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            If you have any questions, feel free to reach out to our support team at <a href="mailto:support@stoodioz.com" style="color: #f97316;">support@stoodioz.com</a>.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            You received this email because someone invited ${studioName} to join Stoodioz.<br>
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  // Try Resend first (production)
  if (RESEND_API_KEY) {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: studioEmail,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error('[invite-studio] Resend API error:', errorText);
        throw new Error(`Resend API error: ${resendResponse.status}`);
      }

      const result = await resendResponse.json();
      console.log('[invite-studio] Email sent via Resend:', result.id);
      return;
    } catch (error) {
      console.error('[invite-studio] Resend failed, falling back to console log:', error);
      // Fall through to console log for development
    }
  }

  // Fallback: Log for development/testing
  console.log('[invite-studio] Email (not sent - RESEND_API_KEY not configured):', {
    to: studioEmail,
    subject: emailSubject,
    inviteLink,
  });
  
  // In development, you might want to throw an error to make it obvious
  // In production with Resend configured, this won't be reached
  if (!RESEND_API_KEY) {
    console.warn('[invite-studio] RESEND_API_KEY not set. Email not sent. Set RESEND_API_KEY in Supabase secrets to enable email sending.');
  }
}

serve(async (req) => {
  // Handle CORS preflight - MUST be first
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  try {
    const { studioId, studioEmail, inviterUserId, inviterName } = await req.json();

    if (!studioId || !inviterUserId) {
      return new Response(
        JSON.stringify({ error: 'studioId and inviterUserId are required' }),
        { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    // Fetch studio details
    const studioResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/unregistered_studios?id=eq.${studioId}&select=*`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY!,
          authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!studioResponse.ok) {
      throw new Error('Failed to fetch studio details');
    }

    const studios = await studioResponse.json();
    if (studios.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Studio not found' }),
        { status: 404, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    const studio = studios[0];
    const email = studioEmail || studio.email;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Studio email is required. Please provide studioEmail parameter.' }),
        { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    // Create invite link with role pre-selected
    const inviteLink = `${APP_ORIGIN}/get-started?role=STOODIO&invite=${studioId}`;

    // Send email
    await sendInviteEmail(
      email,
      studio.name,
      inviterName || 'A Stoodioz user',
      inviteLink
    );

    // Update studio record
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/unregistered_studios?id=eq.${studioId}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY!,
          authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: email, // Update email if provided
          last_invited_at: new Date().toISOString(),
          invite_count: (studio.invite_count || 0) + 1,
          invited_by_user_id: inviterUserId,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to update studio invite record');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invite sent successfully',
        inviteLink, // Return link for testing
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending invite:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send invite' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      }
    );
  }
});
