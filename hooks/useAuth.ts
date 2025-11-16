
import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole, Artist, Engineer, Stoodio, Producer } from '../types';
import { supabase } from '../src/supabaseClient.js';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
    
        if (error) {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
            return;
        }
    
        // Login successful → find user profile, set user & navigate via dispatch
        if (data.user) {
            const tables = ['artists', 'engineers', 'producers', 'stoodioz'];
            let userProfile: Artist | Engineer | Stoodio | Producer | null = null;
    
            for (const table of tables) {
                // Adjust select query based on table for relational data
                let selectQuery = '*';
                if (table === 'stoodioz') selectQuery = '*, rooms(*), in_house_engineers(*)';
                if (table === 'engineers') selectQuery = '*, mixing_samples(*)';
                if (table === 'producers') selectQuery = '*, instrumentals(*)';

                const { data: profileData, error: profileError } = await supabase
                    .from(table)
                    .select(selectQuery)
                    .eq('email', email)
                    .limit(1);

                if (profileError) {
                    console.error(`Error finding user profile in ${table}:`, profileError);
                    continue;
                }

                if (profileData && profileData.length > 0) {
                    // FIX: Cast to 'unknown' first to handle potential type mismatch from Supabase, resolving the 'GenericStringError' conversion issue.
                    userProfile = profileData[0] as unknown as Artist | Engineer | Stoodio | Producer;
                    break;
                }
            }
    
            if (userProfile) {
                dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: { user: userProfile } });
                if ('Notification' in window && Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }
            } else {
                dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Authentication successful, but no user profile was found. Please contact support." } });
                await supabase.auth.signOut();
            }
        } else {
             dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "An unknown error occurred during login." } });
        }
    }, [dispatch]);

    const logout = useCallback(() => dispatch({ type: ActionTypes.LOGOUT }), [dispatch]);

    const selectRoleToSetup = useCallback((role: UserRole) => {
        if (role === 'ARTIST') navigate(AppView.ARTIST_SETUP);
        else if (role === 'STOODIO') navigate(AppView.STOODIO_SETUP);
        else if (role === 'ENGINEER') navigate(AppView.ENGINEER_SETUP);
        else if (role === 'PRODUCER') navigate(AppView.PRODUCER_SETUP);
    }, [navigate]);
    
    const completeSetup = async (userData: any, role: UserRole) => {
        try {
            // FIX: Removing explicit type annotation to allow TypeScript's inference to work correctly, which resolves the complex conversion error.
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