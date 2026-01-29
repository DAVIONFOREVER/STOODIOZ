import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function insertBooking(payload: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[create-booking-checkout] missing supabase env, skipping booking insert');
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
    console.warn('[create-booking-checkout] booking insert failed', res.status, txt);
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
      payerProfileId,
      stoodioId,
      userRole,
      bookingRequest,
      successUrl,
      cancelUrl,
    } = body || {};

    if (!payerProfileId) throw new Error('Missing payerProfileId');
    if (!amountCents || amountCents < 50) throw new Error('Amount too low');

    const bookingId = crypto.randomUUID();
    const now = new Date();
    const date = bookingRequest?.date || now.toISOString().slice(0, 10);
    const startTime = bookingRequest?.start_time || bookingRequest?.time || '12:00';
    const duration = Number(bookingRequest?.duration ?? 0);

    const bookingPayload = {
      id: bookingId,
      date,
      start_time: String(startTime),
      duration,
      total_cost: Number(bookingRequest?.total_cost ?? 0),
      status: 'PENDING',
      request_type: String(bookingRequest?.request_type || 'FIND_AVAILABLE'),
      engineer_pay_rate: Number(bookingRequest?.engineer_pay_rate ?? 0),
      booked_by_id: String(payerProfileId),
      stoodio_id: stoodioId ? String(stoodioId) : null,
      requested_engineer_id: bookingRequest?.requested_engineer_id ? String(bookingRequest.requested_engineer_id) : null,
      producer_id: bookingRequest?.producer_id ? String(bookingRequest.producer_id) : null,
      posted_by: userRole ? String(userRole) : null,
      payment_source: bookingRequest?.payment_source ? String(bookingRequest.payment_source) : null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const booking = await insertBooking(bookingPayload);

    const metadata: Record<string, string> = {
      type: 'booking',
      booking_id: bookingId,
      payer_profile_id: String(payerProfileId),
      stoodio_id: stoodioId ? String(stoodioId) : '',
      payee_profile_id: stoodioId ? String(stoodioId) : '',
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
