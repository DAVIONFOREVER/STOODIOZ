import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
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

  try {
    const body = await req.json();
    const {
      amountCents,
      fromProfileId,
      toProfileId,
      bookingId,
      note,
      successUrl,
      cancelUrl,
    } = body || {};

    if (!amountCents || amountCents < 50) throw new Error('Amount too low');
    if (!fromProfileId || !toProfileId) throw new Error('Missing from/to profile');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: 'Tip' },
            unit_amount: amountCents,
          },
        },
      ],
      metadata: {
        type: 'tip',
        from_profile_id: String(fromProfileId),
        to_profile_id: String(toProfileId),
        booking_id: bookingId ? String(bookingId) : '',
        note: note ? String(note) : '',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
