import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole } from '../types';
import { supabase } from '@/lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
  const dispatch = useAppDispatch();

  // =========================
  // LOGIN
  // =========================
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      // start spinner + clear error
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
      dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        dispatch({
          type: ActionTypes.LOGIN_FAILURE,
          payload: { error: error.message },
        });
        dispatch({
          type: ActionTypes.SET_LOADING,
          payload: { isLoading: false },
        });
        return;
      }

      // 🚫 DO NOT navigate
      // 🚫 DO NOT hydrate
      // App.tsx auth listener handles everything
    },
    [dispatch]
  );

  // =========================
  // LOGOUT
  // =========================
  const logout = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
    dispatch({ type: ActionTypes.LOGOUT });

    await supabase.auth.signOut();

    navigate(AppView.LOGIN);
  }, [dispatch, navigate]);

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
