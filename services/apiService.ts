// services/apiService.ts
// Contract-complete API layer for Stoodioz (Supabase-first, safe fallbacks, never-hang patterns)

import { getSupabase } from '../lib/supabase';
import type { UserRole } from '../types';

const DB_TIMEOUT_MS = 30_000; // Increase to reduce false timeouts
const STORAGE_TIMEOUT_MS = 20_000;
const PUBLIC_DATA_TIMEOUT_MS = 45_000;

const TABLES = {
  profiles: 'profiles',
  posts: 'posts',
  follows: 'follows',
  postLikes: 'post_likes',
  postComments: 'post_comments',
  conversations: 'conversations',
  messages: 'messages',
  liveRooms: 'live_rooms',
  liveRoomParticipants: 'live_room_participants',
  bookings: 'bookings',
  rooms: 'rooms',
  roomPhotos: 'room_photos',
  engineers: 'engineers',
  instrumentals: 'instrumentals',
  producerProducts: 'producer_products',
  mixingSamples: 'mixing_samples',
  assets: 'assets',
  documents: 'documents',
  labelRoster: 'label_roster',
  labelProjects: 'label_projects',
  labelProjectTasks: 'label_project_tasks',
  labelTransactions: 'label_transactions',
  labelContracts: 'label_contracts',
  unregisteredStudios: 'unregistered_studios',
  mixingSampleRatings: 'mixing_sample_ratings',
} as const;

const BUCKETS = {
  roomPhotos: 'room-photos',
  avatars: 'avatars',
  covers: 'covers',
  assets: 'assets',
  documents: 'documents',
  beats: 'beats',
  mixingSamples: 'mixing-samples',
  postAttachments: 'post-attachments',
} as const;

function nowIso() {
  return new Date().toISOString();
}

function errMsg(e: any) {
  return e?.message || e?.error_description || e?.error || String(e);
}

function isMissingColumnError(err: any): boolean {
  const msg = String(err?.message || err?.details || err?.hint || '');
  return /column .* does not exist/i.test(msg) || /missing column/i.test(msg);
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`[timeout] ${label} exceeded ${ms}ms`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function requireVal(v: any, name: string) {
  if (!v) throw new Error(`${name} is required`);
}

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

const getAppOrigin = () => (typeof window !== 'undefined' ? window.location.origin : '');

async function callEdgeFunction(name: string, payload: Record<string, any>) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or anon key is missing');
  }

  const supabase = getSupabase();
  const { data: sess } = await withTimeout(supabase.auth.getSession() as any, DB_TIMEOUT_MS, 'auth.getSession');
  const token = sess?.session?.access_token;

  const res = await withTimeout(
    fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    }),
    DB_TIMEOUT_MS,
    `functions.${name}`
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`functions/${name} ${res.status}: ${txt.slice(0, 200)}`);
  }

  return res.json().catch(() => ({}));
}

function fileExt(name: string) {
  const i = (name || '').lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : 'bin';
}

function randPath(prefix: string, filename: string) {
  const ext = fileExt(filename);
  const rand = Math.random().toString(16).slice(2);
  return `${prefix}/${Date.now()}-${rand}.${ext}`;
}

async function safeSelect<T = any>(label: string, fn: () => Promise<{ data: T; error: any }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await withTimeout(fn(), DB_TIMEOUT_MS, label);
    if (error) {
      console.warn(`[apiService] ${label} error:`, error);
      return fallback;
    }
    return (data as any) ?? fallback;
  } catch (e) {
    console.warn(`[apiService] ${label} threw:`, e);
    return fallback;
  }
}

async function safeWrite<T = any>(label: string, fn: () => Promise<{ data: T; error: any }>): Promise<T> {
  const { data, error } = await withTimeout(fn(), DB_TIMEOUT_MS, label);
  if (error) throw new Error(`${label}: ${errMsg(error)}`);
  return data as any;
}

async function uploadToBucket(bucket: string, path: string, file: File) {
  const supabase = getSupabase();
  // @ts-ignore
  const up = supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || undefined });
  const { error } = await withTimeout(up as any, STORAGE_TIMEOUT_MS, `storage.upload(${bucket})`);
  if (error) throw new Error(`storage.upload(${bucket}): ${errMsg(error)}`);
  // @ts-ignore
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const url = data?.publicUrl;
  if (!url) throw new Error(`storage.getPublicUrl(${bucket}) failed`);
  return { path, url };
}

/* ============================================================
   AUTH / PROFILE (LOGIN HYDRATION)
============================================================ */

export async function fetchCurrentUserProfile(uid: string): Promise<{ user: any; role: UserRole }> {
  requireVal(uid, 'uid');
  const supabase = getSupabase();

  // Prefer explicit-token REST call to avoid supabase-js query builder stalls
  try {
    const { data: sess } = await withTimeout(supabase.auth.getSession() as any, DB_TIMEOUT_MS, 'auth.getSession');
    const token = sess?.session?.access_token;
    const url = (import.meta as any).env?.VITE_SUPABASE_URL;
    const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    if (token && url && anon) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), DB_TIMEOUT_MS);
      try {
        const res = await fetch(`${url}/rest/v1/${TABLES.profiles}?id=eq.${encodeURIComponent(uid)}&select=*`, {
          method: 'GET',
          headers: {
            apikey: anon,
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`profiles REST ${res.status}: ${txt.slice(0, 200)}`);
        }
        const rows = await res.json();
        const profile = Array.isArray(rows) ? rows[0] : null;
        if (!profile) throw new Error('Profile not found');
        const role = profile.role as UserRole;
        if (!role) throw new Error('User has no role');
        let user: any = { ...profile };
        if (role === 'STOODIO') {
          try {
            const szRes = await fetch(`${url}/rest/v1/stoodioz?profile_id=eq.${encodeURIComponent(uid)}&select=id`, {
              headers: { apikey: anon, authorization: `Bearer ${token}` },
              signal: controller.signal,
            });
            if (szRes.ok) {
              const szRows = await szRes.json();
              const sz = Array.isArray(szRows) ? szRows[0] : null;
              if (sz?.id) user.stoodioz_id = sz.id;
            }
          } catch (_) { /* non-fatal */ }
        }
        return { user, role };
      } finally {
        clearTimeout(t);
      }
    }
  } catch (e) {
    console.warn('[fetchCurrentUserProfile] REST path failed, trying supabase-js:', e);
  }

  // Fallback to supabase-js
  const q = supabase.from(TABLES.profiles).select('*').eq('id', uid).single();
  const { data: profile, error } = await withTimeout(q as any, DB_TIMEOUT_MS, 'profiles.select');
  if (error) throw new Error(errMsg(error));
  if (!profile) throw new Error('Profile not found');
  const role = profile.role as UserRole;
  if (!role) throw new Error('User has no role');

  // STOODIO: capture role-table id for in-house engineer ops
  let user: any = { ...profile };
  if (role === 'STOODIO') {
    try {
      const { data: sz } = await supabase.from('stoodioz').select('id').eq('profile_id', uid).maybeSingle();
      if (sz?.id) user.role_id = sz.id;
    } catch (_) { /* non-fatal */ }
  }
  return { user, role };
}

export async function updateUser(profileId: string, patch: Record<string, any>): Promise<any> {
  requireVal(profileId, 'profileId');
  const supabase = getSupabase();
  return safeWrite('profiles.update', async () => {
    const q = supabase.from(TABLES.profiles).update({ ...patch, updated_at: nowIso() }).eq('id', profileId).select('*').single();
    return q as any;
  });
}

export async function createUser(payload: Record<string, any>, role?: UserRole): Promise<any> {
  // Client-side can’t create auth users safely; this is a “shadow profile” creator.
  // Prefer createShadowProfile for public roster onboarding.
  const supabase = getSupabase();
  const result = await safeWrite('profiles.insert', async () => {
    const q = supabase.from(TABLES.profiles).insert({ ...payload, created_at: nowIso(), updated_at: nowIso() }).select('*').single();
    return q as any;
  });
  // STOODIO: create stoodioz row for role data
  if (role === 'STOODIO' && result?.id) {
    const { error: szErr } = await supabase.from('stoodioz').insert({ profile_id: result.id }).select('id').single();
    if (szErr) throw new Error(`stoodioz insert: ${errMsg(szErr)}`);
  }
  return result;
}

export async function createShadowProfile(payload: Record<string, any>): Promise<any> {
  const supabase = getSupabase();
  return safeWrite('profiles.insert(shadow)', async () => {
    const q = supabase.from(TABLES.profiles).insert({ ...payload, is_shadow: true, created_at: nowIso(), updated_at: nowIso() }).select('*').single();
    return q as any;
  });
}

// Cache for getAllPublicUsers to avoid repeated large queries
let cachedPublicUsers: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const EMPTY_CACHE_DURATION_MS = 30 * 1000; // 30 seconds for empty results
const LOCAL_CACHE_KEY = 'public_users_cache_v1';
const LOCAL_CACHE_TS_KEY = 'public_users_cache_ts_v1';
const LOCAL_CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

// Function to clear cache (useful for debugging/force refresh)
export function clearPublicUsersCache() {
  cachedPublicUsers = null;
  cacheTimestamp = 0;
  try {
    localStorage.removeItem(LOCAL_CACHE_KEY);
    localStorage.removeItem(LOCAL_CACHE_TS_KEY);
  } catch {
    // ignore
  }
  console.log('[getAllPublicUsers] Cache cleared');
}

