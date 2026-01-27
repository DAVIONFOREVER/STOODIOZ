import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function restFetch(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  return res;
}

async function getLabelName(labelId: string | null): Promise<string> {
  if (!labelId) return '';
  const labelRes = await restFetch(`/rest/v1/labels?select=name&id=eq.${encodeURIComponent(labelId)}`);
  if (labelRes.ok) {
    const rows = await labelRes.json().catch(() => []);
    const name = Array.isArray(rows) ? rows[0]?.name : rows?.name;
    if (name) return name;
  }
  const profRes = await restFetch(`/rest/v1/profiles?select=name&id=eq.${encodeURIComponent(labelId)}`);
  if (profRes.ok) {
    const rows = await profRes.json().catch(() => []);
    const name = Array.isArray(rows) ? rows[0]?.name : rows?.name;
    if (name) return name;
  }
  return '';
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
    if (!token) throw new Error('Missing token');

    let roster: any = null;
    const byToken = await restFetch(`/rest/v1/label_roster?select=*&claim_token=eq.${encodeURIComponent(token)}`);
    if (byToken.ok) {
      const rows = await byToken.json().catch(() => []);
      roster = Array.isArray(rows) ? rows[0] : rows;
    }

    if (!roster) {
      const byCode = await restFetch(`/rest/v1/label_roster?select=*&claim_code=eq.${encodeURIComponent(token)}`);
      if (byCode.ok) {
        const rows = await byCode.json().catch(() => []);
        roster = Array.isArray(rows) ? rows[0] : rows;
      }
    }

    if (!roster) {
      return new Response(JSON.stringify({ ok: false, data: null }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const labelId = roster.label_id || roster.label_profile_id || null;
    const labelName = await getLabelName(labelId);

    return new Response(JSON.stringify({
      ok: true,
      data: {
        kind: 'roster',
        roster,
        labelName: labelName || 'the label',
        role: roster.role || 'Artist',
        email: roster.email || null,
      },
    }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
