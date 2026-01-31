import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { stripe } from '../_shared/stripe.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type ProfileRow = {
  id: string;
  wallet_balance?: number | null;
  wallet_transactions?: any[] | null;
  stripe_connect_account_id?: string | null;
  stripe_connect_id?: string | null;
  payouts_enabled?: boolean | null;
};

function nowIso() {
  return new Date().toISOString();
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
    `profiles?id=eq.${encodeURIComponent(profileId)}&select=id,wallet_balance,wallet_transactions,stripe_connect_account_id,stripe_connect_id,payouts_enabled`,
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

function buildTx(params: {
  description: string;
  amount: number;
  category: string;
  status?: string;
}) {
  return {
    id: crypto.randomUUID(),
    date: nowIso(),
    description: params.description,
    amount: Number(params.amount || 0),
    category: params.category,
    status: params.status || 'COMPLETED',
    source: 'stripe',
  };
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
    const { profileId, amount } = body || {};

    if (!profileId) throw new Error('Missing profileId');
    if (!amount || Number(amount) <= 0) throw new Error('Invalid amount');

    const profile = await fetchProfile(String(profileId));
    if (!profile?.id) throw new Error('Profile not found');

    const connectAccountId = profile.stripe_connect_account_id || profile.stripe_connect_id;
    if (!connectAccountId) throw new Error('Missing Stripe connected account');
    if (profile.payouts_enabled === false) throw new Error('Payouts are not enabled for this account');

    const currentBalance = Number(profile.wallet_balance || 0);
    const payoutAmount = Number(amount);
    if (currentBalance < payoutAmount) throw new Error('Insufficient wallet balance');

    const transfer = await stripe.transfers.create({
      amount: Math.round(payoutAmount * 100),
      currency: 'usd',
      destination: String(connectAccountId),
      metadata: {
        profile_id: String(profileId),
        type: 'payout_request',
      },
    });

    // Attempt instant payout from the connected account balance
    let payoutId: string | null = null;
    try {
      const payout = await stripe.payouts.create(
        {
          amount: Math.round(payoutAmount * 100),
          currency: 'usd',
          method: 'instant',
          metadata: {
            profile_id: String(profileId),
            type: 'instant_payout',
          },
        },
        { stripeAccount: String(connectAccountId) }
      );
      payoutId = payout.id;
    } catch (payoutErr) {
      console.warn('[request-payout] Instant payout failed, transfer completed:', payoutErr);
    }

    const currentTx = Array.isArray(profile.wallet_transactions)
      ? profile.wallet_transactions
      : [];
    const tx = buildTx({
      description: 'Payout request',
      amount: -payoutAmount,
      category: 'WITHDRAWAL',
    });
    const nextTx = [...currentTx, tx].slice(-200);

    await updateProfile(String(profileId), {
      wallet_balance: currentBalance - payoutAmount,
      wallet_transactions: nextTx,
    });

    return new Response(JSON.stringify({ transferId: transfer.id, payoutId }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