export async function getAllPublicUsers(forceRefresh = false): Promise<{
  artists: any[];
  engineers: any[];
  producers: any[];
  stoodioz: any[];
  labels: any[];
}> {
  const normalizeRole = (role: any): 'ARTIST' | 'ENGINEER' | 'PRODUCER' | 'STOODIO' | 'LABEL' => {
    const raw = String(role || '').toUpperCase().trim();
    if (raw === 'STOODIOZ' || raw === 'STUDIO' || raw === 'STUDIOZ') return 'STOODIO';
    if (raw === 'ENGINEER' || raw === 'PRODUCER' || raw === 'LABEL' || raw === 'ARTIST') return raw as any;
    return 'ARTIST';
  };
  // Clear cache if force refresh requested
  if (forceRefresh) {
    clearPublicUsersCache();
  }

  const tryLoadLocalCache = () => {
    try {
      const raw = localStorage.getItem(LOCAL_CACHE_KEY);
      const ts = localStorage.getItem(LOCAL_CACHE_TS_KEY);
      if (!raw || !ts) return null;
      const age = Date.now() - Number(ts);
      if (Number.isNaN(age) || age > LOCAL_CACHE_DURATION_MS) return null;
      const parsed = JSON.parse(raw);
      const hasData = parsed && (
        parsed.artists?.length > 0 ||
        parsed.engineers?.length > 0 ||
        parsed.producers?.length > 0 ||
        parsed.stoodioz?.length > 0 ||
        parsed.labels?.length > 0
      );
      if (!hasData) return null;
      return parsed;
    } catch {
      return null;
    }
  };
  
  // Return cached data if available and fresh
  const now = Date.now();
  const cacheAge = now - cacheTimestamp;
  const hasData = cachedPublicUsers && (
    cachedPublicUsers.artists?.length > 0 || 
    cachedPublicUsers.engineers?.length > 0 || 
    cachedPublicUsers.producers?.length > 0 || 
    cachedPublicUsers.stoodioz?.length > 0 || 
    cachedPublicUsers.labels?.length > 0
  );
  
  // Use shorter cache duration for empty results
  const cacheDuration = hasData ? CACHE_DURATION_MS : EMPTY_CACHE_DURATION_MS;
  
  if (cachedPublicUsers && cacheAge < cacheDuration) {
    console.log(`[getAllPublicUsers] Returning cached data (age: ${Math.round(cacheAge / 1000)}s, hasData: ${hasData})`);
    return cachedPublicUsers;
  }

  if (!cachedPublicUsers) {
    const local = tryLoadLocalCache();
    if (local) {
      cachedPublicUsers = local;
      cacheTimestamp = Date.now();
      console.log('[getAllPublicUsers] Loaded directory from local cache');
      return cachedPublicUsers;
    }
  }

  const load = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[getAllPublicUsers] Supabase client is null/undefined');
      return {
        artists: [],
        engineers: [],
        producers: [],
        stoodioz: [],
        labels: [],
      };
    }
    const PROFILES_FAST_TIMEOUT_MS = 8000;
    const profilesSelectFull = 'id, username, full_name, display_name, role, email, image_url, avatar_url, bio, location_text';
    const profilesSelectFallback = 'id, username, full_name, role, email, image_url, bio, location_text';
    const runProfilesSelect = async (select: string, label: string, timeoutMs: number) => {
      return await withTimeout(
        supabase.from('profiles').select(select).limit(500),
        timeoutMs,
        label
      ).catch((err) => ({ data: null, error: err }));
    };
    // Reduced limit for faster initial load - only load what's needed for landing page
    // Can load more on-demand when user navigates to lists
    const MAX_ROWS_PER_TABLE = 100; // Reduced from 2000 for faster loads
    
    // Use a longer timeout for directory queries to handle slow Supabase responses
    const QUERY_TIMEOUT_MS = 30_000;
    
    // Narrow selects for faster public directory loads
    const selectArtists = 'id,name,stage_name,image_url,cover_image_url,genres,rating_overall,ranking_tier,profile_id';
    const selectEngineers = 'id,name,image_url,cover_image_url,specialties,rating_overall,ranking_tier,profile_id';
    const selectProducers = 'id,name,image_url,cover_image_url,genres,instrumentals,rating_overall,ranking_tier,profile_id';
    const selectStoodioz = 'id,name,image_url,cover_image_url,genres,amenities,rating_overall,ranking_tier,profile_id';
    const selectLabels = 'id,name,image_url,cover_image_url,rating_overall,ranking_tier,profile_id';

    const fallbackSelectBase = 'id,name,image_url,profile_id';
    const runSelect = async (table: string, select: string, label: string) => {
      const primary = await withTimeout(
        supabase.from(table).select(select).limit(MAX_ROWS_PER_TABLE),
        QUERY_TIMEOUT_MS,
        label
      ).catch(err => ({ data: null, error: err }));

      if (primary?.error && isMissingColumnError(primary.error)) {
        console.warn(`[getAllPublicUsers] ${label} retrying with fallback select`, primary.error);
        return await withTimeout(
          supabase.from(table).select(fallbackSelectBase).limit(MAX_ROWS_PER_TABLE),
          QUERY_TIMEOUT_MS,
          `${label}.fallback`
        ).catch(err => ({ data: null, error: err }));
      }

      return primary;
    };

    // Execute queries directly - Supabase returns {data, error}
    const [a, e, p, s, l] = await Promise.all([
      runSelect('artists_v', selectArtists, 'artists_v'),
      runSelect('engineers_v', selectEngineers, 'engineers_v'),
      runSelect('producers_v', selectProducers, 'producers_v'),
      runSelect('stoodioz_v', selectStoodioz, 'stoodioz_v'),
      runSelect('labels_v', selectLabels, 'labels_v'),
    ]);
    
    // If views are missing (or error), fall back to base tables
    if (a.error || e.error || p.error || s.error || l.error) {
      console.warn('[getAllPublicUsers] view query failed, retrying base tables');
      const [a2, e2, p2, s2, l2] = await Promise.all([
        runSelect('artists', selectArtists, 'artists'),
        runSelect('engineers', selectEngineers, 'engineers'),
        runSelect('producers', selectProducers, 'producers'),
        runSelect('stoodioz', selectStoodioz, 'stoodioz'),
        runSelect('labels', selectLabels, 'labels'),
      ]);
      if (a.error) a.data = a2.data;
      if (e.error) e.data = e2.data;
      if (p.error) p.data = p2.data;
      if (s.error) s.data = s2.data;
      if (l.error) l.data = l2.data;
    }

    // Log detailed results for debugging
    console.log('[getAllPublicUsers] Query results:', {
      artists: { count: a.data?.length || 0, error: a.error?.message || null },
      engineers: { count: e.data?.length || 0, error: e.error?.message || null },
      producers: { count: p.data?.length || 0, error: p.error?.message || null },
      stoodioz: { count: s.data?.length || 0, error: s.error?.message || null },
      labels: { count: l.data?.length || 0, error: l.error?.message || null },
    });
    
    // Only log errors, don't throw - return empty arrays on failure
    if (a.error) console.error('[getAllPublicUsers] artists error:', a.error);
    if (e.error) console.error('[getAllPublicUsers] engineers error:', e.error);
    if (p.error) console.error('[getAllPublicUsers] producers error:', p.error);
    if (s.error) console.error('[getAllPublicUsers] stoodioz error:', s.error);
    if (l.error) console.error('[getAllPublicUsers] labels error:', l.error);
    
    // Ensure we always have arrays, even if data is null/undefined
    const normalizeDirectoryRow = (row: any, role: string) => {
      const profiles = row?.profiles || {};
      const profileId = row?.profile_id || profiles?.id || null;
      return {
        ...row,
        role_id: row?.id ?? null,
        id: profileId || row?.id || null,
        profile_id: profileId || row?.profile_id || null,
        display_name: row.display_name ?? profiles.display_name ?? null,
        full_name: row.full_name ?? profiles.full_name ?? null,
        username: row.username ?? profiles.username ?? null,
        image_url: row.image_url || profiles.image_url || profiles.avatar_url || null,
        email: row.email ?? profiles.email ?? null,
        name: row.name ?? profiles.display_name ?? profiles.full_name ?? profiles.username ?? ((profiles.email === 'aria@stoodioz.ai' || row.email === 'aria@stoodioz.ai') ? 'Aria Cantata' : row.name),
        role,
      };
    };

    let result = {
      artists: Array.isArray(a.data) ? a.data.map((row: any) => normalizeDirectoryRow(row, 'ARTIST')) : [],
      engineers: Array.isArray(e.data) ? e.data.map((row: any) => normalizeDirectoryRow(row, 'ENGINEER')) : [],
      producers: Array.isArray(p.data) ? p.data.map((row: any) => normalizeDirectoryRow(row, 'PRODUCER')) : [],
      stoodioz: Array.isArray(s.data) ? s.data.map((row: any) => normalizeDirectoryRow(row, 'STOODIO')) : [],
      labels: Array.isArray(l.data) ? l.data.map((row: any) => normalizeDirectoryRow(row, 'LABEL')) : [],
    };

    const dedupeById = (rows: any[]) => {
      const seen = new Set<string>();
      return rows.filter((row) => {
        const key = String(row?.id || row?.profile_id || '');
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    result = {
      artists: dedupeById(result.artists),
      engineers: dedupeById(result.engineers),
      producers: dedupeById(result.producers),
      stoodioz: dedupeById(result.stoodioz),
      labels: dedupeById(result.labels),
    };

    const looksLikeId = (value: string): boolean => {
      if (!value || typeof value !== 'string') return false;
      const trimmed = value.trim().toLowerCase();
      return /^(artis|engin|produc|stood|label|user)_[a-f0-9]{4,}/i.test(trimmed) ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    };

    const allRows = [
      ...result.artists,
      ...result.engineers,
      ...result.producers,
      ...result.stoodioz,
      ...result.labels,
    ];

    const shouldBackfillFromProfiles =
      result.artists.length === 0 ||
      result.engineers.length === 0 ||
      result.producers.length === 0 ||
      result.stoodioz.length === 0 ||
      result.labels.length === 0;

    if (shouldBackfillFromProfiles) {
      try {
        let profilesRes: any = await runProfilesSelect(profilesSelectFull, 'profiles.directory.backfill', QUERY_TIMEOUT_MS);
        if (profilesRes?.error && isMissingColumnError(profilesRes.error)) {
          profilesRes = await runProfilesSelect(profilesSelectFallback, 'profiles.directory.backfill.fallback', QUERY_TIMEOUT_MS);
        }
        const rows = Array.isArray((profilesRes as any)?.data) ? (profilesRes as any).data : [];
        if (rows.length > 0) {
          const existingIds = new Set(
            allRows
              .map((row: any) => row?.profile_id || row?.id)
              .filter((id: any) => typeof id === 'string' && id.length > 0)
          );
          const mapProfile = (row: any) => ({
            id: row.id,
            profile_id: row.id,
            name:
              row.display_name ||
              row.full_name ||
              row.username ||
              (row.email === 'aria@stoodioz.ai' ? 'Aria Cantata' : 'User'),
            display_name: row.display_name || null,
            full_name: row.full_name || null,
            username: row.username || null,
            email: row.email || null,
            image_url: row.image_url || row.avatar_url || null,
            cover_image_url: null,
            bio: row.bio,
            location_text: row.location_text,
            genres: [],
            rating_overall: 0,
            ranking_tier: 'PROVISIONAL',
            role: normalizeRole(row.role),
            profiles: row,
          });

          const additions = rows
            .map(mapProfile)
            .filter((row: any) => row?.id && !existingIds.has(row.id));

          if (additions.length > 0) {
            const byRole = {
              artists: additions.filter((u: any) => u.role === 'ARTIST'),
              engineers: additions.filter((u: any) => u.role === 'ENGINEER'),
              producers: additions.filter((u: any) => u.role === 'PRODUCER'),
              stoodioz: additions.filter((u: any) => u.role === 'STOODIO'),
              labels: additions.filter((u: any) => u.role === 'LABEL'),
            };

            result = {
              artists: result.artists.concat(byRole.artists),
              engineers: result.engineers.concat(byRole.engineers),
              producers: result.producers.concat(byRole.producers),
              stoodioz: result.stoodioz.concat(byRole.stoodioz),
              labels: result.labels.concat(byRole.labels),
            };
            console.warn('[getAllPublicUsers] Backfilled missing roles from profiles');
          }
        }
      } catch (backfillErr) {
        console.warn('[getAllPublicUsers] profiles backfill failed:', backfillErr);
      }
    }

    const profileIds = Array.from(
      new Set(
        allRows
          .map((row: any) => row?.profile_id)
          .filter((id: any) => typeof id === 'string' && id.length > 0)
      )
    );

    if (profileIds.length > 0) {
      try {
      const enrichSelectFull = 'id, username, full_name, display_name, image_url, avatar_url, email';
      const enrichSelectFallback = 'id, username, full_name, image_url, email';
      let profilesRes: any = await withTimeout(
        supabase
          .from('profiles')
          .select(enrichSelectFull)
          .in('id', profileIds),
        QUERY_TIMEOUT_MS,
        'profiles.directory.enrich'
      ).catch((err) => ({ data: null, error: err }));
      if (profilesRes?.error && isMissingColumnError(profilesRes.error)) {
        profilesRes = await withTimeout(
          supabase
            .from('profiles')
            .select(enrichSelectFallback)
            .in('id', profileIds),
          QUERY_TIMEOUT_MS,
          'profiles.directory.enrich.fallback'
        ).catch((err) => ({ data: null, error: err }));
      }
        const profileMap = new Map(
          ((profilesRes as any)?.data || []).map((p: any) => [p.id, p])
        );

        const enrichRow = (row: any) => {
          const profile = profileMap.get(row?.profile_id);
          if (!profile) return row;
          const name = row?.name;
          const safeName = profile?.display_name
            ? profile.display_name
            : (!name || looksLikeId(String(name))
              ? (profile.full_name || profile.username || (profile.email === 'aria@stoodioz.ai' ? 'Aria Cantata' : name))
              : name);
          return {
            ...row,
            profiles: row?.profiles ?? profile,
            display_name: row.display_name ?? profile.display_name ?? null,
            full_name: row.full_name ?? profile.full_name ?? null,
            username: row.username ?? profile.username ?? null,
            image_url: row.image_url || profile.image_url || profile.avatar_url || null,
            email: row.email ?? profile.email ?? null,
            name: safeName,
          };
        };

        result = {
          artists: result.artists.map(enrichRow),
          engineers: result.engineers.map(enrichRow),
          producers: result.producers.map(enrichRow),
          stoodioz: result.stoodioz.map(enrichRow),
          labels: result.labels.map(enrichRow),
        };
      } catch (enrichErr) {
        console.warn('[getAllPublicUsers] profiles enrich failed:', enrichErr);
      }
    }

    // If everything came back empty, fallback to profiles for a single-table directory
    const isEmpty = result.artists.length === 0 && result.engineers.length === 0 && result.producers.length === 0 && result.stoodioz.length === 0 && result.labels.length === 0;
    if (isEmpty) {
      try {
        let profilesRes: any = await runProfilesSelect(profilesSelectFull, 'profiles.directory', QUERY_TIMEOUT_MS);
        if (profilesRes?.error && isMissingColumnError(profilesRes.error)) {
          profilesRes = await runProfilesSelect(profilesSelectFallback, 'profiles.directory.fallback', QUERY_TIMEOUT_MS);
        }
        const rows = Array.isArray((profilesRes as any)?.data) ? (profilesRes as any).data : [];
        if (rows.length > 0) {
          const normalized = rows.map((row: any) => ({
            id: row.id,
            profile_id: row.id,
            name: row.display_name || row.full_name || row.username || 'User',
            display_name: row.display_name || null,
            full_name: row.full_name || null,
            username: row.username || null,
            email: row.email || null,
            image_url: row.image_url || row.avatar_url,
            cover_image_url: null,
            bio: row.bio,
            location_text: row.location_text,
            genres: [],
            rating_overall: 0,
            ranking_tier: 'PROVISIONAL',
            role: normalizeRole(row.role),
            profiles: row
          }));
          result = {
            artists: normalized.filter((u: any) => u.role === 'ARTIST'),
            engineers: normalized.filter((u: any) => u.role === 'ENGINEER'),
            producers: normalized.filter((u: any) => u.role === 'PRODUCER'),
            stoodioz: normalized.filter((u: any) => u.role === 'STOODIO'),
            labels: normalized.filter((u: any) => u.role === 'LABEL'),
          };
          console.warn('[getAllPublicUsers] Fallback to profiles directory');
        }
      } catch (fallbackErr) {
        console.error('[getAllPublicUsers] profiles fallback error:', fallbackErr);
      }
    }

    // Log results for debugging
    console.log(`[getAllPublicUsers] Final counts: ${result.artists.length} artists, ${result.engineers.length} engineers, ${result.producers.length} producers, ${result.stoodioz.length} stoodioz, ${result.labels.length} labels`);
    // Only cache if we have actual data - don't cache empty results
    const hasAnyData = result.artists.length > 0 || result.engineers.length > 0 || 
                       result.producers.length > 0 || result.stoodioz.length > 0 || result.labels.length > 0;
    
    if (hasAnyData) {
      cachedPublicUsers = result;
      cacheTimestamp = Date.now();
      try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(result));
        localStorage.setItem(LOCAL_CACHE_TS_KEY, String(cacheTimestamp));
      } catch {
        // ignore storage failures
      }
      console.log('[getAllPublicUsers] Cached result with data');
    } else {
      // Don't cache empty results - force fresh fetch next time
      console.warn('[getAllPublicUsers] No data found - not caching empty result');
      cachedPublicUsers = null;
      cacheTimestamp = 0;
    }
    
    return result;
  };
  
  try {
    const result = await withTimeout(load(), PUBLIC_DATA_TIMEOUT_MS, 'getAllPublicUsers');
    return result;
  } catch (err) {
    // If the entire operation times out, return cached data if available, otherwise empty arrays
    console.error('[getAllPublicUsers] Overall timeout:', err);
    if (cachedPublicUsers) {
      console.log('[getAllPublicUsers] Returning stale cache due to timeout');
      return cachedPublicUsers;
    }
    const local = tryLoadLocalCache();
    if (local) {
      console.log('[getAllPublicUsers] Returning local cache due to timeout');
      return local;
    }
    return {
      artists: [],
      engineers: [],
      producers: [],
      stoodioz: [],
      labels: [],
    };
  }
}


