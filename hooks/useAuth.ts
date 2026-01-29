import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppState, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView, UserRole } from '../types';
import { getSupabase, performLogout } from '../lib/supabase';

type NavigateFn = (view: any) => void;

type ProfileHydrationResult = {
  user: any;
  role: UserRole;
};

const LOGIN_TIMEOUT_MS = 30_000; // Increased from 12s to 30s for slow networks
const HYDRATE_TIMEOUT_MS = 30_000; // Increased from 12s to 30s for slow networks

/**
 * Guarantee: a promise that either resolves within `ms` or rejects with a timeout error.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`[timeout] ${label} exceeded ${ms}ms`));
    }, ms);

    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

function landingForRole(role: UserRole): AppView {
  return role === UserRole.LABEL ? AppView.LABEL_DASHBOARD : AppView.THE_STAGE;
}

/**
 * useAuth
 * - login(): password auth + hydrate profile/role + dispatch LOGIN_SUCCESS + navigate
 * - resumeSession(): hydrate from existing session without prompting for password
 * - logout(): clean sign-out + dispatch LOGOUT + navigate to landing
 *
 * IMPORTANT:
 * This hook is designed to NEVER leave your UI stuck in loading.
 */
export const useAuth = (navigate: NavigateFn) => {
  const dispatch = useAppDispatch();
  const { history, historyIndex } = useAppState();
  const currentViewRef = useRef<AppView>(history[historyIndex]);
  currentViewRef.current = history[historyIndex];

  // Prevent double-fire login (double click / lag / enter key repeat)
  const loginInFlightRef = useRef(false);

  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading } });
    },
    [dispatch]
  );

  /**
   * Hydrate the app user + role from DB using the session user id.
   * This is where "logged in but can't enter app" usually breaks.
   */
  const hydrateFromUid = useCallback(
    async (uid: string): Promise<ProfileHydrationResult> => {
      // Your app’s “real login” gate:
      // must load profile + role so we can dispatch LOGIN_SUCCESS and navigate.
      const res = await withTimeout(
        apiService.fetchCurrentUserProfile(uid),
        HYDRATE_TIMEOUT_MS,
        'fetchCurrentUserProfile'
      );

      if (!res) {
        throw new Error(
          'Signed in, but profile/role could not be loaded (fetchCurrentUserProfile returned null).'
        );
      }

      // Expect shape: { user, role } — but tolerate a few variants so you don’t get bricked.
      const roleRaw: any = (res as any).role ?? (res as any).profile?.role ?? (res as any).data?.role;
      const userRaw: any = (res as any).user ?? (res as any).profile ?? (res as any).data ?? res;

      if (!roleRaw) {
        // This means apiService changed return shape or didn’t select role.
        console.error('[useAuth] Unexpected profile response:', res);
        throw new Error('Signed in, but profile response did not include a role.');
      }

      return { user: userRaw, role: roleRaw as UserRole };
    },
    []
  );

  /**
   * Apply hydrated user to app state and navigate.
   * If pending_claim_token exists, go to CLAIM_CONFIRM so user can link to roster and get verified badge.
   */
  const commitLogin = useCallback(
    ({ user, role }: ProfileHydrationResult) => {
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: { user, role },
      });
      const hasClaim = typeof window !== 'undefined' && (sessionStorage.getItem('pending_claim_token') || localStorage.getItem('pending_claim_token'));
      if (hasClaim) {
        navigate(AppView.CLAIM_CONFIRM);
        return;
      }
      const viewNow = currentViewRef.current;
      const isPublic =
        viewNow === AppView.LOGIN ||
        viewNow === AppView.LANDING_PAGE ||
        viewNow === AppView.CHOOSE_PROFILE;
      if (isPublic) {
        navigate(landingForRole(role));
      }
    },
    [dispatch, navigate]
  );

  /**
   * Login with password.
   * GUARANTEE: resolves or rejects; never hangs; never leaves loading stuck.
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const cleanEmail = (email || '').trim();

      if (loginInFlightRef.current) return;
      loginInFlightRef.current = true;

      setLoading(true);

      try {
        const supabase = getSupabase();

        // 1) Auth (password)
        const signInPromise = supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        const { data, error } = await withTimeout(signInPromise as any, LOGIN_TIMEOUT_MS, 'signInWithPassword');

        if (error) {
          // Important: throw so UI can show message; do NOT hang.
          throw error;
        }

        const uid = data?.user?.id ?? data?.session?.user?.id ?? null;

        // Some Supabase versions return session differently — so re-check:
        const finalUid =
          uid ||
          (await (async () => {
            const { data: sessData } = await supabase.auth.getSession();
            return sessData.session?.user?.id ?? null;
          })());

        if (!finalUid) {
          throw new Error('Login succeeded but no session user id was found.');
        }

        // 2) Hydrate profile/role
        const hydrated = await hydrateFromUid(finalUid);

        // 3) Commit into app state + navigate
        commitLogin(hydrated);
      } finally {
        // GUARANTEE unlock
        setLoading(false);
        loginInFlightRef.current = false;
      }
    },
    [commitLogin, hydrateFromUid, setLoading]
  );

  /**
   * Resume session without password (useful when app state resets but Supabase session still exists).
   * Returns true if resumed, false if no session.
   */
  const resumeSession = useCallback(async (): Promise<boolean> => {
    if (loginInFlightRef.current) return false;
    loginInFlightRef.current = true;

    setLoading(true);

    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;

      if (!uid) return false;

      const hydrated = await hydrateFromUid(uid);
      commitLogin(hydrated);
      return true;
    } finally {
      setLoading(false);
      loginInFlightRef.current = false;
    }
  }, [commitLogin, hydrateFromUid, setLoading]);

  /**
   * Logout safely.
   */
  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // performLogout is your wrapper; fallback to supabase if needed.
      try {
        await performLogout();
      } catch {
        const supabase = getSupabase();
        await supabase.auth.signOut();
      }

      dispatch({ type: ActionTypes.LOGOUT });

      // Return to landing
      navigate(AppView.LANDING_PAGE);
    } finally {
      setLoading(false);
    }
  }, [dispatch, navigate, setLoading]);

  /**
   * Optional: keep app state synced with Supabase auth changes.
   * This prevents weird cases where you’re logged in but state resets and you appear logged out.
   *
   * If you already handle this elsewhere, this won’t break anything — it only hydrates when needed.
   */
  useEffect(() => {
    const supabase = getSupabase();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id ?? null;
      if (!uid) return;

      // Don’t spam hydration if user is actively logging in
      if (loginInFlightRef.current) return;

      // Light-touch: attempt hydration; if it fails, do nothing (avoid loops)
      try {
        loginInFlightRef.current = true;
        const hydrated = await hydrateFromUid(uid);
        commitLogin(hydrated);
      } catch (e) {
        console.warn('[useAuth] auth state hydrate skipped:', e);
      } finally {
        loginInFlightRef.current = false;
      }
    });

    return () => {
      sub?.subscription?.unsubscribe?.();
    };
  }, [commitLogin, hydrateFromUid]);

  /**
   * Navigate to the appropriate setup view based on selected role.
   * Called when user selects a role from ChooseProfile.
   */
  const selectRoleToSetup = useCallback(
    (role: UserRole) => {
      let setupView: AppView;
      switch (role) {
        case UserRole.ARTIST:
          setupView = AppView.ARTIST_SETUP;
          break;
        case UserRole.ENGINEER:
          setupView = AppView.ENGINEER_SETUP;
          break;
        case UserRole.PRODUCER:
          setupView = AppView.PRODUCER_SETUP;
          break;
        case UserRole.STOODIO:
          setupView = AppView.STOODIO_SETUP;
          break;
        case UserRole.LABEL:
          setupView = AppView.LABEL_SETUP;
          break;
        default:
          console.warn('[selectRoleToSetup] Unknown role:', role);
          setupView = AppView.CHOOSE_PROFILE;
      }
      console.log('[selectRoleToSetup] Navigating to:', setupView, 'for role:', role);
      navigate(setupView);
    },
    [navigate]
  );

  return {
    login,
    resumeSession,
    logout,
    selectRoleToSetup,
  };
};
