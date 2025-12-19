import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole } from '../types';
import { supabase, performLogout } from '../lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            return;
        }

        if (data.session?.user) {
            const res = await apiService.fetchCurrentUserProfile(data.session.user.id);
            if (res) {
                // Success: Update state. login_success action in AppContext handles navigation internally.
                dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: res });
            } else {
                // Auth works, but no DB record
                navigate(AppView.CHOOSE_PROFILE);
            }
        }
        
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
    }, [dispatch, navigate]);

    const logout = useCallback(async () => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        await performLogout();
        dispatch({ type: ActionTypes.LOGOUT });
        navigate(AppView.LANDING_PAGE);
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
    }, [dispatch, navigate]);

    const selectRoleToSetup = useCallback(async (role: UserRole) => {
        if (role === 'ARTIST') navigate(AppView.ARTIST_SETUP);
        else if (role === 'STOODIO') navigate(AppView.STOODIO_SETUP);
        else if (role === 'ENGINEER') navigate(AppView.ENGINEER_SETUP);
        else if (role === 'PRODUCER') navigate(AppView.PRODUCER_SETUP);
        else if (role === 'LABEL') navigate(AppView.LABEL_SETUP);
    }, [navigate]);
    
    return { login, logout, selectRoleToSetup };
};