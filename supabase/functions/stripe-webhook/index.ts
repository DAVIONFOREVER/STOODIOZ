import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type ProfileRow = {
  id: string;
  wallet_balance?: number | null;
  wallet_transactions?: any[] | null;
  stripe_customer_id?: string | null;
  stripe_connect_account_id?: string | null;
  stripe_connect_id?: string | null;
  payouts_enabled?: boolean | null;
  purchased_masterclass_ids?: string[] | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function toAmount(amountCents?: number | null): number {
  const cents = Number(amountCents || 0);
  return Math.round(cents) / 100;
}

async function supabaseFetch(path: string, init: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
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

async function fetchProfile(profileId: string): Promise<ProfileRow | null> {
  const res = await supabaseFetch(
    `profiles?id=eq.${encodeURIComponent(profileId)}&select=id,wallet_balance,wallet_transactions,stripe_customer_id,stripe_connect_account_id,stripe_connect_id,payouts_enabled,purchased_masterclass_ids,subscription_status,current_period_end`,
    { method: 'GET' }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : null;
}

async function fetchProfileByStripeCustomer(customerId: string): Promise<ProfileRow | null> {
  const res = await supabaseFetch(
    `profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}&select=id,wallet_balance,wallet_transactions,stripe_customer_id,purchased_masterclass_ids,subscription_status,current_period_end`,
    { method: 'GET' }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : null;
}

async function fetchProfileByConnectId(connectId: string): Promise<ProfileRow | null> {
  const res = await supabaseFetch(
    `profiles?or=(stripe_connect_account_id.eq.${encodeURIComponent(connectId)},stripe_connect_id.eq.${encodeURIComponent(connectId)})&select=id,stripe_connect_account_id,stripe_connect_id,payouts_enabled`,
    { method: 'GET' }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : null;
}

async function fetchBooking(bookingId: string): Promise<{ id: string; status?: string | null } | null> {
  const res = await supabaseFetch(
    `bookings?id=eq.${encodeURIComponent(bookingId)}&select=id,status`,
    { method: 'GET' }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : null;
}

async function updateProfile(profileId: string, patch: Record<string, unknown>) {
  await supabaseFetch(`profiles?id=eq.${encodeURIComponent(profileId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...patch, updated_at: nowIso() }),
    headers: { Prefer: 'return=representation' },
  });
}

async function updateBookingStatus(bookingId: string, status: string) {
  await supabaseFetch(`bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, updated_at: nowIso() }),
    headers: { Prefer: 'return=representation' },
  });
}

async function recordStripeEvent(eventId: string, eventType: string, created: number) {
  const exists = await supabaseFetch(
    `stripe_events?event_id=eq.${encodeURIComponent(eventId)}&select=id`,
    { method: 'GET' }
  );
  if (exists.ok) {
    const rows = await exists.json().catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) return false;
  }

  const res = await supabaseFetch('stripe_events', {
    method: 'POST',
    body: JSON.stringify({
      event_id: eventId,
      event_type: eventType,
      stripe_created_at: new Date(created * 1000).toISOString(),
    }),
  });

  if (!res.ok) {
    // Conflict or unexpected error: treat as already processed to prevent double-apply.
    return false;
  }
  return true;
}

async function appendWalletTransaction(
  profileId: string,
  tx: Record<string, unknown>,
  balanceDelta: number
) {
  const profile = await fetchProfile(profileId);
  if (!profile?.id) return;
  const currentBalance = Number(profile.wallet_balance || 0);
  const nextBalance = currentBalance + Number(balanceDelta || 0);
  const currentTx = Array.isArray(profile.wallet_transactions)
    ? profile.wallet_transactions
    : [];
  const nextTx = [...currentTx, tx].slice(-200);
  await updateProfile(profileId, {
    wallet_balance: nextBalance,
    wallet_transactions: nextTx,
  });
}

function buildTx(params: {
  description: string;
  amount: number;
  category: string;
  status?: string;
  related_booking_id?: string;
  related_user_name?: string;
  note?: string;
  source?: string;
}) {
  return {
    id: crypto.randomUUID(),
    date: nowIso(),
    description: params.description,
    amount: Number(params.amount || 0),
    category: params.category,
    status: params.status || 'COMPLETED',
    related_booking_id: params.related_booking_id || null,
    related_user_name: params.related_user_name || null,
    note: params.note || null,
    source: params.source || 'stripe',
  };
}

async function handleCheckoutSessionCompleted(session: any) {
  const metadata = session?.metadata || {};
  const amount = toAmount(session?.amount_total);
  const bookingId = metadata.booking_id ? String(metadata.booking_id) : '';
  const type = metadata.type || '';

  if (type === 'booking') {
    if (bookingId) {
      const booking = await fetchBooking(bookingId);
      const status = String(booking?.status || '').toUpperCase();
      const isPendingLabelApproval =
        status === 'PENDING_LABEL_APPROVAL' || status === 'PENDING_APPROVAL';
      if (!isPendingLabelApproval) {
        await updateBookingStatus(bookingId, 'CONFIRMED');
      }
    }
    const payeeId = metadata.payee_profile_id || metadata.stoodio_id;
    if (payeeId) {
      const tx = buildTx({
        description: 'Booking payment',
        amount,
        category: 'SESSION_PAYOUT',
        related_booking_id: bookingId || undefined,
      });
      await appendWalletTransaction(String(payeeId), tx, amount);
    }
    if (metadata.payer_profile_id) {
      const tx = buildTx({
        description: 'Booking payment',
        amount: -amount,
        category: 'SESSION_PAYMENT',
        related_booking_id: bookingId || undefined,
      });
      await appendWalletTransaction(String(metadata.payer_profile_id), tx, 0);
    }
    return;
  }

  if (type === 'beat_purchase' || type === 'kit_purchase') {
    if (bookingId) {
      await updateBookingStatus(bookingId, 'CONFIRMED');
    }
    const producerId = metadata.producer_profile_id;
    if (producerId) {
      const tx = buildTx({
        description: type === 'beat_purchase' ? 'Beat sale' : 'Kit/preset sale',
        amount,
        category: type === 'beat_purchase' ? 'BEAT_SALE' : 'SESSION_PAYOUT',
        related_booking_id: bookingId || undefined,
      });
      await appendWalletTransaction(String(producerId), tx, amount);
    }
    const buyerId = metadata.buyer_profile_id || metadata.payer_profile_id;
    if (buyerId) {
      const tx = buildTx({
        description: type === 'beat_purchase' ? 'Beat purchase' : 'Kit/preset purchase',
        amount: -amount,
        category: type === 'beat_purchase' ? 'BEAT_PURCHASE' : 'SESSION_PAYMENT',
        related_booking_id: bookingId || undefined,
      });
      await appendWalletTransaction(String(buyerId), tx, 0);
    }
    return;
  }

  if (type === 'wallet_topup') {
    const payerId = metadata.payer_profile_id || metadata.payerProfileId;
    const note = metadata.note || '';
    if (payerId) {
      const tx = buildTx({
        description: 'Wallet top-up',
        amount,
        category: 'ADD_FUNDS',
        note,
      });
      await appendWalletTransaction(String(payerId), tx, amount);
    } else {
      console.warn('[stripe-webhook] wallet_topup: missing payer_profile_id in metadata', { metadata: Object.keys(metadata) });
    }
    return;
  }

  if (type === 'tip') {
    const toId = metadata.to_profile_id;
    const fromId = metadata.from_profile_id;
    const note = metadata.note || '';
    if (toId) {
      const tx = buildTx({
        description: 'Tip received',
        amount,
        category: 'TIP_PAYOUT',
        related_booking_id: bookingId || undefined,
        note,
      });
      await appendWalletTransaction(String(toId), tx, amount);
    }
    if (fromId) {
      const tx = buildTx({
        description: 'Tip sent',
        amount: -amount,
        category: 'TIP_PAYMENT',
        related_booking_id: bookingId || undefined,
        note,
      });
      await appendWalletTransaction(String(fromId), tx, 0);
    }
    return;
  }

  if (type === 'masterclass') {
    const buyerId = metadata.buyer_profile_id;
    const ownerId = metadata.owner_profile_id;
    const masterclassId = metadata.masterclass_id;
    if (buyerId && masterclassId) {
      const profile = await fetchProfile(String(buyerId));
      const existing = Array.isArray(profile?.purchased_masterclass_ids)
        ? profile?.purchased_masterclass_ids
        : [];
      const next = existing.includes(String(masterclassId))
        ? existing
        : [...existing, String(masterclassId)];
      await updateProfile(String(buyerId), { purchased_masterclass_ids: next });
      const tx = buildTx({
        description: 'Masterclass purchase',
        amount: -amount,
        category: 'MASTERCLASS_PURCHASE',
      });
      await appendWalletTransaction(String(buyerId), tx, 0);
    }
    if (ownerId) {
      const tx = buildTx({
        description: 'Masterclass payout',
        amount,
        category: 'MASTERCLASS_PAYOUT',
      });
      await appendWalletTransaction(String(ownerId), tx, amount);
    }
    return;
  }

  if (type === 'subscription') {
    const profileId = metadata.profile_id || metadata.payer_profile_id;
    if (profileId && session?.customer) {
      let currentPeriodEnd: string | null = null;
      if (session?.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(String(session.subscription));
          currentPeriodEnd = sub?.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;
        } catch {
          currentPeriodEnd = null;
        }
      }
      await updateProfile(String(profileId), {
        stripe_customer_id: String(session.customer),
        subscription_status: session.payment_status === 'paid' ? 'active' : 'pending',
        ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
      });
    }
  }
}

async function handleSubscriptionEvent(eventType: string, sub: any) {
  const customerId = sub?.customer ? String(sub.customer) : '';
  if (!customerId) return;
  const profile = await fetchProfileByStripeCustomer(customerId);
  if (!profile?.id) return;
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;
  if (eventType === 'customer.subscription.deleted') {
    await updateProfile(profile.id, {
      subscription_status: 'cancelled',
      ...(periodEnd ? { current_period_end: periodEnd } : {}),
    });
    return;
  }
  if (eventType === 'customer.subscription.created') {
    await updateProfile(profile.id, {
      subscription_status: sub?.status || 'active',
      ...(periodEnd ? { current_period_end: periodEnd } : {}),
    });
  }
}

async function handleInvoiceEvent(eventType: string, invoice: any) {
  const customerId = invoice?.customer ? String(invoice.customer) : '';
  if (!customerId) return;
  const profile = await fetchProfileByStripeCustomer(customerId);
  if (!profile?.id) return;
  if (eventType === 'invoice.paid') {
    await updateProfile(profile.id, { subscription_status: 'active' });
  } else if (eventType === 'invoice.payment_failed') {
    await updateProfile(profile.id, { subscription_status: 'past_due' });
  }
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
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!sig || !webhookSecret) {
      throw new Error('Missing stripe signature or webhook secret');
    }

    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    const shouldProcess = await recordStripeEvent(event.id, event.type, event.created);
    if (!shouldProcess) {
      return new Response(JSON.stringify({ received: true, deduped: true }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as any;
        const connectId = String(account.id || '');
        if (connectId) {
          const profile = await fetchProfileByConnectId(connectId);
          if (profile?.id) {
            await updateProfile(profile.id, {
              payouts_enabled: Boolean(account.payouts_enabled),
            });
          }
        }
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case 'customer.subscription.created': {
        const sub = event.data.object as any;
        await handleSubscriptionEvent(event.type, sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await handleSubscriptionEvent(event.type, sub);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as any;
        await handleInvoiceEvent(event.type, invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        await handleInvoiceEvent(event.type, invoice);
        break;
      }
      default:
        console.log('[stripe-webhook] unhandled event', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
