/**
 * Local handler for create-wallet-checkout in dev.
 * Runs inside Vite dev server so we use .env STRIPE_SECRET_KEY and never hit Supabase (avoids 500).
 */
import Stripe from 'stripe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Content-Type': 'application/json',
};

export async function handleCreateWalletCheckout(bodyStr, env) {
  const secretKey = env.STRIPE_SECRET_KEY || env.VITE_STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith('sk_')) {
    return {
      status: 400,
      body: JSON.stringify({
        error: 'STRIPE_SECRET_KEY is missing. Add STRIPE_SECRET_KEY=sk_test_... to your .env file in the project root (same folder as package.json), then restart the dev server.',
      }),
    };
  }

  let body;
  try {
    body = JSON.parse(bodyStr || '{}');
  } catch {
    return { status: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const profileId = body.payer_profile_id ?? body.payerProfileId;
  if (!profileId) {
    return { status: 400, body: JSON.stringify({ error: 'Missing payer_profile_id or payerProfileId' }) };
  }

  const success = (body.success_url ?? body.successUrl ?? '').trim();
  const cancel = (body.cancel_url ?? body.cancelUrl ?? '').trim();
  if (!success || !cancel || !success.startsWith('http')) {
    return { status: 400, body: JSON.stringify({ error: 'Missing or invalid success_url or cancel_url (must be full URLs)' }) };
  }

  const amountDollars = typeof body.amount_dollars === 'number' ? body.amount_dollars : (body.amountCents ?? body.amount ?? 0) / 100;
  const amountCents = Math.round(Number(amountDollars) * 100);
  if (!amountCents || amountCents < 50) {
    return { status: 400, body: JSON.stringify({ error: 'Amount too low (min $0.50)' }) };
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
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
      note: body.note ? String(body.note) : '',
    },
    success_url: success,
    cancel_url: cancel,
  });

  return {
    status: 200,
    body: JSON.stringify({ sessionId: session.id, url: session.url ?? null }),
  };
}

export function createWalletCheckoutMiddleware(env) {
  return async (req, res, next) => {
    if (req.method === 'OPTIONS' && req.url?.includes('create-wallet-checkout')) {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }
    if (req.method !== 'POST' || !req.url?.includes('/supabase-functions/create-wallet-checkout')) {
      next();
      return;
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyStr = Buffer.concat(chunks).toString('utf8');

    try {
      const { status, body } = await handleCreateWalletCheckout(bodyStr, env);
      res.writeHead(status, { ...corsHeaders, 'Content-Length': Buffer.byteLength(body) });
      res.end(body);
    } catch (e) {
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ error: (e && e.message) || String(e) }));
    }
  };
}
