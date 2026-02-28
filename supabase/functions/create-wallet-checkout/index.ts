import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const json = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });

serve(async (req) => {
  try {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    // Check Stripe key BEFORE importing stripe (stripe.ts throws on load if missing)
    const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!secretKey || !secretKey.startsWith('sk_')) {
      return json({
        error: 'STRIPE_SECRET_KEY is missing or invalid. Supabase Dashboard → Project Settings → Edge Functions → Secrets → add STRIPE_SECRET_KEY (use test key sk_test_... for sandbox).',
      }, 400);
    }

    const body = await req.json().catch(() => ({}));
    const {
      amount_dollars,
      amountCents: bodyCents,
      amount,
      payerProfileId,
      payer_profile_id,
      successUrl,
      success_url,
      cancelUrl,
      cancel_url,
      note,
    } = body || {};

    const profileId = payerProfileId ?? payer_profile_id;
    if (!profileId) return json({ error: 'Missing payerProfileId or payer_profile_id' }, 400);

    const success = (success_url ?? successUrl ?? '').trim();
    const cancel = (cancel_url ?? cancelUrl ?? '').trim();
    if (!success || !cancel || !success.startsWith('http')) {
      return json({ error: 'Missing or invalid success_url or cancel_url (must be full URLs)' }, 400);
    }

    // Import only after we know the key exists (avoids throw-on-load)
    const { stripe } = await import('../_shared/stripe.ts');

    // Accept amount_dollars (new) or amountCents/amount (backward compat)
    const amountCents =
      amount_dollars != null
        ? Math.round(Number(amount_dollars) * 100)
        : Number(bodyCents ?? amount ?? 0);
    if (!amountCents || amountCents < 50) return json({ error: 'Amount too low (min $0.50)' }, 400);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: 'Wallet Top-Up' },
            unit_amount: amountCents,
          },
        },
      ],
      metadata: {
        type: 'wallet_topup',
        payer_profile_id: String(profileId),
        note: note ? String(note) : '',
      },
      success_url: success,
      cancel_url: cancel,
    });

    return json({
      sessionId: session.id,
      url: session.url ?? null,
    });
  } catch (error) {
    const msg = (error as Error)?.message || String(error);
    return json({ error: msg || 'Unknown error creating checkout' }, 500);
  }
});