/* ============================================================
   ARTISTS / ENGINEERS / PRODUCERS / STOODIO (FULL FETCH)
============================================================ */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(s: string): boolean {
  return UUID_REGEX.test(String(s || '').trim());
}

async function fetchFullRoleRow(table: string, idOrUsername: string): Promise<any> {
  const supabase = getSupabase();
  // Build select based on table - role comes from profiles table, not from role tables
  let selectBase: string;
  
  if (table === 'engineers') {
    selectBase = 'id, name, image_url, cover_image_url, bio, email, wallet_balance, rating_overall, sessions_completed, ranking_tier, specialties, profile_id, created_at, updated_at, links, isAdmin, subscription, is_on_streak, on_time_rate, completion_rate, repeat_hire_rate, strength_tags, local_rank_text, purchased_masterclass_ids';
  } else if (table === 'artists') {
    selectBase = 'id, name, stage_name, image_url, cover_image_url, bio, email, wallet_balance, rating_overall, sessions_completed, ranking_tier, genres, profile_id, created_at, updated_at, links, isAdmin, subscription, is_on_streak, on_time_rate, completion_rate, repeat_hire_rate, strength_tags, local_rank_text, purchased_masterclass_ids';
  } else if (table === 'producers') {
    selectBase = 'id, name, image_url, cover_image_url, bio, email, wallet_balance, rating_overall, sessions_completed, ranking_tier, genres, instrumentals, profile_id, created_at, updated_at, links, isAdmin, subscription, is_on_streak, on_time_rate, completion_rate, repeat_hire_rate, strength_tags, local_rank_text, purchased_masterclass_ids';
  } else if (table === 'stoodioz') {
    selectBase = 'id, name, image_url, cover_image_url, bio, email, wallet_balance, rating_overall, sessions_completed, ranking_tier, genres, amenities, profile_id, created_at, updated_at, links, isAdmin, subscription, is_on_streak, on_time_rate, completion_rate, repeat_hire_rate, strength_tags, local_rank_text, purchased_masterclass_ids';
  } else {
    // Default for labels or other tables
    selectBase = 'id, name, image_url, cover_image_url, bio, email, wallet_balance, rating_overall, sessions_completed, ranking_tier, profile_id, created_at, updated_at, links, isAdmin, subscription, is_on_streak, on_time_rate, completion_rate, repeat_hire_rate, strength_tags, local_rank_text, purchased_masterclass_ids';
  }

  const fallbackSelectBase = 'id, name, image_url, cover_image_url, profile_id';
  const minimalSelectBase = 'id, profile_id';

  const shouldTryFallback = (error: any): boolean => {
    if (!error) return false;
    const status = Number(error?.status || error?.statusCode || 0);
    if (status === 400) return true;
    return isMissingColumnError(error);
  };

  const runRoleSelect = async (column: string, value: string, label: string) => {
    const primary = await withTimeout(
      supabase.from(table).select(selectBase).eq(column, value).maybeSingle(),
      DB_TIMEOUT_MS,
      label
    );
    if (primary?.data) return primary;
    if (primary?.error && shouldTryFallback(primary.error)) {
      try {
        const fallback = await withTimeout(
          supabase.from(table).select(fallbackSelectBase).eq(column, value).maybeSingle(),
          DB_TIMEOUT_MS,
          `${label}.fallback`
        );
        if (fallback?.data) return fallback;
        if (fallback?.error && shouldTryFallback(fallback.error)) {
          const minimal = await withTimeout(
            supabase.from(table).select(minimalSelectBase).eq(column, value).maybeSingle(),
            DB_TIMEOUT_MS,
            `${label}.minimal`
          );
          return minimal;
        }
        return fallback;
      } catch {
        return primary;
      }
    }
    return primary;
  };

  // Helper to compute followers/following from follows table
  const computeFollowData = async (profileId: string): Promise<{ followers: number; follower_ids: string[]; following: any }> => {
    if (!profileId) return { followers: 0, follower_ids: [], following: { artists: [], engineers: [], producers: [], stoodioz: [], labels: [] } };
    
    try {
      // Get followers (people who follow this user)
      const followersRes = await withTimeout(
        supabase.from(TABLES.follows).select('follower_id').eq('following_id', profileId),
        DB_TIMEOUT_MS,
        'follows.followers'
      );
      const followerIds = (followersRes?.data || []).map((r: any) => r.follower_id);
      
      // Get following (people this user follows) - need to determine their roles
      const followingRes = await withTimeout(
        supabase.from(TABLES.follows).select('following_id').eq('follower_id', profileId),
        DB_TIMEOUT_MS,
        'follows.following'
      );
      const followingIds = (followingRes?.data || []).map((r: any) => r.following_id);
      
      // Get roles for followed users to group by type
      const followingByType: any = { artists: [], engineers: [], producers: [], stoodioz: [], labels: [] };
      if (followingIds.length > 0) {
        const [artistsRes, engineersRes, producersRes, stoodiozRes, labelsRes] = await Promise.all([
          supabase.from('artists').select('profile_id').in('profile_id', followingIds),
          supabase.from('engineers').select('profile_id').in('profile_id', followingIds),
          supabase.from('producers').select('profile_id').in('profile_id', followingIds),
          supabase.from('stoodioz').select('profile_id').in('profile_id', followingIds),
          supabase.from('labels').select('profile_id').in('profile_id', followingIds),
        ]);
        followingByType.artists = (artistsRes?.data || []).map((r: any) => r.profile_id);
        followingByType.engineers = (engineersRes?.data || []).map((r: any) => r.profile_id);
        followingByType.producers = (producersRes?.data || []).map((r: any) => r.profile_id);
        followingByType.stoodioz = (stoodiozRes?.data || []).map((r: any) => r.profile_id);
        followingByType.labels = (labelsRes?.data || []).map((r: any) => r.profile_id);
      }
      
      return {
        followers: followerIds.length,
        follower_ids: followerIds,
        following: followingByType
      };
    } catch (err) {
      console.error('[fetchFullRoleRow] Error computing follow data:', err);
      return { followers: 0, follower_ids: [], following: { artists: [], engineers: [], producers: [], stoodioz: [], labels: [] } };
    }
  };

  // UUID: run byId and byProfileId in parallel to avoid 12s+12s sequential when first misses.
  if (isUuid(idOrUsername)) {
    let [r2, r3] = await Promise.all([
      runRoleSelect('id', idOrUsername, `${table}.byId`),
      runRoleSelect('profile_id', idOrUsername, `${table}.byProfileId`),
    ]);
    let result = r2?.data || r3?.data;
    if (!result) {
      if (r2?.error) throw new Error(errMsg(r2.error));
      return null;
    }
    // Extract role from profiles relation and add to result
    if (result.profiles) {
      result.role = result.profiles.role;
    }
    // Compute follow data
    const profileId = result.profile_id || result.id;
    const followData = await computeFollowData(profileId);
    return { ...result, ...followData };
  }

  // 1) Try by username (slug-style handles)
  let r1 = await runRoleSelect('username', idOrUsername, `${table}.byUsername`);
  if (r1?.data) {
    const profileId = r1.data.profile_id || r1.data.id;
    let profileData: any = null;
    if (profileId) {
      const profRes = await withTimeout(
    supabase.from('profiles').select('id, username, full_name, display_name, email, role, image_url, avatar_url, bio, location_text').eq('id', profileId).maybeSingle(),
        DB_TIMEOUT_MS,
        `${table}.profiles.byId`
      ).catch(() => ({ data: null }));
      profileData = (profRes as any)?.data || null;
      if (profileData?.role) r1.data.role = profileData.role;
    }
    const followData = await computeFollowData(profileId);
    return { ...r1.data, ...(profileData || {}), profiles: profileData || null, ...followData };
  }

  // 2) and 3) byId and byProfileId in parallel
  let [r2, r3] = await Promise.all([
    runRoleSelect('id', idOrUsername, `${table}.byId`),
    runRoleSelect('profile_id', idOrUsername, `${table}.byProfileId`),
  ]);
  let result = r2?.data || r3?.data;
  if (!result) {
    if (r2?.error) throw new Error(errMsg(r2.error));
    return null;
  }
  // Attach profile data without relying on embedded relationships (avoids FK ambiguity)
  const profileId = result.profile_id || result.id;
  let profileData: any = null;
  if (profileId) {
    const profRes = await withTimeout(
    supabase.from('profiles').select('id, username, full_name, display_name, email, role, image_url, avatar_url, bio, location_text').eq('id', profileId).maybeSingle(),
      DB_TIMEOUT_MS,
      `${table}.profiles.byId`
    ).catch(() => ({ data: null }));
    profileData = (profRes as any)?.data || null;
    if (profileData?.role) result.role = profileData.role;
  }
  // Compute follow data
  const followData = await computeFollowData(profileId);
  return { ...result, ...(profileData || {}), profiles: profileData || null, ...followData };
}

export async function fetchFullArtist(idOrUsername: string): Promise<any> {
  requireVal(idOrUsername, 'artist identifier');
  const data = await fetchFullRoleRow('artists', idOrUsername);
  if (!data) return null;
  const profile = data?.profiles || {};
  const out = { ...data, ...profile, role: profile.role || 'ARTIST' };
  out.role_id = data?.id ?? null;
  out.profile_id = profile?.id ?? data?.profile_id ?? null;
  out.id = out.profile_id ?? out.id;
  return out;
}

export async function fetchProfileByEmail(email: string): Promise<any | null> {
  if (!email) return null;
  const supabase = getSupabase();
  const res = await withTimeout(
    supabase.from('profiles').select('id, email, full_name, display_name, username, image_url, avatar_url').eq('email', email).maybeSingle(),
    DB_TIMEOUT_MS,
    'profiles.byEmail'
  );
  return (res as any)?.data || null;
}

