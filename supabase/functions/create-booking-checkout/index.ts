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
      payerProfileId,
      stoodioId,
      userRole,
      bookingRequest,
      successUrl,
      cancelUrl,
    } = body || {};

    if (!payerProfileId) throw new Error('Missing payerProfileId');
    if (!amountCents || amountCents < 50) throw new Error('Amount too low');

    const metadata: Record<string, string> = {
      type: 'booking',
      payer_profile_id: String(payerProfileId),
      stoodio_id: stoodioId ? String(stoodioId) : '',
      user_role: userRole ? String(userRole) : '',
    };

    if (bookingRequest) {
      const requestJson = JSON.stringify(bookingRequest);
      metadata.booking_request = requestJson.length > 500 ? requestJson.slice(0, 500) : requestJson;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: 'Studio Booking' },
            unit_amount: amountCents,
          },
        },
      ],
      metadata,
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
