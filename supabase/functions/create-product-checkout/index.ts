import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function fetchProduct(productId: string): Promise<{ id: string; producer_id: string; title: string; price: number; delivery_type: string; delivery_value: string } | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/producer_products?id=eq.${encodeURIComponent(productId)}&select=id,producer_id,title,price,delivery_type,delivery_value`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
    },
  });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function insertBooking(payload: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[create-product-checkout] missing supabase env, skipping booking insert');
    return null;
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.warn('[create-product-checkout] booking insert failed', res.status, txt);
    return null;
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}

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
    const { productId, amountCents, buyerProfileId, producerProfileId, successUrl, cancelUrl, userRole } = body || {};

    if (!productId || !buyerProfileId || !producerProfileId) throw new Error('Missing product, buyer or producer');
    if (!amountCents || amountCents < 50) throw new Error('Amount too low');

    const product = await fetchProduct(String(productId));
    if (!product) throw new Error('Product not found');
    if (String(product.producer_id) !== String(producerProfileId)) throw new Error('Producer mismatch');
    const expectedCents = Math.round(Number(product.price || 0) * 100);
    if (amountCents !== expectedCents) throw new Error('Price mismatch');

    const bookingId = crypto.randomUUID();
    const now = new Date();
    const date = now.toISOString().slice(0, 10);

    const bookingPayload = {
      id: bookingId,
      date,
      start_time: 'N/A',
      duration: 0,
      total_cost: Number(amountCents) / 100,
      status: 'PENDING',
      request_type: 'PRODUCT_PURCHASE',
      engineer_pay_rate: 0,
      booked_by_id: String(buyerProfileId),
      producer_id: String(producerProfileId),
      product_purchase: {
        product_id: String(product.id),
        delivery_type: String(product.delivery_type),
        delivery_value: String(product.delivery_value),
      },
      posted_by: userRole ? String(userRole) : null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const booking = await insertBooking(bookingPayload);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: product.title ? `Kit/Preset: ${product.title}` : 'Kit or Preset' },
            unit_amount: amountCents,
          },
        },
      ],
      metadata: {
        type: 'kit_purchase',
        booking_id: bookingId,
        payer_profile_id: String(buyerProfileId),
        buyer_profile_id: String(buyerProfileId),
        producer_profile_id: String(producerProfileId),
        product_id: String(product.id),
      },
      success_url: successUrl
        ? `${successUrl}${successUrl.includes('?') ? '&' : '?'}kit_purchase=1&booking_id=${bookingId}`
        : successUrl,
      cancel_url: cancelUrl,
    });

    return new Response(JSON.stringify({ sessionId: session.id, booking }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
