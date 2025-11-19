
import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
// FIX: Import missing Stoodio type
import type { UserRole, Artist, Engineer, Stoodio, Producer } from '../types';
import { UserRole as UserRoleEnum } from '../types';
import { getSupabase } from '../lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });

        const supabase = getSupabase();
        if (!supabase) {
             dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Database connection failed." } });
             return;
        }

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
            const roleMap: Record<string, UserRole> = {
                'artists': UserRoleEnum.ARTIST,
                'engineers': UserRoleEnum.ENGINEER,
                'producers': UserRoleEnum.PRODUCER,
                'stoodioz': UserRoleEnum.STOODIO
            };
            
            // Prioritize finding specialized roles first. This fixes issues where a user might exist 
            // in multiple tables (rare but possible) or if the fallback logic was too broad.
            const tables = ['stoodioz', 'producers', 'engineers', 'artists'];
            
            let userProfile: Artist | Engineer | Stoodio | Producer | null = null;
            let detectedRole: UserRole | undefined;
    
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
                    // FIX: Cast to 'unknown' first to handle potential type mismatch from Supabase.
                    userProfile = profileData[0] as unknown as Artist | Engineer | Stoodio | Producer;
                    detectedRole = roleMap[table];
                    break; // Stop searching once found
                }
            }
    
            if (userProfile && detectedRole) {
                dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: { user: userProfile, role: detectedRole } });
                if ('Notification' in window && Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }
                // Explicitly navigate based on detected role
                if (detectedRole === UserRoleEnum.ARTIST) navigate(AppView.ARTIST_DASHBOARD);
                else if (detectedRole === UserRoleEnum.ENGINEER) navigate(AppView.ENGINEER_DASHBOARD);
                else if (detectedRole === UserRoleEnum.PRODUCER) navigate(AppView.PRODUCER_DASHBOARD);
                else if (detectedRole === UserRoleEnum.STOODIO) navigate(AppView.STOODIO_DASHBOARD);

            } else {
                console.warn(`Login successful, but no profile found for ${email}. Routing to profile setup.`);
                navigate(AppView.CHOOSE_PROFILE);
            }
        } else {
             dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "An unknown error occurred during login." } });
        }
    }, [dispatch, navigate]);

    const logout = useCallback(async () => {
        // FIX: Navigate away FIRST to unmount dashboard components that might depend on currentUser.
        // This prevents "white screen" crashes where the UI tries to render data that just got deleted.
        navigate(AppView.LANDING_PAGE);

        // Use a small timeout to ensure the navigation has processed and components unmounted
        setTimeout(async () => {
            try {
                const supabase = getSupabase();
                if (supabase) await supabase.auth.signOut();
            } catch (e) {
                console.warn("Supabase signout error (ignoring):", e);
            }
            
            dispatch({ type: ActionTypes.LOGOUT });
        }, 100);
    }, [dispatch, navigate]);

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
                // Supabase automatically signs the user in after signUp,
                // so we just need to update the application state.
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser, role } });
            } else {
                alert("An unknown error occurred during signup.");
            }
        } catch(error: any) {
            console.error("Setup completion error:", error);
            alert(`Signup failed: ${error.message}`);
        }
    };

    return { login, logout, selectRoleToSetup, completeSetup };
};
