import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole } from '../types';
import { getSupabase } from '../lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        const supabase = getSupabase();
        if (!supabase) {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Authentication service is not available." } });
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
        } else {
            // The onAuthStateChange listener in AppContext will handle the success case.
            if ('Notification' in window && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }, [dispatch]);

    const logout = useCallback(async () => {
        const supabase = getSupabase();
        if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error logging out:", error.message);
            }
        }
        // The onAuthStateChange listener will dispatch the LOGOUT action automatically.
    }, []);

    const selectRoleToSetup = useCallback((role: UserRole) => {
        if (role === 'ARTIST') navigate(AppView.ARTIST_SETUP);
        else if (role === 'STOODIO') navigate(AppView.STOODIO_SETUP);
        else if (role === 'ENGINEER') navigate(AppView.ENGINEER_SETUP);
        else if (role === 'PRODUCER') navigate(AppView.PRODUCER_SETUP);
    }, [navigate]);
    
    const completeSetup = async (userData: any, role: UserRole) => {
        try {
            const newUser = await apiService.createUser(userData, role);
            if (newUser) {
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser, role } });
            } else {
                // Handle user creation failure
                console.error("User creation failed");
            }
        } catch(error) {
            console.error("Setup completion error:", error);
        }
    };

    return { login, logout, selectRoleToSetup, completeSetup };
};
