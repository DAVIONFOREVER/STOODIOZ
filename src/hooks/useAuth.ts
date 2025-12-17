
import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { UserRole as UserRoleEnum } from '../types';
import { getSupabase, performLogout } from '../lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });

        const supabase = getSupabase();
        if (!supabase) {
             dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Database connection failed." } });
             dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
             return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
    
        if (error) {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            return;
        }
    
        if (data.user) {
            const result = await apiService.fetchCurrentUserProfile(data.user.id);
            if (result) {
                dispatch({ 
                    type: ActionTypes.LOGIN_SUCCESS, 
                    payload: { user: result.user, role: result.role } 
                });
            } else {
                dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Profile not found." } });
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            }
        }
    }, [dispatch]);

    const logout = useCallback(async () => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        
        // 1. Wipe local state
        dispatch({ type: ActionTypes.LOGOUT });
        
        // 2. Perform hard logout (Storage, WS, Auth)
        await performLogout();
        
        // 3. Force clean URL
        window.location.replace('/login');
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
            }
        } catch(error: any) {
            alert(`Signup failed: ${error.message}`);
        }
    };

    return { login, logout, selectRoleToSetup, completeSetup };
};