export async function fetchFullEngineer(idOrUsername: string): Promise<any> {
  requireVal(idOrUsername, 'engineer identifier');
  const data = await fetchFullRoleRow('engineers', idOrUsername);
  if (!data) return null;
  const profile = data?.profiles || {};
  const out = { ...data, ...profile, role: profile.role || 'ENGINEER' };
  out.role_id = data?.id ?? null;
  out.profile_id = profile?.id ?? data?.profile_id ?? null;
  out.id = out.profile_id ?? out.id;
  return out;
}

export async function fetchInstrumentalsForProducer(producerId: string): Promise<any[]> {
  if (!producerId) return [];
  const supabase = getSupabase();
  return safeSelect('instrumentals.byProducer', async () => {
    const q = supabase.from(TABLES.instrumentals).select('*').eq('producer_id', producerId).order('created_at', { ascending: false });
    return q as any;
  }, []);
}

export async function fetchProducerProducts(producerId: string): Promise<any[]> {
  if (!producerId) return [];
  const supabase = getSupabase();
  return safeSelect('producer_products.byProducer', async () => {
    const q = supabase.from(TABLES.producerProducts).select('*').eq('producer_id', producerId).order('created_at', { ascending: false });
    return q as any;
  }, []);
}

export async function fetchFullProducer(idOrUsername: string): Promise<any> {
  requireVal(idOrUsername, 'producer identifier');
  const data = await fetchFullRoleRow('producers', idOrUsername);
  const profile = data?.profiles || {};
  const merged = { ...data, ...profile, role: profile.role || 'PRODUCER' };
  merged.role_id = data?.id ?? null;
  merged.profile_id = profile?.id ?? data?.profile_id ?? null;
  merged.id = merged.profile_id ?? merged.id;
  const profileId = merged.id;
  if (profileId) {
    const inst = await fetchInstrumentalsForProducer(profileId);
    merged.instrumentals = Array.isArray(inst) ? inst : [];
    // Products fetch: best-effort, don't block profile load if it fails
    try {
      const prods = await fetchProducerProducts(profileId);
      merged.products = Array.isArray(prods) ? prods : [];
    } catch (e) {
      console.warn('[fetchFullProducer] products fetch failed, continuing without products:', e);
      merged.products = [];
    }
  } else {
    merged.instrumentals = [];
    merged.products = [];
  }
  return merged;
}

export async function fetchFullStoodio(idOrUsername: string): Promise<any> {
  requireVal(idOrUsername, 'stoodio identifier');
  const data = await fetchFullRoleRow('stoodioz', idOrUsername);
  if (!data) return null;
  const profile = data?.profiles || {};
  const out = { ...data, ...profile, role: profile.role || 'STOODIO' };
  out.role_id = data?.id ?? null;
  out.profile_id = profile?.id ?? data?.profile_id ?? null;
  out.id = out.profile_id ?? out.id;
  // Load rooms so public profile (StoodioDetail) and booking flow can show and use them
  if (out.id) {
    try {
      const supabase = getSupabase();
      const roomsPromise = supabase.from('rooms').select('*').eq('stoodio_id', out.id).order('name');
      const res = await withTimeout(roomsPromise as Promise<{ data?: any[]; error?: any }>, DB_TIMEOUT_MS, 'stoodioz.rooms');
      out.rooms = Array.isArray(res?.data) ? res.data : [];
    } catch (e) {
      console.warn('[fetchFullStoodio] rooms fetch failed or timed out:', e);
      out.rooms = [];
    }
  } else {
    out.rooms = [];
  }
  return out;
}

/* ============================================================
   SOCIAL FEED / POSTS
============================================================ */

const VALID_ROLES = ['ARTIST', 'ENGINEER', 'PRODUCER', 'STOODIO', 'LABEL'] as const;
function toAuthorType(v: unknown): UserRole {
  const s = String(v || 'ARTIST').toUpperCase();
  return (VALID_ROLES.includes(s as any) ? s : 'ARTIST') as UserRole;
}

function normalizePostRow(r: Record<string, any>): {
  id: string;
  authorId: string;
  authorType: UserRole;
  text: string;
  timestamp: string;
  image_url?: string;
  video_url?: string;
  video_thumbnail_url?: string;
  link?: any;
  likes: string[];
  comments: any[];
  display_mode?: 'fit' | 'fill';
  focus_point?: { x: number; y: number };
} {
  return {
    id: String(r?.id ?? ''),
    authorId: String(r?.author_id ?? r?.profile_id ?? ''),
    authorType: toAuthorType(r?.author_type),
    text: String(r?.text ?? r?.content ?? ''),
    timestamp: String(r?.timestamp ?? r?.created_at ?? ''),
    image_url: r?.image_url ?? r?.attachment_url ?? undefined,
    video_url: r?.video_url,
    video_thumbnail_url: r?.video_thumbnail_url,
    link: r?.link,
    likes: Array.isArray(r?.likes) ? r.likes : [],
    comments: Array.isArray(r?.comments) ? r.comments : [],
    display_mode: r?.display_mode,
    focus_point: r?.focus_point,
  };
}

export async function fetchGlobalFeed(limit = 50, before?: string): Promise<any[]> {
  const supabase = getSupabase();
  const raw = await safeSelect('posts.globalFeed', async () => {
    let q = supabase
      .from(TABLES.posts)
      .select('*')
      .order('created_at', { ascending: false });
    if (before) q = (q as any).lt('created_at', before);
    const { data, error } = await (q as any).limit(limit);
    return { data, error };
  }, []);
  const rows = Array.isArray(raw) ? raw : [];
  return rows.map(normalizePostRow).filter((p) => p.authorId);
}

export async function fetchUserPosts(profileId: string): Promise<any[]> {
  if (!profileId) return [];
  const supabase = getSupabase();
  const raw = await safeSelect('posts.byProfile', async () => {
    const query = supabase.from(TABLES.posts).select('*').order('created_at', { ascending: false });
    const { data, error } = await (query as any).eq('author_id', profileId);
    return { data, error };
  }, []);
  const rows = Array.isArray(raw) ? raw : [];
  return rows.map(normalizePostRow).filter((p) => p.authorId);
}

export async function createPost(profileId: string, content: string, attachment?: File): Promise<any> {
  requireVal(profileId, 'profileId');
  const supabase = getSupabase();

  let attachment_url: string | null = null;
  if (attachment) {
    const up = await uploadPostAttachment(profileId, attachment);
    attachment_url = up.url;
  }

  return safeWrite('posts.insert', async () => {
    const q = supabase.from(TABLES.posts).insert({
      author_id: profileId,
      content,
      attachment_url,
      created_at: nowIso(),
    }).select('*').single();
    return q as any;
  });
}

export async function updatePostText(postId: string, text: string): Promise<any> {
  requireVal(postId, 'postId');
  const nextText = text ?? '';
  const supabase = getSupabase();

  const attemptUpdate = async (payload: Record<string, any>, label: string) => {
    const q = supabase.from(TABLES.posts).update(payload).eq('id', postId).select('*').single();
    return safeWrite(label, async () => q as any);
  };

  try {
    return await attemptUpdate({ text: nextText, content: nextText, updated_at: nowIso() }, 'posts.update');
  } catch (e: any) {
    if (isMissingColumnError(e)) {
      try {
        return await attemptUpdate({ content: nextText, updated_at: nowIso() }, 'posts.update.contentOnly');
      } catch (e2: any) {
        if (isMissingColumnError(e2)) {
          return await attemptUpdate({ text: nextText, updated_at: nowIso() }, 'posts.update.textOnly');
        }
        throw e2;
      }
    }
    throw e;
  }
}

export async function deletePost(postId: string): Promise<void> {
  requireVal(postId, 'postId');
  const supabase = getSupabase();
  await safeWrite('posts.delete', async () => {
    const q = supabase.from(TABLES.posts).delete().eq('id', postId);
    return q as any;
  });
}

export async function likePost(postId: string, profileId: string): Promise<void> {
  requireVal(postId, 'postId');
  requireVal(profileId, 'profileId');
  const supabase = getSupabase();
  await safeWrite('post_likes.insert', async () => {
    const q = supabase.from(TABLES.postLikes).insert({ post_id: postId, profile_id: profileId, created_at: nowIso() });
    return q as any;
  });
}

export async function commentOnPost(postId: string, profileId: string, text: string): Promise<any> {
  requireVal(postId, 'postId');
  requireVal(profileId, 'profileId');
  requireVal(text, 'text');
  const supabase = getSupabase();
  return safeWrite('post_comments.insert', async () => {
    const q = supabase.from(TABLES.postComments).insert({ post_id: postId, profile_id: profileId, text, created_at: nowIso() }).select('*').single();
    return q as any;
  });
}

export async function toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }> {
  requireVal(followerId, 'followerId');
  requireVal(followingId, 'followingId');
  const supabase = getSupabase();

  // Check existing
  const existing = await safeSelect('follows.check', async () => {
    const q = supabase.from(TABLES.follows).select('id').eq('follower_id', followerId).eq('following_id', followingId).limit(1);
    return q as any;
  }, []);

  if (Array.isArray(existing) && existing.length > 0) {
    await safeWrite('follows.delete', async () => {
      const q = supabase.from(TABLES.follows).delete().eq('follower_id', followerId).eq('following_id', followingId);
      return q as any;
    });
    return { following: false };
  }

  await safeWrite('follows.insert', async () => {
    const q = supabase.from(TABLES.follows).insert({ follower_id: followerId, following_id: followingId, created_at: nowIso() });
    return q as any;
  });
  return { following: true };
}

/* ============================================================
   UPLOADS
============================================================ */

export async function uploadAvatar(profileId: string, file: File): Promise<string> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  const { url } = await uploadToBucket(BUCKETS.avatars, randPath(`avatars/${profileId}`, file.name), file);
  await updateUser(profileId, { image_url: url, avatar_url: url });
  return url;
}

export async function uploadCoverImage(profileId: string, file: File): Promise<string> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  const { url } = await uploadToBucket(BUCKETS.covers, randPath(`covers/${profileId}`, file.name), file);
  await updateUser(profileId, { cover_image_url: url });
  return url;
}

export async function uploadRoomPhoto(roomId: string, file: File): Promise<string> {
  requireVal(roomId, 'roomId');
  requireVal(file, 'file');
  const { url, path } = await uploadToBucket(BUCKETS.roomPhotos, randPath(`rooms/${roomId}`, file.name), file);

  // best-effort DB record
  const supabase = getSupabase();
  await safeSelect('room_photos.insert', async () => {
    const q = supabase.from(TABLES.roomPhotos).insert({ room_id: roomId, photo_url: url, storage_path: path, created_at: nowIso() });
    return q as any;
  }, null as any);

  return url;
}

/** Upload a photo to the stoodio gallery (photos array). Use for StoodioDashboard Photos tab, not room_photos. */
export async function uploadGalleryPhoto(profileId: string, file: File): Promise<string> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  const { url } = await uploadToBucket(BUCKETS.covers, randPath(`gallery/${profileId}`, file.name), file);
  return url;
}

export async function uploadAsset(profileId: string, file: File, meta: Record<string, any> = {}): Promise<any> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  const { url, path } = await uploadToBucket(BUCKETS.assets, randPath(`assets/${profileId}`, file.name), file);

  const supabase = getSupabase();
  return safeWrite('assets.insert', async () => {
    const q = supabase.from(TABLES.assets).insert({ profile_id: profileId, url, storage_path: path, ...meta, created_at: nowIso() }).select('*').single();
    return q as any;
  });
}

export async function fetchUserAssets(profileId: string): Promise<any[]> {
  if (!profileId) return [];
  const supabase = getSupabase();
  return safeSelect('assets.byProfile', async () => {
    const q = supabase.from(TABLES.assets).select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
    return q as any;
  }, []);
}

export async function uploadDocument(profileId: string, file: File, meta: Record<string, any> = {}): Promise<any> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  const { url, path } = await uploadToBucket(BUCKETS.documents, randPath(`documents/${profileId}`, file.name), file);

  const supabase = getSupabase();
  return safeWrite('documents.insert', async () => {
    const q = supabase.from(TABLES.documents).insert({ profile_id: profileId, url, storage_path: path, ...meta, created_at: nowIso() }).select('*').single();
    return q as any;
  });
}

export async function fetchUserDocuments(profileId: string): Promise<any[]> {
  if (!profileId) return [];
  const supabase = getSupabase();
  return safeSelect('documents.byProfile', async () => {
    const q = supabase.from(TABLES.documents).select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
    return q as any;
  }, []);
}

