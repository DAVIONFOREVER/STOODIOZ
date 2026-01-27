import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      error:
        'Payouts require Stripe Connect and a server-side mapping of profileId → connected account.',
    }),
    { status: 501, headers: { ...corsHeaders, 'content-type': 'application/json' } }
  );
});
