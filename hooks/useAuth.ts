import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole } from '../types';
import { getSupabase, performLogout, supabase } from '../lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });

        // useAuth only handles the sign-in request.
        // App.tsx's onAuthStateChange is the single source of truth for hydration.
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
    
        if (error) {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }
        // Success case intentionally does nothing here. 
        // supabase.auth.onAuthStateChange in App.tsx will catch the SIGNED_IN event.
    }, [dispatch]);

    const logout = useCallback(async () => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        dispatch({ type: ActionTypes.LOGOUT });
        await performLogout();
        window.location.replace('/');
    }, [dispatch]);

    const selectRoleToSetup = useCallback(async (role: UserRole) => {
        if (role === 'ARTIST') navigate(AppView.ARTIST_SETUP);
        else if (role === 'STOODIO') navigate(AppView.STOODIO_SETUP);
        else if (role === 'ENGINEER') navigate(AppView.ENGINEER_SETUP);
        else if (role === 'PRODUCER') navigate(AppView.PRODUCER_SETUP);
        else if (role === 'LABEL') navigate(AppView.LABEL_SETUP);
    }, [navigate]);
    
    const completeSetup = async (userData: any, role: UserRole) => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            const result = await apiService.createUser(userData, role);
            if (result) {
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser: result as any, role } });
            }
        } catch(error: any) {
            alert(`Signup failed: ${error.message}`);
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }
    };

    return { login, logout, selectRoleToSetup, completeSetup };
};