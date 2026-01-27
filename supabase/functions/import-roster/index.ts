import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type RosterRow = {
  name: string;
  email: string;
  role: 'artist' | 'producer' | 'engineer';
  phone?: string;
  instagram?: string;
  notes?: string;
};

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

async function getProfileByEmail(email: string) {
  const res = await restFetch(`/rest/v1/profiles?select=id,claim_status,email&email=eq.${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function createProfile(payload: Record<string, unknown>) {
  const res = await restFetch('/rest/v1/profiles', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}

async function upsertRoleRecord(table: string, payload: Record<string, unknown>) {
  await restFetch(`/rest/v1/${table}?on_conflict=id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(payload),
  });
}

async function insertRosterEntry(payload: Record<string, unknown>) {
  await restFetch('/rest/v1/label_roster', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Returns the response so caller can parse user.id when ok. Does not throw. */
async function inviteByEmail(email: string, data: Record<string, unknown>): Promise<Response> {
  return restFetch('/auth/v1/admin/invite', {
    method: 'POST',
    body: JSON.stringify({ email, data }),
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
    const labelId = body?.labelId as string;
    const rows = (body?.rows || []) as RosterRow[];
    const appOrigin = (body?.appOrigin as string) || '';

    if (!labelId) throw new Error('Missing labelId');
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('No rows provided');
    // Unlimited rows: we loop over all; for very large files consider batching in the client

    const errors: { email?: string; name?: string; message: string }[] = [];
    let imported = 0;

    for (const row of rows) {
      const name = (row?.name || '').trim();
      const email = (row?.email || '').trim().toLowerCase();
      const role = (row?.role || 'artist').toLowerCase() as RosterRow['role'];

      if (!name || !email) {
        errors.push({ name, email, message: 'Missing name or email' });
        continue;
      }
      if (!['artist', 'producer', 'engineer'].includes(role)) {
        errors.push({ name, email, message: 'Invalid role' });
        continue;
      }

      const claimToken = crypto.randomUUID();
      const claimCode = Math.random().toString().slice(2, 8);
      const claimUrl = appOrigin ? `${appOrigin.replace(/\/$/, '')}/?claim=${claimToken}` : '';

      const roleTableMap: Record<string, string> = {
        artist: 'artists',
        producer: 'producers',
        engineer: 'engineers',
      };
      const tableName = roleTableMap[role];

      let profile = await getProfileByEmail(email);
      let profileId = profile?.id;

      if (profileId) {
        // Existing profile: add to roster with claim token so they can link via /?claim=TOKEN
        await upsertRoleRecord(tableName, {
          id: profileId,
          profile_id: profileId,
          name,
          email,
          image_url: null,
          bio: row?.notes ?? null,
          label_id: labelId,
          created_at: new Date().toISOString(),
          wallet_balance: 0,
          ...(role === 'engineer' ? { specialties: [] } : {}),
          ...(role === 'producer' ? { genres: [] } : {}),
        });
        await insertRosterEntry({
          id: crypto.randomUUID(),
          label_id: labelId,
          label_profile_id: labelId,
          user_id: profileId,
          artist_profile_id: profileId,
          role,
          email,
          claim_token: claimToken,
          claim_code: claimCode,
          is_pending: true,
          created_at: new Date().toISOString(),
        });
        imported += 1;
        continue;
      }

      // New user: try invite first so we can tie profile to auth.uid; on failure create shadow + claim link
      let inviteId: string | null = null;
      try {
        const invRes = await inviteByEmail(email, {
          label_id: labelId,
          roster_role: role,
          claim_token: claimToken,
          claim_code: claimCode,
          claim_url: claimUrl,
        });
        if (invRes.ok) {
          const invBody = await invRes.json().catch(() => ({}));
          inviteId = invBody?.id ?? invBody?.user?.id ?? null;
        } else {
          const txt = await invRes.text().catch(() => '');
          errors.push({ name, email, message: `Invite: ${txt.slice(0, 120)}` });
        }
      } catch (invErr) {
        errors.push({ name, email, message: `Invite failed: ${(invErr as Error).message}` });
      }

      profileId = inviteId ?? crypto.randomUUID();
      await createProfile({
        id: profileId,
        email,
        role: role.toUpperCase(),
        full_name: name,
        name,
        claim_status: inviteId ? 'INVITED' : 'UNCLAIMED',
        created_at: new Date().toISOString(),
        ...(inviteId ? { label_verified: true, verified_by_label_id: labelId } : {}),
      });
      await upsertRoleRecord(tableName, {
        id: profileId,
        profile_id: profileId,
        name,
        email,
        image_url: null,
        bio: row?.notes ?? null,
        label_id: labelId,
        created_at: new Date().toISOString(),
        wallet_balance: 0,
        ...(role === 'engineer' ? { specialties: [] } : {}),
        ...(role === 'producer' ? { genres: [] } : {}),
      });
      await insertRosterEntry({
        id: crypto.randomUUID(),
        label_id: labelId,
        label_profile_id: labelId,
        user_id: profileId,
        artist_profile_id: profileId,
        role,
        email,
        claim_token: inviteId ? null : claimToken,
        claim_code: claimCode,
        is_pending: !inviteId,
        created_at: new Date().toISOString(),
      });
      imported += 1;
    }

    return new Response(JSON.stringify({ imported, errors }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
