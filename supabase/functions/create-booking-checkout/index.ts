import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function supabaseFetch(path: string, init: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), { status: 500 });
  }
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
  return res;
}

async function fetchRosterEntry(profileId: string) {
  const res = await supabaseFetch(
    `label_roster?select=*&or=(artist_profile_id.eq.${encodeURIComponent(profileId)},user_id.eq.${encodeURIComponent(profileId)})&dropped_at=is.null&limit=1`,
    { method: 'GET' }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : null;
}

async function fetchProfileName(profileId: string) {
  const res = await supabaseFetch(
    `profiles?id=eq.${encodeURIComponent(profileId)}&select=id,name,full_name,display_name,username`,
    { method: 'GET' }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  const profile = Array.isArray(rows) ? rows[0] : null;
  return profile?.display_name || profile?.name || profile?.full_name || profile?.username || null;
}

async function insertLabelNotification(payload: Record<string, unknown>) {
  const res = await supabaseFetch('label_notifications', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.warn('[create-booking-checkout] label_notifications insert failed', res.status);
  }
}

async function insertLabelApproval(payload: Record<string, unknown>) {
  const res = await supabaseFetch('label_booking_approvals', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.warn('[create-booking-checkout] label_booking_approvals insert failed', res.status);
  }
}

async function updateRosterRemaining(id: string, remainingAmount: number) {
  const res = await supabaseFetch(`label_roster?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ remaining_amount: remainingAmount, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) {
    console.warn('[create-booking-checkout] label_roster update failed', res.status);
  }
}

async function insertLabelTransaction(payload: Record<string, unknown>) {
  const res = await supabaseFetch('label_transactions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.warn('[create-booking-checkout] label_transactions insert failed', res.status);
  }
}

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

    const bookingTotal = Number(bookingRequest?.total_cost ?? 0);
    const rosterEntry = payerProfileId ? await fetchRosterEntry(String(payerProfileId)) : null;
    const labelProfileId = rosterEntry?.label_profile_id || rosterEntry?.label_id || null;
    const allocationRemaining = Number(rosterEntry?.remaining_amount ?? rosterEntry?.allocation_amount ?? 0);
    const canAutoApprove = !!labelProfileId && allocationRemaining >= bookingTotal && bookingTotal > 0;

    const bookingPayload = {
      id: bookingId,
      date,
      start_time: String(startTime),
      duration,
      total_cost: bookingTotal,
      status: labelProfileId ? (canAutoApprove ? 'CONFIRMED' : 'PENDING_LABEL_APPROVAL') : 'PENDING',
      request_type: String(bookingRequest?.request_type || 'FIND_AVAILABLE'),
      engineer_pay_rate: Number(bookingRequest?.engineer_pay_rate ?? 0),
      booked_by_id: String(payerProfileId),
      stoodio_id: stoodioId ? String(stoodioId) : null,
      requested_engineer_id: bookingRequest?.requested_engineer_id ? String(bookingRequest.requested_engineer_id) : null,
      producer_id: bookingRequest?.producer_id ? String(bookingRequest.producer_id) : null,
      posted_by: userRole ? String(userRole) : null,
      payment_source: bookingRequest?.payment_source ? String(bookingRequest.payment_source) : null,
      ...(labelProfileId ? { label_profile_id: String(labelProfileId) } : {}),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const booking = await insertBooking(bookingPayload);

    if (labelProfileId) {
      const artistName = await fetchProfileName(String(payerProfileId));
      await insertLabelApproval({
        booking_id: bookingId,
        label_profile_id: String(labelProfileId),
        artist_profile_id: String(payerProfileId),
        status: canAutoApprove ? 'APPROVED' : 'PENDING',
        funding_source: 'ALLOCATION',
        funding_amount: bookingTotal,
        approved_at: canAutoApprove ? now.toISOString() : null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

      if (canAutoApprove && rosterEntry?.id) {
        const remaining = Math.max(0, allocationRemaining - bookingTotal);
        await updateRosterRemaining(String(rosterEntry.id), remaining);
        await insertLabelTransaction({
          label_profile_id: String(labelProfileId),
          artist_id: String(payerProfileId),
          booking_id: bookingId,
          amount: -Math.abs(bookingTotal),
          kind: 'spend',
          note: 'Label booking auto-approval',
          created_at: now.toISOString(),
        });
      }

      await insertLabelNotification({
        label_id: String(labelProfileId),
        type: 'booking',
        title: canAutoApprove ? 'Booking auto-approved' : 'Booking needs approval',
        message: canAutoApprove
          ? `${artistName || 'Roster artist'} booking auto-approved.`
          : `${artistName || 'Roster artist'} requested a booking that needs approval.`,
        priority: canAutoApprove ? 'normal' : 'high',
        related_artist_name: artistName,
        related_booking_id: bookingId,
        created_at: now.toISOString(),
      });
    }

    const metadata: Record<string, string> = {
      type: 'booking',
      booking_id: bookingId,
      payer_profile_id: String(payerProfileId),
      stoodio_id: stoodioId ? String(stoodioId) : '',
      payee_profile_id: stoodioId ? String(stoodioId) : '',
      user_role: userRole ? String(userRole) : '',
      label_profile_id: labelProfileId ? String(labelProfileId) : '',
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
