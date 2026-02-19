import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AppView, UserRole } from '../types';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';
import { getSupabase } from '../lib/supabase';
import * as apiService from '../services/apiService';

interface LoginProps {
  onLogin: (email: string, password: string) => void | Promise<void>;
  error: string | null;
  onNavigate: (view: AppView) => void;
  isLoading?: boolean;
}

/**
 * This Login is intentionally "self-sufficient".
 * It does NOT rely on any other hook/file to hydrate the user after auth.
 *
 * Flow:
 * 1) onLogin(email, password) -> should sign in via supabase
 * 2) supabase.auth.getSession() -> confirm uid exists
 * 3) apiService.fetchCurrentUserProfile(uid) -> get { user, role }
 * 4) dispatch LOGIN_SUCCESS
 * 5) navigate to correct landing view
 */
const Login: React.FC<LoginProps> = ({ onLogin, error, onNavigate, isLoading = false }) => {
  const dispatch = useAppDispatch();
  const { currentUser, userRole } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // prevent double submit
  const inFlightRef = useRef(false);

  // local loading controls inputs/button (we do NOT trust global loading)
  const [localLoading, setLocalLoading] = useState(false);

  // show actionable errors that parent "error" might not capture
  const [localError, setLocalError] = useState<string | null>(null);

  // session detection (for resume button)
  const [hasSession, setHasSession] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const effectiveLoading = localLoading;

  const landingForRole = (role: UserRole) =>
    role === UserRole.LABEL ? AppView.LABEL_DASHBOARD : AppView.THE_STAGE;

  const setGlobalLoadingSafe = useCallback(
    (val: boolean) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: val } });
    },
    [dispatch]
  );

  const getSessionUid = useCallback(async (): Promise<string | null> => {
    try {
      const supabase = getSupabase();
      const { data, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) {
        console.error('[Login] getSession error:', sessErr);
        return null;
      }
      return data.session?.user?.id ?? null;
    } catch (e) {
      console.error('[Login] getSession threw:', e);
      return null;
    }
  }, []);

  const hydrateAndEnter = useCallback(
    async (uid: string) => {
      // This is the critical chain that actually "logs into the app"
      setGlobalLoadingSafe(true);

      let res: any = null;
      try {
        res = await apiService.fetchCurrentUserProfile(uid);
      } catch (e) {
        console.error('[Login] fetchCurrentUserProfile threw:', e);
        throw new Error(
          'Signed in, but failed to load your profile/role. This is a profile fetch error (not your password).'
        );
      }

      if (!res) {
        throw new Error(
          'Signed in, but your app could not load your profile/role. This usually means the profiles row is missing or RLS is blocking reads.'
        );
      }

      // Accept a few possible shapes so you don’t get bricked if you slightly changed apiService
      const roleRaw =
        (res.role as UserRole) ??
        (res.profile?.role as UserRole) ??
        (res.data?.role as UserRole) ??
        null;

      const userRaw = res.user ?? res.profile ?? res.data ?? res;

      if (!roleRaw) {
        console.error('[Login] Unexpected profile response shape:', res);
        throw new Error(
          'Signed in, but profile response did not include a role. Your fetchCurrentUserProfile() return shape is not what Login expects.'
        );
      }

      const role = roleRaw as UserRole;

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: { user: userRaw, role },
      });

      setGlobalLoadingSafe(false);
      const hasClaim = typeof window !== 'undefined' && (sessionStorage.getItem('pending_claim_token') || localStorage.getItem('pending_claim_token'));
      onNavigate(hasClaim ? AppView.CLAIM_CONFIRM : landingForRole(role));
    },
    [dispatch, onNavigate, setGlobalLoadingSafe]
  );

  // initial session sniff (for Resume Session)
  useEffect(() => {
    let alive = true;

    (async () => {
      const uid = await getSessionUid();
      if (!alive) return;
      setHasSession(Boolean(uid));
      setSessionUserId(uid);
    })();

    return () => {
      alive = false;
    };
  }, [getSessionUid]);

  // If global loading gets stuck while we're on login, force it off after 4s
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setGlobalLoadingSafe(false), 4000);
    return () => clearTimeout(t);
  }, [isLoading, setGlobalLoadingSafe]);

  const resumeSession = useCallback(async () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLocalLoading(true);
    setLocalError(null);

    try {
      const uid = await getSessionUid();
      if (!uid) {
        setHasSession(false);
        setSessionUserId(null);
        throw new Error('No active session found to resume.');
      }

      setHasSession(true);
      setSessionUserId(uid);

      await hydrateAndEnter(uid);
    } catch (e: any) {
      console.error('[resumeSession] failed:', e);
      setGlobalLoadingSafe(false);
      setLocalError(e?.message || 'Resume session failed.');
    } finally {
      setLocalLoading(false);
      inFlightRef.current = false;
    }
  }, [getSessionUid, hydrateAndEnter, setGlobalLoadingSafe]);

  const forceUnlock = useCallback(() => {
    // Emergency escape hatch: never let a spinner strand you
    setGlobalLoadingSafe(false);

    if (userRole) onNavigate(landingForRole(userRole));
    else onNavigate(AppView.LANDING_PAGE);
  }, [onNavigate, setGlobalLoadingSafe, userRole]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setLocalLoading(true);
      setLocalError(null);

      try {
        // 1) Perform auth via existing handler
        await Promise.resolve(onLogin(email.trim(), password.trim()));

        // 2) Confirm session exists right now
        const uid = await getSessionUid();
        if (!uid) {
          throw new Error(
            'Login did not create a session. If your credentials are correct, check: email confirmation, auth provider settings, or onLogin() implementation.'
          );
        }

        setHasSession(true);
        setSessionUserId(uid);

        // 3) Hydrate app user + navigate (THIS is the part that was missing in most broken versions)
        await hydrateAndEnter(uid);
      } catch (e: any) {
        console.error('[handleSubmit] failed:', e);
        setGlobalLoadingSafe(false);
        const msg = e?.message || 'Login failed.';
        const isInvalidCreds = /invalid login credentials/i.test(msg) || (e?.name === 'AuthApiError' && e?.status === 400);
        setLocalError(isInvalidCreds
          ? 'Invalid email or password. If you just signed up, check your inbox to confirm your email first.'
          : msg);
      } finally {
        setLocalLoading(false);
        inFlightRef.current = false;
      }
    },
    [email, password, getSessionUid, hydrateAndEnter, onLogin, setGlobalLoadingSafe]
  );

  const showResume = useMemo(() => {
    // show resume if supabase has a session but app state is missing OR mismatched
    if (!hasSession) return false;
    if (!currentUser) return true;

    const currentId =
      (currentUser as any)?.id ?? (currentUser as any)?.user?.id ?? (currentUser as any)?.profile_id ?? null;

    if (sessionUserId && currentId && currentId !== sessionUserId) return true;

    return false;
  }, [hasSession, currentUser, sessionUserId]);

  const combinedError = localError || error;

  return (
    <div className="max-w-md mx-auto p-8 mt-16 cardSurface">
      <h1 className="text-4xl font-extrabold text-center mb-2 text-slate-100">Welcome Back</h1>
      <p className="text-center text-slate-400 mb-6">Log in to your Stoodioz account.</p>

      {/* Resume Session block */}
      {showResume && (
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
          <div className="text-slate-200 font-semibold">You already have an active session.</div>
          <div className="text-slate-400 text-sm mt-1">
            If you got kicked to Landing/Login by accident, resume instantly.
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resumeSession}
              disabled={effectiveLoading}
              className="shrink-0 bg-orange-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Resume Session
            </button>
            <button
              type="button"
              onClick={forceUnlock}
              className="shrink-0 px-4 py-2.5 rounded-lg bg-zinc-800 text-slate-200 font-semibold hover:bg-zinc-700"
              disabled={effectiveLoading}
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      {combinedError && (
        <div
          className={`border p-4 rounded-lg mb-6 text-sm ${
            combinedError.toLowerCase().includes('email not confirmed')
              ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200'
              : 'bg-red-500/20 border-red-500/30 text-red-300'
          }`}
        >
          {combinedError.toLowerCase().includes('email not confirmed') ? (
            <div className="text-center">
              <strong className="block text-lg mb-1">Email Verification Required</strong>
              <p>Please check your inbox (and spam folder) for a confirmation link before logging in.</p>
            </div>
          ) : (
            <div className="text-center font-semibold">{combinedError}</div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={effectiveLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={effectiveLoading}
          />
        </div>

        <button
          type="submit"
          disabled={effectiveLoading}
          className="w-full sm:w-auto sm:min-w-[200px] bg-orange-500 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed inline-flex justify-center items-center gap-2"
        >
          {effectiveLoading ? 'Logging In…' : 'Log In'}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate(AppView.CHOOSE_PROFILE)}
            className="font-semibold text-orange-400 hover:underline"
            disabled={effectiveLoading}
          >
            Get Started
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
