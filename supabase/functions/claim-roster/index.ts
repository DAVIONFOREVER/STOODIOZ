import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function restFetch(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  const res = await fetch(`${SUPABASE_URL}${path}`, {
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

async function findRosterByTokenOrCode(token: string) {
  const byToken = await restFetch(`/rest/v1/label_roster?select=*&claim_token=eq.${encodeURIComponent(token)}`);
  if (byToken.ok) {
    const rows = await byToken.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (row) return row;
  }

  const byCode = await restFetch(`/rest/v1/label_roster?select=*&claim_code=eq.${encodeURIComponent(token)}`);
  if (byCode.ok) {
    const rows = await byCode.json().catch(() => []);
    return Array.isArray(rows) ? rows[0] : rows;
  }
  return null;
}

async function updateRoster(id: string, patch: Record<string, unknown>) {
  await restFetch(`/rest/v1/label_roster?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
}

async function updateProfileClaimStatus(profileId: string, status: string) {
  await restFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ claim_status: status, updated_at: new Date().toISOString() }),
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
    const token = String(body?.token || '');
    const claimantProfileId = String(body?.claimantProfileId || '');
    if (!token) throw new Error('Missing token');
    if (!claimantProfileId) throw new Error('Missing claimantProfileId');

    const roster = await findRosterByTokenOrCode(token);
    if (!roster) throw new Error('Invalid claim token');

    if (roster.claimed || roster.is_claimed) {
      throw new Error('Roster spot already claimed');
    }

    await updateRoster(roster.id, {
      claimed_by_user_id: claimantProfileId,
      claimed: true,
      is_claimed: true,
      is_pending: false,
      claim_token: null,
      claim_code: null,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await updateProfileClaimStatus(claimantProfileId, 'CLAIMED');

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
