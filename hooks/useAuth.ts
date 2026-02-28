import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppState, ActionTypes } from '../contexts/AppContext';
import { AUTH_HYDRATE_WRAPPER_MS, LOGIN_TIMEOUT_MS } from '../constants';
import * as apiService from '../services/apiService';
import { AppView, UserRole } from '../types';
import { getSupabase, getSupabaseReachable, getSupabaseReachableForStripe, performLogout } from '../lib/supabase';

type NavigateFn = (view: any) => void;

type ProfileHydrationResult = {
  user: any;
  role: UserRole;
};

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
        AUTH_HYDRATE_WRAPPER_MS,
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
      const cleanPassword = (password || '').trim();

      if (loginInFlightRef.current) return;
      loginInFlightRef.current = true;

      setLoading(true);

      try {
        const supabase = getSupabase();

        // 1) Auth (password)
        const signInPromise = supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
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
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('timeout') || msg.includes('exceeded')) {
          if (typeof window !== 'undefined' && !(window as any).__stoodioz_timeout_alert_shown) {
            (window as any).__stoodioz_timeout_alert_shown = true;
            alert(
              'Connection timed out. Your Supabase project may be PAUSED.\n\n' +
              '→ supabase.com/dashboard → your project → Settings → Restore project.\n\n' +
              'Then refresh and try again.'
            );
          }
        }
        throw e;
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
   * Logout: update UI immediately so the user is not trapped waiting for signOut().
   * signOut() runs in the background to clear the server session.
   */
  const logout = useCallback(async (): Promise<void> => {
    // Optimistic: clear state and show landing right away
    dispatch({ type: ActionTypes.LOGOUT });
    navigate(AppView.LANDING_PAGE);
    setLoading(false);

    // Clear Supabase session in the background (don't block UI)
    try {
      await performLogout();
    } catch {
      try {
        const supabase = getSupabase();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
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

      const stripeReturn = typeof window !== 'undefined' && (sessionStorage.getItem('stripe_return_in_progress') || sessionStorage.getItem('stripe_return_pending'));
      const reachable = stripeReturn
        ? await getSupabaseReachableForStripe().catch(() => true)
        : await getSupabaseReachable().catch(() => true);
      if (!reachable) {
        setLoading(false);
        console.warn('[useAuth] Supabase unreachable (health check); skipping hydrate.');
        if (typeof window !== 'undefined' && !(window as any).__stoodioz_timeout_alert_shown) {
          (window as any).__stoodioz_timeout_alert_shown = true;
          alert(
            "Can't reach Supabase (health check failed).\n\n" +
              '• Check .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) and network.\n\n' +
              '• If using free tier: supabase.com/dashboard → your project → Restore if paused.\n\n' +
              'Then refresh the page.'
          );
        }
        return;
      }

      // Light-touch: attempt hydration; if it fails, do nothing (avoid loops)
      try {
        loginInFlightRef.current = true;
        const hydrated = await hydrateFromUid(uid);
        commitLogin(hydrated);
        // Return from Stripe: go to the dashboard we saved before reload
        try {
          const savedView = typeof window !== 'undefined' && sessionStorage.getItem('stripe_return_view');
          if (savedView) {
            sessionStorage.removeItem('stripe_return_view');
            sessionStorage.removeItem('stripe_return_pending');
            navigate(savedView as AppView);
          }
        } catch (_) {}
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[useAuth] auth state hydrate skipped:', e);
        const fromStripeReturn =
          typeof window !== 'undefined' &&
          (sessionStorage.getItem('stripe_return_pending') || sessionStorage.getItem('stripe_return_in_progress'));
        // Do NOT clear stripe_return_view / stripe_return_pending when hydrate fails on Stripe return.
        // The post-reload wallet-poll effect in App needs them to restore dashboard + wallet/financials tab.
        if (typeof window !== 'undefined' && sessionStorage.getItem('stripe_return_pending') && !fromStripeReturn) {
          try {
            sessionStorage.removeItem('stripe_return_pending');
            sessionStorage.removeItem('stripe_return_view');
          } catch (_) {}
        }
        if (msg.includes('timeout') || msg.includes('exceeded')) {
          if (fromStripeReturn) {
            console.warn('[useAuth] Hydrate timed out after Stripe return; skipping alert. Refresh the page to see your balance.');
          } else {
            console.warn('[useAuth] Tip: Check .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), network, and that your Supabase project is not paused.');
          }
          if (!fromStripeReturn && typeof window !== 'undefined' && !(window as any).__stoodioz_timeout_alert_shown) {
            (window as any).__stoodioz_timeout_alert_shown = true;
            // If error says "18000ms", the browser is running an old cached bundle — tell user exactly what to do
            if (msg.includes('18000')) {
              alert(
                "You're running an OLD CACHED version of the app (timeouts are still 18s).\n\n" +
                '1) HARD REFRESH: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac).\n\n' +
                '2) If you use npm run dev: STOP the dev server, run "npm run dev" again, then hard refresh.\n\n' +
                '3) Or clear this site\'s data (Site settings → Clear data), then reload.\n\n' +
                '4) If this is a deployed site: redeploy so the server serves the new build.'
              );
            } else {
              alert(
                'Connection to the server timed out. This usually means:\n\n' +
                '• Your Supabase project is PAUSED (free tier pauses after inactivity).\n' +
                '  → Go to supabase.com/dashboard → your project → Settings → General → Restore project.\n\n' +
                '• Or check your internet and .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).\n\n' +
                'After restoring the project, refresh the page and try again.'
              );
            }
          }
        }
      } finally {
        loginInFlightRef.current = false;
      }
    });

    return () => {
      sub?.subscription?.unsubscribe?.();
    };
  }, [commitLogin, hydrateFromUid, navigate]);

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
