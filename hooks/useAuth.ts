import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole, Artist, Engineer, Stoodio, Producer, Label } from '../types';
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
                // Success: The LOGIN_SUCCESS action in the reducer will handle calculating the correct view.
                dispatch({ 
                    type: ActionTypes.LOGIN_SUCCESS, 
                    payload: { user: result.user, role: result.role as UserRole } 
                });
            } else {
                // Auth works but no public.profiles row found
                navigate(AppView.CHOOSE_PROFILE);
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            }
        }
    }, [dispatch, navigate]);

    const logout = useCallback(async () => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        
        // Signal hard reset in state
        dispatch({ type: ActionTypes.LOGOUT });
        
        // Wipe storage and auth session
        await performLogout();
        
        // Force redirect to clean state
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