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
      buyerProfileId,
      ownerProfileId,
      masterclassId,
      masterclassTitle,
      successUrl,
      cancelUrl,
    } = body || {};

    if (!buyerProfileId || !ownerProfileId) throw new Error('Missing buyer/owner');
    if (!masterclassId) throw new Error('Missing masterclassId');
    if (!amountCents || amountCents < 50) throw new Error('Amount too low');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: masterclassTitle ? `Masterclass: ${masterclassTitle}` : 'Masterclass' },
            unit_amount: amountCents,
          },
        },
      ],
      metadata: {
        type: 'masterclass',
        payer_profile_id: String(buyerProfileId),
        buyer_profile_id: String(buyerProfileId),
        owner_profile_id: String(ownerProfileId),
        masterclass_id: String(masterclassId),
        masterclass_title: masterclassTitle ? String(masterclassTitle) : '',
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
