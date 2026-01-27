import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function insertBooking(payload: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[create-beat-checkout] missing supabase env, skipping booking insert');
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
    console.warn('[create-beat-checkout] booking insert failed', res.status, txt);
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
    const {
      amountCents,
      buyerProfileId,
      producerProfileId,
      purchaseType,
      userRole,
      instrumental,
      successUrl,
      cancelUrl,
    } = body || {};

    if (!buyerProfileId || !producerProfileId) throw new Error('Missing buyer/producer');
    if (!amountCents || amountCents < 50) throw new Error('Amount too low');
    if (!instrumental?.id) throw new Error('Missing instrumental');

    const bookingId = crypto.randomUUID();
    const now = new Date();
    const date = now.toISOString().slice(0, 10);

    const purchaseTypeVal = String(purchaseType || 'lease_mp3');
    const validTypes = ['lease_mp3', 'lease_wav', 'exclusive'];
    const beatPurchaseType = validTypes.includes(purchaseTypeVal) ? purchaseTypeVal : 'lease_mp3';

    const bookingPayload = {
      id: bookingId,
      date,
      start_time: 'N/A',
      duration: 0,
      total_cost: Number(amountCents) / 100,
      status: 'PENDING',
      request_type: 'BEAT_PURCHASE',
      engineer_pay_rate: 0,
      beat_purchase_type: beatPurchaseType,
      booked_by_id: String(buyerProfileId),
      producer_id: String(producerProfileId),
      instrumentals_purchased: [
        {
          id: String(instrumental.id),
          title: String(instrumental.title || 'Beat'),
          audio_url: instrumental.audio_url || null,
          wav_url: instrumental.wav_url || null,
          stems_url: instrumental.stems_url || null,
          cover_art_url: instrumental.cover_art_url || null,
        },
      ],
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
            product_data: {
              name: instrumental.title ? `Beat: ${instrumental.title}` : 'Beat Purchase',
            },
            unit_amount: amountCents,
          },
        },
      ],
      metadata: {
        type: 'beat_purchase',
        booking_id: bookingId,
        payer_profile_id: String(buyerProfileId),
        buyer_profile_id: String(buyerProfileId),
        producer_profile_id: String(producerProfileId),
        purchase_type: String(beatPurchaseType),
        instrumental_id: String(instrumental.id),
      },
      success_url: successUrl
        ? `${successUrl}${successUrl.includes('?') ? '&' : '?'}beat_purchase=1&booking_id=${bookingId}`
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
