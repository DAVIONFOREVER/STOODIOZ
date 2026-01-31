import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { stripe } from '../_shared/stripe.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type ProfileRow = {
  id: string;
  email?: string | null;
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
    `profiles?id=eq.${encodeURIComponent(profileId)}&select=id,email,stripe_connect_account_id,stripe_connect_id,payouts_enabled`,
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
    const { profileId, returnUrl, refreshUrl } = body || {};

    if (!profileId) throw new Error('Missing profileId');
    if (!returnUrl || !refreshUrl) throw new Error('Missing returnUrl or refreshUrl');

    const profile = await fetchProfile(String(profileId));
    if (!profile?.id) throw new Error('Profile not found');

    let connectAccountId =
      profile.stripe_connect_account_id || profile.stripe_connect_id || null;

    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile.email || undefined,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      });
      connectAccountId = account.id;
      await updateProfile(String(profileId), {
        stripe_connect_account_id: connectAccountId,
        payouts_enabled: false,
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: String(connectAccountId),
      refresh_url: String(refreshUrl),
      return_url: String(returnUrl),
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: accountLink.url, accountId: connectAccountId }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
