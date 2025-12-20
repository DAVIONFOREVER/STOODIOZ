import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { UserRole as UserRoleEnum } from '../types';
import { getSupabase, performLogout, supabase } from '../lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        // Explicitly set loading for user interaction
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });

        try {
            const { error, data } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) {
                dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            } else if (data.user) {
                // Successful login: Navigate exactly once to The Stage
                navigate(AppView.THE_STAGE);
            }
        } catch (err: any) {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: err.message || "An unexpected error occurred." } });
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }
    }, [dispatch, navigate]);

    const logout = useCallback(async () => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        
        // 1. Wipe local state
        dispatch({ type: ActionTypes.LOGOUT });
        
        // 2. Perform hard logout (Storage, WS, Auth)
        await performLogout();
        
        // 3. Force clean URL
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
        try {
            const result = await apiService.createUser(userData, role);
            if (result && 'email_confirmation_required' in result) {
                alert("Please verify your email.");
                navigate(AppView.LOGIN);
                return;
            }
            if (result) {
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser: result as any, role } });
                navigate(AppView.THE_STAGE);
            }
        } catch(error: any) {
            alert(`Signup failed: ${error.message}`);
        }
    };

    return { login, logout, selectRoleToSetup, completeSetup };
};