import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole } from '../types';
import { getSupabase, performLogout } from '../lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
  const dispatch = useAppDispatch();

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      console.log('[LOGIN CLICKED]', email); // 🔍 hard proof button fires

      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
      dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });

      try {
        const client = getSupabase(); // ✅ REAL CLIENT (NOT NULL)

        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          dispatch({
            type: ActionTypes.LOGIN_FAILURE,
            payload: { error: error.message },
          });
          return;
        }

        // SUCCESS:
        // Navigation + hydration handled by auth listener in App.tsx
      } catch (err: any) {
        dispatch({
          type: ActionTypes.LOGIN_FAILURE,
          payload: { error: err?.message || 'Login failed.' },
        });
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

    dispatch({ type: ActionTypes.LOGOUT });

    await performLogout();

    window.location.replace('/login');
  }, [dispatch]);

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

  const completeSetup = async (userData: any, role: UserRole) => {
    try {
      const result = await apiService.createUser(userData, role);

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
      alert(`Signup failed: ${error.message}`);
    }
  };

  return { login, logout, selectRoleToSetup, completeSetup };
};
