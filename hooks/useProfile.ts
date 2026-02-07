import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { getSupabase } from '../lib/supabase';
import * as apiService from '../services/apiService';
import type { Artist, Engineer, Stoodio, Producer, UserRole, Label } from '../types';

type AnyUser = Artist | Engineer | Stoodio | Producer | Label;

// Fields that exist on public.profiles in your schema
const PROFILE_FIELDS = new Set<string>([
  'username',
  'avatar_url',
  'updated_at',
  'role',
  'name',
  'email',
  'image_url',
  'cover_image_url',
  'bio',
  'coordinates',
  'wallet_balance',
  'is_online',
  'show_on_map',
  'aria_tools_enabled',
  'specialties',
  'rating',
  'location_text',
  'verification_status',
  'genres',
  'pull_up_price',
  'is_admin',
  'stripe_customer_id',
  'stripe_connect_id',
  'subscription_status',
  'current_period_end',
  'claim_status',
  'location',
  'stripe_connect_account_id',
  'payouts_enabled',
  'full_name',
  'label_controls',
  'label_policies',
]);

const getTableNameFromRole = (role: UserRole | null): string | null => {
  if (!role) return null;
  switch (role) {
    case 'ARTIST':
      return 'artists';
    case 'ENGINEER':
      return 'engineers';
    case 'PRODUCER':
      return 'producers';
    case 'STOODIO':
      return 'stoodioz';
    case 'LABEL':
      return 'labels';
    default:
      return null;
  }
};