export async function uploadBeatFile(profileId: string, file: File, meta: Record<string, any> = {}): Promise<any> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  const { url, path } = await uploadToBucket(BUCKETS.beats, randPath(`beats/${profileId}`, file.name), file);

  const supabase = getSupabase();
  // best-effort store as asset
  return safeWrite('beats.insert(asset)', async () => {
    const q = supabase.from(TABLES.assets).insert({ profile_id: profileId, type: 'beat', url, storage_path: path, ...meta, created_at: nowIso() }).select('*').single();
    return q as any;
  });
}

/** Upload WAV file to beats bucket. Returns { url, path } for use as instrumental.wav_url. */
export async function uploadBeatWav(profileId: string, file: File): Promise<{ url: string; path: string }> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  return uploadToBucket(BUCKETS.beats, randPath(`wav/${profileId}`, file.name), file);
}

/** Upload stems (e.g. zip) to assets bucket. Returns { url, path } for use as instrumental.stems_url. */
export async function uploadStemsFile(profileId: string, file: File): Promise<{ url: string; path: string }> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  return uploadToBucket(BUCKETS.assets, randPath(`stems/${profileId}`, file.name), file);
}

export async function uploadMixingSampleFile(profileId: string, file: File, meta: Record<string, any> = {}): Promise<any> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  const { url, path } = await uploadToBucket(BUCKETS.mixingSamples, randPath(`mixing-samples/${profileId}`, file.name), file);

  const supabase = getSupabase();
  return safeWrite('mixing_samples.insert', async () => {
    const q = supabase.from(TABLES.mixingSamples).insert({ profile_id: profileId, url, storage_path: path, ...meta, created_at: nowIso() }).select('*').single();
    return q as any;
  });
}

export async function uploadPostAttachment(profileId: string, file: File): Promise<{ url: string; path: string }> {
  requireVal(profileId, 'profileId');
  requireVal(file, 'file');
  return uploadToBucket(BUCKETS.postAttachments, randPath(`posts/${profileId}`, file.name), file);
}

/* ============================================================
   ROOMS / ENGINEERS / INSTRUMENTALS / MIXING SAMPLES (CRUD)
============================================================ */

/** Resolve stoodioz.id by profile_id (for rooms.stoodio_id FK). Returns null if no row. */
export async function getStoodiozIdByProfileId(profileId: string): Promise<string | null> {
  if (!profileId) return null;
  const supabase = getSupabase();
  const { data } = await supabase.from('stoodioz').select('id').eq('profile_id', profileId).maybeSingle();
  return data?.id ?? null;
}

/** Get or create stoodioz row for profile_id (for rooms.stoodio_id). Returns stoodioz.id or null on failure. */
export async function ensureStoodiozForProfile(profileId: string): Promise<string | null> {
  if (!profileId) return null;
  const supabase = getSupabase();
  const { data } = await supabase.from('stoodioz').select('id').eq('profile_id', profileId).maybeSingle();
  if (data?.id) return data.id;
  const { data: ins, error } = await supabase.from('stoodioz').insert({ profile_id: profileId }).select('id').single();
  if (error) {
    console.warn('[ensureStoodiozForProfile] insert failed', error);
    return null;
  }
  return ins?.id ?? null;
}

export async function upsertRoom(room: Record<string, any>, stoodioId?: string): Promise<any> {
  requireVal(room, 'room');
  const supabase = getSupabase();
  const payload = {
    ...room,
    ...(stoodioId ? { stoodio_id: stoodioId } : {}),
    updated_at: nowIso(),
  };
  return safeWrite('rooms.upsert', async () => {
    const q = supabase.from(TABLES.rooms).upsert(payload, { onConflict: 'id' }).select('*').single();
    return q as any;
  });
}

export async function deleteRoom(roomId: string): Promise<void> {
  requireVal(roomId, 'roomId');
  const supabase = getSupabase();
  await safeWrite('rooms.delete', async () => {
    const q = supabase.from(TABLES.rooms).delete().eq('id', roomId);
    return q as any;
  });
}

export async function upsertInHouseEngineer(engineer: Record<string, any>, stoodioId: string): Promise<any> {
  requireVal(engineer, 'engineer');
  requireVal(stoodioId, 'stoodioId');
  const supabase = getSupabase();

  const { data: stoodio, error } = await supabase
    .from('stoodioz')
    .select('in_house_engineers')
    .eq('id', stoodioId)
    .maybeSingle();
  if (error) throw error;

  const existing = Array.isArray(stoodio?.in_house_engineers) ? stoodio?.in_house_engineers : [];
  const next = existing.filter((e: any) => e.engineer_id !== engineer.engineer_id);
  next.push({ engineer_id: engineer.engineer_id, pay_rate: engineer.pay_rate });

  return safeWrite('stoodioz.in_house_engineers.upsert', async () => {
    const q = supabase
      .from('stoodioz')
      .update({ in_house_engineers: next, updated_at: nowIso() })
      .eq('id', stoodioId)
      .select('*')
      .single();
    return q as any;
  });
}

export async function deleteInHouseEngineer(engineerId: string, stoodioId: string): Promise<void> {
  requireVal(engineerId, 'engineerId');
  requireVal(stoodioId, 'stoodioId');
  const supabase = getSupabase();

  const { data: stoodio, error } = await supabase
    .from('stoodioz')
    .select('in_house_engineers')
    .eq('id', stoodioId)
    .maybeSingle();
  if (error) throw error;

  const existing = Array.isArray(stoodio?.in_house_engineers) ? stoodio?.in_house_engineers : [];
  const next = existing.filter((e: any) => e.engineer_id !== engineerId);

  await safeWrite('stoodioz.in_house_engineers.delete', async () => {
    const q = supabase
      .from('stoodioz')
      .update({ in_house_engineers: next, updated_at: nowIso() })
      .eq('id', stoodioId);
    return q as any;
  });
}

export async function upsertInstrumental(inst: Record<string, any>): Promise<any> {
  requireVal(inst, 'instrumental');
  const supabase = getSupabase();
  return safeWrite('instrumentals.upsert', async () => {
    // Remove updated_at from payload - let database handle it with DEFAULT
    const { updated_at, ...payload } = inst;
    const q = supabase.from(TABLES.instrumentals).upsert(payload, { onConflict: 'id' }).select('*').single();
    return q as any;
  });
}

export async function deleteInstrumental(id: string): Promise<void> {
  requireVal(id, 'instrumentalId');
  const supabase = getSupabase();
  await safeWrite('instrumentals.delete', async () => {
    const q = supabase.from(TABLES.instrumentals).delete().eq('id', id);
    return q as any;
  });
}

