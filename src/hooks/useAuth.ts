import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole } from '../types';
import { getSupabase } from '../lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
  const dispatch = useAppDispatch();

  // =========================
  // LOGIN
  // =========================
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
      dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });

      try {
        const s = getSupabase();
        const { error } = await s.auth.signInWithPassword({ email, password });
const s = getSupabase();
const { data } = await s.auth.getUser();

await fetch('/api/bootstrap-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: data.user.id,
    email: data.user.email,
    full_name: data.user.user_metadata?.full_name || '',
    role: data.user.user_metadata?.user_role || 'ARTIST',
    image_url: null,
  }),
});

        if (error) {
          dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
        }
        // App.tsx auth listener handles hydration/navigation
      } catch (e: any) {
        dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: e?.message || 'Login failed.' } });
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
    },
    [dispatch]
  );

  // =========================
  // LOGOUT
  // =========================
  const logout = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

    try {
      const s = getSupabase();
      await s.auth.signOut({ scope: 'global' });
    } catch (e) {
      // even if signOut fails, clear local app state
      console.error('[logout] signOut failed:', e);
    } finally {
      dispatch({ type: ActionTypes.LOGOUT });
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      // Hard reset so any cached state/session artifacts are gone
      window.location.href = '/';
    }
  }, [dispatch]);

  // =========================
  // ROLE SELECTION
  // =========================
  const selectRoleToSetup = useCallback(
    (role: UserRole) => {
      if (role === 'ARTIST') navigate(AppView.ARTIST_SETUP);
      else if (role === 'STOODIO') navigate(AppView.STOODIO_SETUP);
      else if (role === 'ENGINEER') navigate(AppView.ENGINEER_SETUP);
      else if (role === 'PRODUCER') navigate(AppView.PRODUCER_SETUP);
      else if (role === 'LABEL') navigate(AppView.LABEL_SETUP);
    },
    [navigate]
  );

  // =========================
  // COMPLETE SETUP
  // =========================
  const completeSetup = useCallback(
    async (userData: any, role: UserRole) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
      try {
        const result: any = await apiService.createUser(userData, role);

        if (result && 'email_confirmation_required' in result) {
          alert('Please verify your email.');
          navigate(AppView.LOGIN);
          return;
        }

        if (result) {
          dispatch({
            type: ActionTypes.COMPLETE_SETUP,
            payload: { newUser: result as any, role },
          });
        }
      } catch (error: any) {
        alert(`Signup failed: ${error?.message || 'Unknown error'}`);
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
    },
    [dispatch, navigate]
  );

  return { login, logout, selectRoleToSetup, completeSetup };
};