export const useProfile = () => {
  const dispatch = useAppDispatch();
  const { currentUser, artists, engineers, producers, stoodioz, labels, userRole } = useAppState();
  const [isSaved, setIsSaved] = useState(false);

  const allUsers = useMemo(
    () => [...artists, ...engineers, ...producers, ...stoodioz, ...labels],
    [artists, engineers, producers, stoodioz, labels]
  );

  const updateProfile = useCallback(
    async (updates: Partial<AnyUser>) => {
      if (!currentUser || !userRole) return;

      const tableName = getTableNameFromRole(userRole);
      if (!tableName) return;

      // Canonical profile id: always use this for profiles table and role table profile_id match
      const profileId = (currentUser as any)?.profile_id ?? currentUser?.id;
      if (!profileId) return;

      // Split into profiles updates vs role-table updates
      const profileUpdates: Record<string, any> = {};
      const roleUpdates: Record<string, any> = {};

      const protectedProfileFields = new Set([
        'display_name',
        'username',
        'name',
        'full_name',
        'location_text',
        'location',
      ]);
      const looksLikeId = (value: string) =>
        /^(artis|engin|produc|stood|label|user)_[a-f0-9]{4,}/i.test(value) ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      const looksLikePlaceholder = (value: string) =>
        ['someone', 'unknown', 'user', 'n/a', 'na', 'none'].includes(value);
      const looksLikeEmail = (value: string) => value.includes('@') && value.includes('.');

      for (const [k, v] of Object.entries(updates as any)) {
        if (PROFILE_FIELDS.has(k)) {
          // Also sync photo/bio to role table so profile page and directory show them without needing enrich
          if (k === 'image_url' || k === 'cover_image_url' || k === 'bio') roleUpdates[k] = v;
          if (protectedProfileFields.has(k)) {
            const raw = typeof v === 'string' ? v : '';
            const trimmed = raw.trim();
            if (!trimmed) continue;
            const lower = trimmed.toLowerCase();
            if (looksLikePlaceholder(lower) || looksLikeId(lower) || looksLikeEmail(lower)) continue;
          }
          profileUpdates[k] = v;
        } else {
          roleUpdates[k] = v;
        }
      }

      try {
        const client = getSupabase();

        // 1) Update profiles first so photos persist even if role table update fails (e.g. missing column, RLS)
        let profRow: any = null;
        if (Object.keys(profileUpdates).length > 0) {
          const { data, error } = await client
            .from('profiles')
            .update(profileUpdates)
            .eq('id', profileId)
            .select('*')
            .maybeSingle();
          if (error) throw error;
          profRow = data;
        }

        // 2) Update role table (if any) - match by profile_id so directory and profile pages show photo
        let roleRow: any = null;
        if (Object.keys(roleUpdates).length > 0) {
          let { data, error } = await client
            .from(tableName)
            .update(roleUpdates)
            .eq('profile_id', profileId)
            .select('*')
            .maybeSingle();
          if (!data && !error) {
            const fallback = await client.from(tableName).update(roleUpdates).eq('id', profileId).select('*').maybeSingle();
            data = fallback.data;
            error = fallback.error;
          }
          if (error) {
            if (error.code === 'PGRST116' || error.message?.includes('column') || error.message?.includes('Could not find')) {
              console.warn(`Column may not exist in ${tableName} table. Profile photo already saved to profiles.`, error);
              roleRow = null;
            } else {
              throw error;
            }
          } else {
            roleRow = data;
          }
        }

        // Merge: prefer DB rows; keep image_url/cover_image_url from updates if DB didn't return them (e.g. RLS)
        const merged = {
          ...currentUser,
          ...(roleRow || {}),
          ...(profRow || {}),
          id: profileId,
          profile_id: profileId,
          image_url: (profRow?.image_url ?? profRow?.avatar_url ?? roleRow?.image_url ?? profileUpdates?.image_url ?? roleUpdates?.image_url ?? currentUser?.image_url ?? (currentUser as any)?.avatar_url) ?? null,
          cover_image_url: (profRow?.cover_image_url ?? roleRow?.cover_image_url ?? profileUpdates?.cover_image_url ?? roleUpdates?.cover_image_url ?? currentUser?.cover_image_url) ?? null,
        };

        // Update directory + current user
        const updatedUsers = allUsers.map((u) => (u.id === (merged as any).id ? (merged as any) : u));
        dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as any } });
        dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: merged as any } });

        setIsSaved(true);
        console.log('Profile updated successfully:', { roleUpdates, profileUpdates, merged });
      } catch (error: any) {
        console.error('Failed to update profile:', error);
        console.error('Update details:', { roleUpdates, profileUpdates, tableName, error: error?.message || error });
        throw error; // Re-throw so caller can handle it
      }
    },
    [currentUser, userRole, allUsers, dispatch]
  );

  const refreshCurrentUser = useCallback(async () => {
    if (!currentUser || !userRole) return;
    const tableName = getTableNameFromRole(userRole);
    if (!tableName) return;

    const profileId = (currentUser as any)?.profile_id ?? currentUser?.id;
    if (!profileId) return;

    let selectQuery = '*';
    if (userRole === 'ENGINEER') selectQuery = '*, mixing_samples(*)';
    if (userRole === 'PRODUCER') selectQuery = '*, instrumentals(*)';

    try {
      const client = getSupabase();

      const { data: roleRow, error: roleErr } = await client
        .from(tableName)
        .select(selectQuery)
        .eq('profile_id', profileId)
        .maybeSingle();
      if (roleErr) throw roleErr;

      let resolvedRoleRow = roleRow;
      // STOODIO: explicitly load rooms so RoomManager list and post-a-job stay in sync after save
      // rooms.stoodio_id FK references profiles.id (profile_id), not stoodioz.id
      let rooms: any[] = [];
      if (userRole === 'STOODIO') {
        const { data: r } = await client.from('rooms').select('*').eq('stoodio_id', profileId).order('name');
        rooms = Array.isArray(r) ? r : [];
      }
      // PRODUCER: instrumentals can be keyed to profile_id, so load directly by profile id
      let instrumentals: any[] = [];
      if (userRole === 'PRODUCER') {
        try {
          instrumentals = await apiService.fetchInstrumentalsForProducer(profileId);
        } catch {
          instrumentals = Array.isArray((resolvedRoleRow as any)?.instrumentals) ? (resolvedRoleRow as any)?.instrumentals : [];
        }
      }
      // ENGINEER: mixing samples can be keyed to profile_id, so load directly by profile id
      let mixingSamples: any[] = [];
      if (userRole === 'ENGINEER') {
        try {
          const { data: samples } = await client
            .from('mixing_samples')
            .select('*')
            .eq('engineer_id', profileId)
            .order('created_at', { ascending: false });
          mixingSamples = Array.isArray(samples) ? samples : [];
        } catch {
          mixingSamples = Array.isArray((resolvedRoleRow as any)?.mixing_samples) ? (resolvedRoleRow as any)?.mixing_samples : [];
        }
      }

      const { data: profRow, error: profErr } = await client
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();
      if (profErr) throw profErr;

      const merged = {
        ...(resolvedRoleRow || {}),
        ...(profRow || {}),
        id: profileId,
        profile_id: profileId,
        image_url: (profRow?.image_url ?? profRow?.avatar_url ?? resolvedRoleRow?.image_url ?? currentUser?.image_url ?? (currentUser as any)?.avatar_url) ?? null,
        cover_image_url: (profRow?.cover_image_url ?? resolvedRoleRow?.cover_image_url ?? currentUser?.cover_image_url) ?? null,
        ...(userRole === 'STOODIO' && resolvedRoleRow?.id ? { role_id: resolvedRoleRow.id } : {}),
        ...(userRole === 'STOODIO' ? { rooms } : {}),
        ...(userRole === 'PRODUCER' ? { instrumentals } : {}),
        ...(userRole === 'ENGINEER' ? { mixing_samples: mixingSamples } : {}),
      };

      const updatedUsers = allUsers.map((u) => (u.id === (merged as any).id ? (merged as any) : u));
      dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as any } });
      dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: merged as any } });
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  }, [currentUser, userRole, allUsers, dispatch]);

  useEffect(() => {
    if (!isSaved) return;
    const timer = setTimeout(() => setIsSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [isSaved]);

  const verificationSubmit = useCallback(
    async (stoodioId: string, data: { googleBusinessProfileUrl: string; websiteUrl: string }) => {
      try {
        const updatedStoodioPartial = await apiService.submitForVerification(stoodioId, data);
        const updatedUsers = allUsers.map((u) =>
          u.id === stoodioId ? ({ ...(u as any), ...(updatedStoodioPartial as any) } as any) : u
        );
        dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as any } });
      } catch (error) {
        console.error('Verification submission failed:', error);
      }
    },
    [allUsers, dispatch]
  );

  return { updateProfile, refreshCurrentUser, verificationSubmit, isSaved };
};