export async function upsertProducerProduct(product: Record<string, any>): Promise<any> {
  requireVal(product, 'product');
  const supabase = getSupabase();
  const id = product.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gen-${Date.now()}`);
  const payload = {
    id,
    producer_id: product.producer_id,
    type: product.type || 'other',
    title: product.title,
    description: product.description ?? null,
    price: Number(product.price ?? 0),
    delivery_type: product.delivery_type,
    delivery_value: product.delivery_value,
    preview_url: product.preview_url ?? null,
    cover_url: product.cover_url ?? null,
    updated_at: nowIso(),
  };
  return safeWrite('producer_products.upsert', async () => {
    const q = supabase.from(TABLES.producerProducts).upsert(payload, { onConflict: 'id' }).select('*').single();
    return q as any;
  });
}

export async function deleteProducerProduct(id: string): Promise<void> {
  requireVal(id, 'productId');
  const supabase = getSupabase();
  await safeWrite('producer_products.delete', async () => {
    const q = supabase.from(TABLES.producerProducts).delete().eq('id', id);
    return q as any;
  });
}

export async function purchaseProduct(
  product: { id: string; price: number; title?: string },
  buyer: { id: string },
  producer: { id: string },
  userRole?: string
): Promise<{ sessionId: string; booking?: any }> {
  const origin = getAppOrigin();
  const successUrl = origin ? `${origin}/?stripe=success` : '';
  const cancelUrl = origin ? `${origin}/?stripe=cancel` : '';
  const amountCents = Math.round(Number(product?.price ?? 0) * 100);
  if (!amountCents) throw new Error('Product price must be greater than 0.');

  const res = await callEdgeFunction('create-product-checkout', {
    productId: product.id,
    amountCents,
    buyerProfileId: buyer?.id,
    producerProfileId: producer?.id,
    successUrl,
    cancelUrl,
    userRole: userRole || null,
  });
  return { sessionId: res?.sessionId, booking: res?.booking };
}

export async function upsertMixingSample(sample: Record<string, any>): Promise<any> {
  requireVal(sample, 'mixingSample');
  const supabase = getSupabase();
  return safeWrite('mixing_samples.upsert', async () => {
    const q = supabase.from(TABLES.mixingSamples).upsert({ ...sample, updated_at: nowIso() }, { onConflict: 'id' }).select('*').single();
    return q as any;
  });
}

export async function deleteMixingSample(id: string): Promise<void> {
  requireVal(id, 'mixingSampleId');
  const supabase = getSupabase();
  await safeWrite('mixing_samples.delete', async () => {
    const q = supabase.from(TABLES.mixingSamples).delete().eq('id', id);
    return q as any;
  });
}

/* ============================================================
   BOOKINGS
============================================================ */

export async function createBooking(payload: Record<string, any>): Promise<any> {
  const supabase = getSupabase();
  return safeWrite('bookings.insert', async () => {
    const q = supabase.from(TABLES.bookings).insert({ ...payload, created_at: nowIso() }).select('*').single();
    return q as any;
  });
}

export async function cancelBooking(bookingId: string): Promise<void> {
  requireVal(bookingId, 'bookingId');
  const supabase = getSupabase();
  await safeWrite('bookings.cancel', async () => {
    const q = supabase.from(TABLES.bookings).update({ status: 'cancelled', updated_at: nowIso() }).eq('id', bookingId);
    return q as any;
  });
}

export async function respondToBooking(bookingId: string, status: 'approved' | 'rejected', note?: string): Promise<void> {
  requireVal(bookingId, 'bookingId');
  const supabase = getSupabase();
  await safeWrite('bookings.respond', async () => {
    const q = supabase.from(TABLES.bookings).update({ status, note: note || null, updated_at: nowIso() }).eq('id', bookingId);
    return q as any;
  });
}

export async function fetchBookingById(bookingId: string): Promise<any> {
  requireVal(bookingId, 'bookingId');
  const supabase = getSupabase();
  const { data, error } = await withTimeout(
    supabase.from(TABLES.bookings).select('*').eq('id', bookingId).maybeSingle() as Promise<{ data: any; error: any }>,
    DB_TIMEOUT_MS,
    'bookings.byId'
  );
  if (error) throw new Error(`fetchBookingById: ${errMsg(error)}`);
  return data ?? null;
}

export async function fetchLabelBookings(labelProfileId: string): Promise<any[]> {
  if (!labelProfileId) return [];
  const supabase = getSupabase();
  return safeSelect('bookings.byLabel', async () => {
    // Remove order clause to avoid 400 errors - we'll sort in memory if needed
    const q = supabase.from(TABLES.bookings).select('*').eq('label_profile_id', labelProfileId);
    return q as any;
  }, []);
}

/* ============================================================
   LABEL: ROSTER / PERFORMANCE / INSIGHTS / FINANCIALS
============================================================ */

export async function fetchLabelRoster(labelProfileId: string): Promise<any[]> {
  if (!labelProfileId) return [];
  const supabase = getSupabase();
  return safeSelect('label_roster.byLabel', async () => {
    // Remove order clause to avoid 400 errors - we'll sort in memory if needed
    const { data, error } = await supabase
      .from(TABLES.labelRoster)
      .select('*')
      .or(`label_profile_id.eq.${labelProfileId},label_id.eq.${labelProfileId}`);
    const list = (data || []).filter((r: any) => r.dropped_at == null);
    // Sort in memory by created_at if it exists
    if (list.length > 0 && list[0].created_at) {
      list.sort((a: any, b: any) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime; // descending
      });
    }
    return { data: list, error };
  }, []);
}

/** Import roster via edge: creates profiles, role rows, roster rows, and sends invite with claim link. Supports unlimited rows. */
export async function importRosterEdge(labelId: string, rows: { name: string; email: string; role: string; phone?: string; instagram?: string; notes?: string }[]): Promise<{ imported: number; errors: { name?: string; email?: string; message: string }[] }> {
  const res = await callEdgeFunction('import-roster', { labelId, rows, appOrigin: getAppOrigin() }) as { imported?: number; errors?: any[] };
  return { imported: res?.imported ?? 0, errors: res?.errors ?? [] };
}

/** Soft‑drop: sets dropped_at on roster and removes label_verified from the artist. Label can only drop their own roster. */
export async function removeArtistFromLabelRoster(labelProfileId: string, artistProfileId: string): Promise<void> {
  requireVal(labelProfileId, 'labelProfileId');
  requireVal(artistProfileId, 'artistProfileId');
  const supabase = getSupabase();
  const orClause = `and(label_profile_id.eq.${labelProfileId},artist_profile_id.eq.${artistProfileId}),and(label_profile_id.eq.${labelProfileId},user_id.eq.${artistProfileId}),and(label_id.eq.${labelProfileId},artist_profile_id.eq.${artistProfileId}),and(label_id.eq.${labelProfileId},user_id.eq.${artistProfileId})`;
  await safeWrite('label_roster.drop', async () => {
    const q = supabase.from(TABLES.labelRoster).update({ dropped_at: nowIso(), updated_at: nowIso() }).or(orClause);
    return q as any;
  });
  await updateUser(artistProfileId, { label_verified: false, verified_by_label_id: null });
}

export async function setArtistAllocation(
  labelProfileId: string,
  artistProfileId: string,
  allocationPct?: number,
  allocationAmount?: number
): Promise<any> {
  requireVal(labelProfileId, 'labelProfileId');
  requireVal(artistProfileId, 'artistProfileId');
  const supabase = getSupabase();
  const payload: Record<string, any> = {
    label_profile_id: labelProfileId,
    artist_profile_id: artistProfileId,
    updated_at: nowIso(),
  };
  if (allocationPct != null) payload.allocation_pct = allocationPct;
  if (allocationAmount != null) payload.allocation_amount = allocationAmount;
  return safeWrite('label_roster.upsert(allocation)', async () => {
    const q = supabase.from(TABLES.labelRoster).upsert(payload, { onConflict: 'label_profile_id,artist_profile_id' }).select('*').single();
    return q as any;
  });
}

export async function fetchLabelPerformance(labelProfileId: string, days = 30): Promise<any> {
  // Lightweight aggregation; if tables aren’t present, return safe defaults.
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const bookings = await fetchLabelBookings(labelProfileId);
  const totalBookings = bookings.length;
  const approved = bookings.filter((b: any) => (b.status || '').toLowerCase() === 'approved').length;

  const posts = await safeSelect('posts.labelRecent', async () => {
    const supabase = getSupabase();
    const q = supabase.from(TABLES.posts).select('*').eq('label_profile_id', labelProfileId).gte('created_at', since);
    return q as any;
  }, []);

  return {
    rangeDays: days,
    totalBookings,
    approvedBookings: approved,
    recentPosts: Array.isArray(posts) ? posts.length : 0,
  };
}

export async function getRosterActivity(labelProfileId: string, days = 14): Promise<any[]> {
  // Best-effort: look for roster activity in posts/bookings tied to roster members.
  const roster = await fetchLabelRoster(labelProfileId);
  const artistIds = roster.map((r: any) => r.artist_profile_id || r.user_id).filter(Boolean);

  if (artistIds.length === 0) return [];

  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const supabase = getSupabase();

  // Fetch recent posts by roster artists
  const posts = await safeSelect('posts.rosterActivity', async () => {
    // @ts-ignore
    const q = supabase.from(TABLES.posts).select('*').in('author_id', artistIds).gte('created_at', since).order('created_at', { ascending: false }).limit(200);
    return q as any;
  }, []);

  // Normalize activity feed (profile_id for consumers; posts may have author_id)
  return (posts as any[]).map((p) => ({
    type: 'post',
    created_at: p.created_at,
    profile_id: p.author_id ?? p.profile_id,
    post: p,
  }));
}

export async function fetchLabelTransactions(labelProfileId: string): Promise<any[]> {
  if (!labelProfileId) return [];
  const supabase = getSupabase();
  return safeSelect('label_transactions.byLabel', async () => {
    const q = supabase.from(TABLES.labelTransactions).select('*').eq('label_profile_id', labelProfileId).order('created_at', { ascending: false });
    return q as any;
  }, []);
}

export async function fetchLabelNotifications(labelProfileId: string): Promise<any[]> {
  if (!labelProfileId) return [];
  const supabase = getSupabase();
  return safeSelect('label_notifications.byLabel', async () => {
    const q = supabase.from('label_notifications').select('*').eq('label_id', labelProfileId).order('created_at', { ascending: false });
    return q as any;
  }, []);
}

export async function markLabelNotificationAsRead(notificationId: string, isRead: boolean): Promise<void> {
  requireVal(notificationId, 'notificationId');
  const supabase = getSupabase();
  await safeWrite('label_notifications.update', async () => {
    const q = supabase.from('label_notifications').update({ is_read: isRead, updated_at: nowIso() }).eq('id', notificationId);
    return q as any;
  });
}

export async function deleteLabelNotification(notificationId: string): Promise<void> {
  requireVal(notificationId, 'notificationId');
  const supabase = getSupabase();
  await safeWrite('label_notifications.delete', async () => {
    const q = supabase.from('label_notifications').delete().eq('id', notificationId);
    return q as any;
  });
}

export async function fetchLabelPayoutRequests(labelProfileId: string): Promise<any[]> {
  if (!labelProfileId) return [];
  const supabase = getSupabase();
  return safeSelect('label_payout_requests.byLabel', async () => {
    const q = supabase.from('label_payout_requests').select('*').eq('label_id', labelProfileId).order('requested_on', { ascending: false });
    return q as any;
  }, []);
}

export async function updatePayoutRequestStatus(payoutId: string, status: 'Pending' | 'Approved' | 'Rejected'): Promise<void> {
  requireVal(payoutId, 'payoutId');
  const supabase = getSupabase();
  await safeWrite('label_payout_requests.update', async () => {
    const q = supabase.from('label_payout_requests').update({ status, updated_at: nowIso() }).eq('id', payoutId);
    return q as any;
  });
}

export async function fetchLabelContracts(labelProfileId: string): Promise<any[]> {
  if (!labelProfileId) return [];
  const supabase = getSupabase();
  return safeSelect('label_contracts.byLabel', async () => {
    // Remove order clause to avoid 400 errors - we'll sort in memory if needed
    const q = supabase.from(TABLES.labelContracts).select('*').eq('label_profile_id', labelProfileId);
    return q as any;
  }, []);
}

export async function fetchLabelProjects(labelProfileId: string): Promise<any[]> {
  if (!labelProfileId) return [];
  const supabase = getSupabase();
  return safeSelect('label_projects.byLabel', async () => {
    const q = supabase.from(TABLES.labelProjects).select('*').eq('label_profile_id', labelProfileId).order('created_at', { ascending: false });
    return q as any;
  }, []);
}

export async function createProjectTask(projectId: string, task: Record<string, any>): Promise<any> {
  requireVal(projectId, 'projectId');
  const supabase = getSupabase();
  return safeWrite('label_project_tasks.insert', async () => {
    const q = supabase.from(TABLES.labelProjectTasks).insert({ project_id: projectId, ...task, created_at: nowIso(), updated_at: nowIso() }).select('*').single();
    return q as any;
  });
}

export async function updateProjectTask(taskId: string, patch: Record<string, any>): Promise<any> {
  requireVal(taskId, 'taskId');
  const supabase = getSupabase();
  return safeWrite('label_project_tasks.update', async () => {
    const q = supabase.from(TABLES.labelProjectTasks).update({ ...patch, updated_at: nowIso() }).eq('id', taskId).select('*').single();
    return q as any;
  });
}

export async function getLabelBudgetOverview(labelProfileId: string): Promise<any> {
  // Safe placeholder: derive from transactions if present
  const tx = await fetchLabelTransactions(labelProfileId);
  const spent = tx.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  return { spent, transactions: tx.length };
}

export async function setLabelBudget(labelProfileId: string, budget: Record<string, any>): Promise<any> {
  // Store in profiles or a dedicated table if you have one; best-effort update profiles
  return updateUser(labelProfileId, { label_budget: budget, updated_at: nowIso() });
}

export async function updateLabelBudgetMode(
  labelProfileId: string,
  mode: string,
  monthlyAllowance?: number,
  resetDay?: number
): Promise<any> {
  const patch: Record<string, any> = { budget_mode: mode, updated_at: nowIso() };
  if (monthlyAllowance != null) patch.monthly_allowance = monthlyAllowance;
  if (resetDay != null) patch.reset_day = resetDay;
  return updateUser(labelProfileId, patch);
}

export async function addLabelFunds(labelProfileId: string, amount: number, note?: string): Promise<any> {
  requireVal(labelProfileId, 'labelProfileId');
  const supabase = getSupabase();
  return safeWrite('label_transactions.insert(fund)', async () => {
    const q = supabase.from(TABLES.labelTransactions).insert({
      label_profile_id: labelProfileId,
      amount,
      kind: 'fund',
      note: note || null,
      created_at: nowIso(),
    }).select('*').single();
    return q as any;
  });
}

/* ============================================================
   LABEL: CLAIM FLOW
============================================================ */

export async function generateClaimTokenForRosterMember(labelProfileId: string, rosterRowId: string): Promise<{ token: string }> {
  // Client-only fallback: generate a random token and store it on the roster row
  requireVal(labelProfileId, 'labelProfileId');
  requireVal(rosterRowId, 'rosterRowId');
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  const supabase = getSupabase();
  await safeWrite('label_roster.update(claim_token)', async () => {
    const q = supabase.from(TABLES.labelRoster).update({ claim_token: token, updated_at: nowIso() }).eq('id', rosterRowId).eq('label_profile_id', labelProfileId);
    return q as any;
  });

  return { token };
}

/** For UI: returns { labelName, role, email }. Tries get-claim-details edge first, then Supabase. */
export async function getClaimDetails(tokenOrCode: string): Promise<{ labelName: string; role: string; email?: string } | null> {
  if (!tokenOrCode) return null;
  try {
    const res = (await callEdgeFunction('get-claim-details', { token: tokenOrCode })) as { ok?: boolean; data?: { labelName?: string; role?: string; email?: string } };
    if (res?.ok && res?.data) return { labelName: res.data.labelName || 'The Label', role: res.data.role || 'Artist', email: res.data.email };
  } catch (_) { /* fallback */ }
  const supabase = getSupabase();
  let roster = await safeSelect('label_roster.byClaimToken', async () => {
    const q = supabase.from(TABLES.labelRoster).select('*').eq('claim_token', tokenOrCode).maybeSingle();
    return q as any;
  }, null);
  if (!roster) {
    roster = await safeSelect('label_roster.byClaimCode', async () => {
      const q = supabase.from(TABLES.labelRoster).select('*').eq('claim_code', tokenOrCode).maybeSingle();
      return q as any;
    }, null);
  }
  if (roster) {
    const labelId = roster.label_profile_id || roster.label_id;
    let labelName = 'The Label';
    if (labelId) {
      const p = await safeSelect('profiles.byLabel', async () => {
        const q = supabase.from(TABLES.profiles).select('name').eq('id', labelId).maybeSingle();
        return q as any;
      }, null);
      if (p?.name) labelName = p.name;
    }
    return { labelName, role: roster.role || 'Artist', email: roster.email };
  }
  const prof = await safeSelect('profiles.byClaimCode', async () => {
    const q = supabase.from(TABLES.profiles).select('*').eq('claim_code', tokenOrCode).maybeSingle();
    return q as any;
  }, null);
  if (prof) return { labelName: 'The Label', role: prof.role || 'ARTIST', email: prof.email };
  return null;
}

export async function claimProfileByToken(token: string, claimantProfileId: string): Promise<{ ok: boolean; role: string }> {
  requireVal(token, 'token');
  requireVal(claimantProfileId, 'claimantProfileId');
  const supabase = getSupabase();

  let roster = await safeSelect('label_roster.byClaimToken', async () => {
    const q = supabase.from(TABLES.labelRoster).select('*').eq('claim_token', token).maybeSingle();
    return q as any;
  }, null);
  if (!roster) {
    roster = await safeSelect('label_roster.byClaimCode', async () => {
      const q = supabase.from(TABLES.labelRoster).select('*').eq('claim_code', token).maybeSingle();
      return q as any;
    }, null);
  }
  if (roster) {
    await safeWrite('label_roster.claim', async () => {
      const q = supabase.from(TABLES.labelRoster).update({
        claimed_by_profile_id: claimantProfileId,
        claim_token: null,
        user_id: claimantProfileId,
        artist_profile_id: claimantProfileId,
        updated_at: nowIso(),
      }).eq('id', roster.id);
      return q as any;
    });
    const labelId = roster.label_profile_id || roster.label_id;
    await updateUser(claimantProfileId, { label_verified: true, verified_by_label_id: labelId || undefined });
    const role = (roster.role || 'artist').toUpperCase();
    return { ok: true, role: role === 'ARTIST' ? 'ARTIST' : role === 'ENGINEER' ? 'ENGINEER' : role === 'PRODUCER' ? 'PRODUCER' : 'ARTIST' };
  }

  const prof = await safeSelect('profiles.byClaimCode', async () => {
    const q = supabase.from(TABLES.profiles).select('*').eq('claim_code', token).maybeSingle();
    return q as any;
  }, null);
  if (prof) {
    await safeWrite('profiles.claim', async () => {
      const q = supabase.from(TABLES.profiles).update({ claimed_by_profile_id: claimantProfileId, claim_code: null, updated_at: nowIso() }).eq('id', prof.id);
      return q as any;
    });
    return { ok: true, role: (prof.role || 'ARTIST') as string };
  }
  throw new Error('Invalid or expired claim token');
}

export async function claimProfileByCode(code: string, claimantProfileId: string): Promise<any> {
  requireVal(code, 'code');
  requireVal(claimantProfileId, 'claimantProfileId');
  const supabase = getSupabase();

  const prof = await safeSelect('profiles.byClaimCode', async () => {
    const q = supabase.from(TABLES.profiles).select('*').eq('claim_code', code).maybeSingle();
    return q as any;
  }, null);

  if (!prof) throw new Error('Invalid claim code');

  await safeWrite('profiles.claim', async () => {
    const q = supabase.from(TABLES.profiles).update({ claimed_by_profile_id: claimantProfileId, claim_code: null, updated_at: nowIso() }).eq('id', prof.id);
    return q as any;
  });
  return { ok: true, role: (prof.role || 'ARTIST') as string };
}

export async function claimLabelRosterProfile(labelProfileId: string, rosterRowId: string, claimantProfileId: string): Promise<any> {
  requireVal(labelProfileId, 'labelProfileId');
  requireVal(rosterRowId, 'rosterRowId');
  requireVal(claimantProfileId, 'claimantProfileId');

  const supabase = getSupabase();
  await safeWrite('label_roster.claimDirect', async () => {
    const q = supabase.from(TABLES.labelRoster).update({ claimed_by_profile_id: claimantProfileId, updated_at: nowIso() }).eq('id', rosterRowId).eq('label_profile_id', labelProfileId);
    return q as any;
  });
  return { ok: true };
}

/* ============================================================
   INSIGHTS / ANALYTICS (SAFE PLACEHOLDERS)
============================================================ */

export async function fetchAnalyticsData(profileId: string, userRole?: UserRole | string, timeframeDays: number = 30): Promise<any> {
  requireVal(profileId, 'profileId');
  const supabase = getSupabase();

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Math.max(1, timeframeDays) + 1);
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const days: string[] = [];
  for (let i = 0; i < Math.max(1, timeframeDays); i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }

  const toDayKey = (d?: string) => {
    if (!d) return '';
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  };

  const role = String(userRole || '').toUpperCase();

  let bookings: any[] = [];
  try {
    let q = supabase.from(TABLES.bookings).select('*');

    if (role === 'STOODIO') q = q.eq('stoodio_id', profileId);
    else if (role === 'ENGINEER') q = q.or(`engineer_profile_id.eq.${profileId},requested_engineer_id.eq.${profileId}`);
    else if (role === 'PRODUCER') q = q.eq('producer_id', profileId);
    else if (role === 'ARTIST') q = q.or(`booked_by_id.eq.${profileId},artist_profile_id.eq.${profileId}`);

    q = q.gte('created_at', startIso);
    const res = await withTimeout(q as any, DB_TIMEOUT_MS, 'analytics.bookings');
    if (res?.data) bookings = res.data;
  } catch {}

  const validBookings = bookings.filter((b) => String(b?.status || '').toLowerCase() !== 'cancelled');
  const totalRevenue = validBookings.reduce((sum, b) => sum + Number(b.total_cost || 0), 0);

  const revenueByDay = new Map<string, number>(days.map((d) => [d, 0]));
  validBookings.forEach((b) => {
    const day = toDayKey(b.date) || toDayKey(b.created_at);
    if (!day || !revenueByDay.has(day)) return;
    revenueByDay.set(day, (revenueByDay.get(day) || 0) + Number(b.total_cost || 0));
  });

  let followersByDay = new Map<string, number>(days.map((d) => [d, 0]));
  let totalFollowers = 0;
  try {
    const q = supabase
      .from(TABLES.follows)
      .select('created_at')
      .eq('following_id', profileId)
      .gte('created_at', startIso);
    const res = await withTimeout(q as any, DB_TIMEOUT_MS, 'analytics.follows');
    const rows = res?.data || [];
    totalFollowers = rows.length;
    rows.forEach((row: any) => {
      const day = toDayKey(row.created_at);
      if (!day || !followersByDay.has(day)) return;
      followersByDay.set(day, (followersByDay.get(day) || 0) + 1);
    });
  } catch {}

  let likesByDay = new Map<string, number>(days.map((d) => [d, 0]));
  try {
    const postRows = await fetchUserPosts(profileId);
    const postIds = (postRows || []).map((p: any) => p.id).filter(Boolean);
    if (postIds.length > 0) {
      const q = supabase.from(TABLES.postLikes).select('created_at,post_id').in('post_id', postIds).gte('created_at', startIso);
      const res = await withTimeout(q as any, DB_TIMEOUT_MS, 'analytics.likes');
      const rows = res?.data || [];
      rows.forEach((row: any) => {
        const day = toDayKey(row.created_at);
        if (!day || !likesByDay.has(day)) return;
        likesByDay.set(day, (likesByDay.get(day) || 0) + 1);
      });
    }
  } catch {}

  let tipsTotal = 0;
  try {
    const q = supabase
      .from(TABLES.labelTransactions)
      .select('amount,kind,created_at,artist_id')
      .eq('artist_id', profileId)
      .eq('kind', 'tip')
      .gte('created_at', startIso);
    const res = await withTimeout(q as any, DB_TIMEOUT_MS, 'analytics.tips');
    const rows = res?.data || [];
    tipsTotal = rows.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
  } catch {}

  const analytics = {
    kpis: {
      totalRevenue,
      profileViews: 0,
      newFollowers: totalFollowers,
      bookings: validBookings.length,
    },
    revenueOverTime: days.map((d) => ({ date: d, revenue: revenueByDay.get(d) || 0 })),
    engagementOverTime: days.map((d) => ({
      date: d,
      views: 0,
      followers: followersByDay.get(d) || 0,
      likes: likesByDay.get(d) || 0,
    })),
    revenueSources: [
      { name: 'Bookings', revenue: totalRevenue },
      { name: 'Tips', revenue: tipsTotal },
      { name: 'Other', revenue: 0 },
    ],
  };

  return analytics;
}

export async function scoutMarketInsights(query: string): Promise<any> {
  // Placeholder until you wire a real market intel endpoint
  return { query, insights: [], generated_at: nowIso() };
}

/* ============================================================
   MESSAGING (CONVERSATIONS / MESSAGES)
============================================================ */

export async function createConversation(participantIds: string[], meta: Record<string, any> = {}): Promise<any> {
  requireVal(participantIds?.length, 'participantIds');
  const supabase = getSupabase();
  const base = { participant_ids: participantIds, ...meta, created_at: nowIso() };
  try {
    return await safeWrite('conversations.insert', async () => {
      const q = supabase.from(TABLES.conversations).insert(base).select('*').single();
      return q as any;
    });
  } catch (e: any) {
    if (isMissingColumnError(e)) {
      const fallback = { participant_ids: participantIds, ...meta };
      return safeWrite('conversations.insert.fallback', async () => {
        const q = supabase.from(TABLES.conversations).insert(fallback).select('*').single();
        return q as any;
      });
    }
    throw e;
  }
}

export async function fetchConversations(profileId: string): Promise<any[]> {
  if (!profileId) return [];
  const supabase = getSupabase();
  // best effort: conversations might store participant_ids array
  return safeSelect('conversations.byParticipant', async () => {
    // @ts-ignore
    const q = supabase.from(TABLES.conversations).select('*').contains('participant_ids', [profileId]).order('created_at', { ascending: false });
    return q as any;
  }, []);
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  type: string = 'text',
  payload?: Record<string, any>
): Promise<any> {
  requireVal(conversationId, 'conversationId');
  requireVal(senderId, 'senderId');
  const supabase = getSupabase();
  const base = { conversation_id: conversationId, sender_id: senderId, text, type, created_at: nowIso() };
  const message = payload ? { ...base, ...payload } : base;
  return safeWrite('messages.insert', async () => {
    const q = supabase.from(TABLES.messages).insert(message).select('*').single();
    return q as any;
  });
}

/* ============================================================
   LIVE ROOMS
============================================================ */

export async function fetchLiveRooms(): Promise<any[]> {
  const supabase = getSupabase();
  const rooms = await safeSelect('live_rooms.list', async () => {
    const q = supabase.from(TABLES.liveRooms).select('*').eq('is_live', true).order('created_at', { ascending: false });
    return q as any;
  }, []);

  if (!Array.isArray(rooms) || rooms.length === 0) return [];

  const withCounts = await Promise.all(
    rooms.map(async (room: any) => {
      const { count } = await supabase
        .from(TABLES.liveRoomParticipants)
        .select('id', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .is('left_at', null);
      return { ...room, listeners: count || 0 };
    })
  );

  return withCounts;
}

export async function createLiveRoom(hostId: string, title: string): Promise<any> {
  requireVal(hostId, 'hostId');
  requireVal(title, 'title');
  const supabase = getSupabase();

  const room = await safeWrite('live_rooms.insert', async () => {
    const q = supabase.from(TABLES.liveRooms).insert({ host_id: hostId, title, is_live: true, created_at: nowIso() }).select('*').single();
    return q as any;
  });

  const conversation = await createConversation([hostId], {
    room_id: room.id,
    conversation_type: 'live_room',
    title: room.title,
  });

  await safeWrite('live_rooms.attachConversation', async () => {
    const q = supabase.from(TABLES.liveRooms).update({ conversation_id: conversation.id }).eq('id', room.id).select('*').single();
    return q as any;
  });

  await joinLiveRoom(room.id, hostId);

  return { ...room, conversation_id: conversation.id };
}

async function addConversationParticipant(conversationId: string, profileId: string): Promise<void> {
  const supabase = getSupabase();
  const conversation = await safeSelect('conversations.byId', async () => {
    const q = supabase.from(TABLES.conversations).select('participant_ids').eq('id', conversationId).single();
    return q as any;
  }, null as any);

  const participants = Array.isArray(conversation?.participant_ids) ? conversation.participant_ids : [];
  if (participants.includes(profileId)) return;

  await safeWrite('conversations.addParticipant', async () => {
    const q = supabase
      .from(TABLES.conversations)
      .update({ participant_ids: [...participants, profileId] })
      .eq('id', conversationId)
      .select('*')
      .single();
    return q as any;
  });
}

export async function joinLiveRoom(roomId: string, profileId: string): Promise<any> {
  requireVal(roomId, 'roomId');
  requireVal(profileId, 'profileId');
  const supabase = getSupabase();

  const room = await safeSelect('live_rooms.byId', async () => {
    const q = supabase.from(TABLES.liveRooms).select('*').eq('id', roomId).single();
    return q as any;
  }, null as any);

  await safeWrite('live_room_participants.upsert', async () => {
    const q = supabase
      .from(TABLES.liveRoomParticipants)
      .upsert(
        { room_id: roomId, profile_id: profileId, joined_at: nowIso(), left_at: null },
        { onConflict: 'room_id,profile_id' }
      )
      .select('*')
      .single();
    return q as any;
  });

  let conversationId = room?.conversation_id;
  if (!conversationId) {
    const conversation = await createConversation([profileId], {
      room_id: roomId,
      conversation_type: 'live_room',
      title: room?.title || 'Live Room',
    });
    conversationId = conversation?.id;
    if (conversationId) {
      await safeWrite('live_rooms.attachConversation', async () => {
        const q = supabase.from(TABLES.liveRooms).update({ conversation_id: conversationId }).eq('id', roomId).select('*').single();
        return q as any;
      });
    }
  }

  if (conversationId) {
    await addConversationParticipant(conversationId, profileId);
  }

  return { ...room, conversation_id: conversationId };
}

export async function leaveLiveRoom(roomId: string, profileId: string): Promise<void> {
  requireVal(roomId, 'roomId');
  requireVal(profileId, 'profileId');
  const supabase = getSupabase();
  await safeWrite('live_room_participants.leave', async () => {
    const q = supabase
      .from(TABLES.liveRoomParticipants)
      .update({ left_at: nowIso() })
      .eq('room_id', roomId)
      .eq('profile_id', profileId)
      .is('left_at', null);
    return q as any;
  });
}

export async function endLiveRoom(roomId: string, hostId: string): Promise<void> {
  requireVal(roomId, 'roomId');
  requireVal(hostId, 'hostId');
  const supabase = getSupabase();
  await safeWrite('live_rooms.end', async () => {
    const q = supabase
      .from(TABLES.liveRooms)
      .update({ is_live: false, ended_at: nowIso() })
      .eq('id', roomId)
      .eq('host_id', hostId);
    return q as any;
  });
}

/* ============================================================
   MONEY / PAYOUTS / TIPS (CLIENT STUBS)
============================================================ */

export async function addTip(from: any, toOrAmount: any, amountMaybe?: number, note?: string): Promise<any> {
  const origin = getAppOrigin();
  const successUrl = origin ? `${origin}/?stripe=success` : '';
  const cancelUrl = origin ? `${origin}/?stripe=cancel` : '';

  // Overload: addTip(booking, amount)
  if (from && typeof from === 'object' && typeof toOrAmount === 'number') {
    const booking = from as any;
    const amount = toOrAmount as number;
    const fromProfileId =
      booking.artist?.id ||
      booking.booked_by_id ||
      booking.stoodio?.id ||
      booking.producer?.id ||
      booking.engineer?.id;
    const toProfileId = booking.engineer?.id || booking.requested_engineer_id;

    if (!fromProfileId || !toProfileId) {
      throw new Error('Missing tip payer or recipient.');
    }

    const amountCents = Math.round(Number(amount || 0) * 100);
    return callEdgeFunction('create-tip-checkout', {
      amountCents,
      fromProfileId,
      toProfileId,
      bookingId: booking.id,
      note,
      successUrl,
      cancelUrl,
    });
  }

  // Overload: addTip(fromProfileId, toProfileId, amount, note)
  const fromProfileId = String(from || '');
  const toProfileId = String(toOrAmount || '');
  const amount = Number(amountMaybe || 0);
  if (!fromProfileId || !toProfileId || !amount) throw new Error('Missing tip details');

  const amountCents = Math.round(amount * 100);
  return callEdgeFunction('create-tip-checkout', {
    amountCents,
    fromProfileId,
    toProfileId,
    note,
    successUrl,
    cancelUrl,
  });
}

export async function initiatePayout(_profileId: string, _amount: number): Promise<any> {
  return callEdgeFunction('request-payout', {
    profileId: _profileId,
    amount: _amount,
  });
}

export async function createCheckoutSessionForSubscription(_planId: string, _profileId: string): Promise<{ sessionId: string }> {
  const origin = getAppOrigin();
  const successUrl = origin ? `${origin}/?stripe=success` : '';
  const cancelUrl = origin ? `${origin}/?stripe=cancel` : '';

  const planToPrice = (plan: string) => {
    if (String(plan).startsWith('price_')) return plan;
    const map: Record<string, string | undefined> = {
      ENGINEER_PLUS: (import.meta as any).env?.VITE_STRIPE_PRICE_ENGINEER_PLUS,
      PRODUCER_PRO: (import.meta as any).env?.VITE_STRIPE_PRICE_PRODUCER_PRO,
      STOODIO_PRO: (import.meta as any).env?.VITE_STRIPE_PRICE_STOODIO_PRO,
    };
    return map[plan];
  };

  const priceId = planToPrice(_planId);
  if (!priceId) {
    throw new Error('Missing Stripe price ID for this plan.');
  }

  return callEdgeFunction('create-subscription-checkout', {
    priceId,
    profileId: _profileId,
    successUrl,
    cancelUrl,
  });
}

export async function createCheckoutSessionForBooking(
  bookingRequest: Record<string, any>,
  stoodioId: string | undefined,
  payerProfileId: string,
  userRole: string
): Promise<{ sessionId: string }> {
  const origin = getAppOrigin();
  const successUrl = origin ? `${origin}/?stripe=success` : '';
  const cancelUrl = origin ? `${origin}/?stripe=cancel` : '';

  const amountCents = Math.round(Number(bookingRequest?.total_cost || 0) * 100);
  if (!amountCents) throw new Error('Missing booking total.');

  return callEdgeFunction('create-booking-checkout', {
    amountCents,
    payerProfileId,
    stoodioId,
    userRole,
    bookingRequest,
    successUrl,
    cancelUrl,
  });
}

export async function createCheckoutSessionForWallet(amount: number, profileId: string): Promise<{ sessionId: string }> {
  const origin = getAppOrigin();
  const successUrl = origin ? `${origin}/?stripe=success` : '';
  const cancelUrl = origin ? `${origin}/?stripe=cancel` : '';

  const amountCents = Math.round(Number(amount || 0) * 100);
  if (!amountCents) throw new Error('Amount must be greater than 0.');

  return callEdgeFunction('create-wallet-checkout', {
    amountCents,
    payerProfileId: profileId,
    successUrl,
    cancelUrl,
  });
}

export type BeatPurchaseType = 'lease_mp3' | 'lease_wav' | 'exclusive';

export async function purchaseBeat(
  instrumental: any,
  purchaseType: BeatPurchaseType,
  buyer: any,
  producer: any,
  userRole: string
): Promise<any> {
  const origin = getAppOrigin();
  const successUrl = origin ? `${origin}/?stripe=success` : '';
  const cancelUrl = origin ? `${origin}/?stripe=cancel` : '';

  let price: number;
  if (purchaseType === 'lease_mp3') price = Number(instrumental?.price_lease ?? 0);
  else if (purchaseType === 'lease_wav') price = Number(instrumental?.price_lease_wav ?? 0);
  else price = Number(instrumental?.price_exclusive ?? 0);
  const amountCents = Math.round(price * 100);
  if (!amountCents) throw new Error('Missing beat price for selected tier.');

  const res = await callEdgeFunction('create-beat-checkout', {
    amountCents,
    buyerProfileId: buyer?.id,
    producerProfileId: producer?.id,
    purchaseType,
    userRole,
    instrumental,
    successUrl,
    cancelUrl,
  });

  return { updatedBooking: res?.booking, sessionId: res?.sessionId };
}

export async function addTipToBooking(bookingId: string, amount: number, fromProfileId: string, toProfileId: string): Promise<any> {
  const origin = getAppOrigin();
  const successUrl = origin ? `${origin}/?stripe=success` : '';
  const cancelUrl = origin ? `${origin}/?stripe=cancel` : '';
  const amountCents = Math.round(Number(amount || 0) * 100);

  return callEdgeFunction('create-tip-checkout', {
    amountCents,
    fromProfileId,
    toProfileId,
    bookingId,
    successUrl,
    cancelUrl,
  });
}

/* ============================================================
   JOBS / BOOKINGS STATE (PLACEHOLDERS)
============================================================ */

export async function acceptJob(bookingId: string, engineerProfileId: string): Promise<any> {
  // Best-effort: mark booking accepted by engineer
  requireVal(bookingId, 'bookingId');
  requireVal(engineerProfileId, 'engineerProfileId');
  const supabase = getSupabase();
  return safeWrite('bookings.acceptJob', async () => {
    const q = supabase.from(TABLES.bookings).update({ status: 'accepted', engineer_profile_id: engineerProfileId, updated_at: nowIso() }).eq('id', bookingId).select('*').single();
    return q as any;
  });
}

// Unregistered Studios Functions
export async function fetchUnregisteredStudios(state?: string, city?: string): Promise<any[]> {
  const supabase = getSupabase();
  return safeSelect('unregistered_studios.fetch', async () => {
    // Check if table exists first - if migration hasn't been run, return empty array
    try {
      let q = supabase.from(TABLES.unregisteredStudios)
        .select('*')
        .eq('is_registered', false);
      
      if (state) {
        q = q.eq('state', state);
      }
      if (city) {
        q = q.eq('city', city);
      }
      
      return q.order('name', { ascending: true }) as any;
    } catch (error: any) {
      // If table doesn't exist (404), return empty array
      if (error?.code === 'PGRST116' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        console.warn('[fetchUnregisteredStudios] Table does not exist yet. Run migration: supabase migration up');
        return [];
      }
      throw error;
    }
  }, []);
}

export async function inviteUnregisteredStudio(
  studioId: string,
  studioEmail: string,
  inviterUserId: string,
  inviterName: string
): Promise<{ success: boolean; message: string; inviteLink?: string }> {
  requireVal(studioId, 'studioId');
  requireVal(studioEmail, 'studioEmail');
  requireVal(inviterUserId, 'inviterUserId');
  
  return callEdgeFunction('invite-studio', {
    studioId,
    studioEmail,
    inviterUserId,
    inviterName,
  });
}

export async function fetchRecordingStudiosFromGoogle(
  location: string,
  radius?: number,
  pageToken?: string
): Promise<{ success: boolean; studiosFound: number; studiosSaved?: number; studiosErrors?: number; nextPageToken?: string; message: string; error?: string; details?: string }> {
  requireVal(location, 'location');
  
  try {
    return await callEdgeFunction('fetch-recording-studios', {
      location,
      radius: radius || 50000,
      pageToken,
    });
  } catch (error: any) {
    // If edge function returns an error response, extract it
    if (error?.error) {
      return {
        success: false,
        studiosFound: 0,
        message: error.error,
        error: error.error,
        details: error.details,
      };
    }
    throw error;
  }
}

// Mixing Sample Ratings Functions
export async function fetchMixingSampleRatings(sampleId: string): Promise<Array<{ id: string; rater_id: string; rating: number; comment?: string; created_at: string }>> {
  const supabase = getSupabase();
  return safeSelect('mixing_sample_ratings.fetch', async () => {
    const q = supabase.from(TABLES.mixingSampleRatings)
      .select('*')
      .eq('mixing_sample_id', sampleId)
      .order('created_at', { ascending: false });
    return q as any;
  }, []);
}

export async function rateMixingSample(
  sampleId: string,
  raterId: string,
  rating: number,
  comment?: string
): Promise<any> {
  requireVal(sampleId, 'sampleId');
  requireVal(raterId, 'raterId');
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  const supabase = getSupabase();
  return safeWrite('mixing_sample_ratings.upsert', async () => {
    const q = supabase.from(TABLES.mixingSampleRatings)
      .upsert({
        mixing_sample_id: sampleId,
        rater_id: raterId,
        rating,
        comment: comment || null,
        updated_at: nowIso(),
      }, {
        onConflict: 'mixing_sample_id,rater_id',
      })
      .select('*')
      .single();
    return q as any;
  });
}

export async function endSession(bookingId: string): Promise<void> {
  requireVal(bookingId, 'bookingId');
  const supabase = getSupabase();
  await safeWrite('bookings.endSession', async () => {
    const q = supabase.from(TABLES.bookings).update({ status: 'completed', updated_at: nowIso() }).eq('id', bookingId);
    return q as any;
  });
}

/* ============================================================
   VERIFICATION
============================================================ */

export async function submitForVerification(profileId: string, payload: Record<string, any> = {}): Promise<any> {
  requireVal(profileId, 'profileId');
  // Store request on profile (best effort)
  return updateUser(profileId, { verification_status: 'pending', verification_payload: payload, updated_at: nowIso() });
}

/* ============================================================
   LABEL APPROVALS / FINANCIALS (extra)
============================================================ */

export async function setLabelBudgetMode(labelProfileId: string, mode: string): Promise<any> {
  return updateLabelBudgetMode(labelProfileId, mode);
}

export async function fetchLabelTransactionsSummary(labelProfileId: string): Promise<any> {
  const tx = await fetchLabelTransactions(labelProfileId);
  const total = tx.reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  return { count: tx.length, total };
}

/* ============================================================
   LABEL PERFORMANCE / INSIGHTS additional: contracts & projects already above
============================================================ */

/* ============================================================
   LABEL CONTRACTS / PROJECTS already implemented
============================================================ */

/* ============================================================
   LOGOUT (optional helper)
============================================================ */

export async function fullLogoutCleanup(): Promise<void> {
  const supabase = getSupabase();
  try { await supabase.auth.signOut(); } catch {}
}

