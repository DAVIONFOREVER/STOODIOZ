
import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
// FIX: Import missing Stoodio type
import type { UserRole, Artist, Engineer, Stoodio, Producer, Label } from '../types';
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
                'stoodioz': UserRoleEnum.STOODIO,
                'labels': UserRoleEnum.LABEL
            };
            
            // Prioritize finding specialized roles first. This fixes issues where a user might exist 
            // in multiple tables (rare but possible) or if the fallback logic was too broad.
            const tables = ['stoodioz', 'producers', 'engineers', 'artists', 'labels'];
            
            let userProfile: Artist | Engineer | Stoodio | Producer | Label | null = null;
            let detectedRole: UserRole | undefined;
    
            for (const table of tables) {
                // Adjust select query based on table for relational data
                let selectQuery = '*';
                if (table === 'stoodioz') selectQuery = '*, rooms(*), in_house_engineers(*)';
                if (table === 'engineers') selectQuery = '*, mixing_samples(*)';
                if (table === 'producers') selectQuery = '*, instrumentals(*)';

                let { data: profileData, error: profileError } = await supabase
                    .from(table)
                    .select(selectQuery)
                    .eq('id', data.user.id) // Use user ID, not email, for consistency
                    .limit(1);

                // FALLBACK: If the complex query fails (e.g. RLS on relation), try basic fetch
                if (profileError) {
                    console.warn(`Complex fetch failed for ${table}, retrying basic...`);
                    const retry = await supabase
                        .from(table)
                        .select('*')
                        .eq('id', data.user.id)
                        .limit(1);
                    profileData = retry.data;
                    profileError = retry.error;
                }

                if (profileError) {
                    // Ignore errors, just means user isn't in this table
                    continue;
                }

                if (profileData && profileData.length > 0) {
                    // FIX: Cast to 'unknown' first to handle potential type mismatch from Supabase.
                    userProfile = profileData[0] as unknown as Artist | Engineer | Stoodio | Producer | Label;
                    detectedRole = roleMap[table];
                    break; // Stop searching once found
                }
            }
    
            if (userProfile && detectedRole) {
                dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: { user: userProfile as any, role: detectedRole } });
                if ('Notification' in window && Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }
                // Explicitly navigate based on detected role
                if (detectedRole === UserRoleEnum.ARTIST) navigate(AppView.ARTIST_DASHBOARD);
                else if (detectedRole === UserRoleEnum.ENGINEER) navigate(AppView.ENGINEER_DASHBOARD);
                else if (detectedRole === UserRoleEnum.PRODUCER) navigate(AppView.PRODUCER_DASHBOARD);
                else if (detectedRole === UserRoleEnum.STOODIO) navigate(AppView.STOODIO_DASHBOARD);
                else if (detectedRole === UserRoleEnum.LABEL) {
                    // Direct access to dashboard
                    navigate(AppView.LABEL_DASHBOARD);
                }

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
        if (role === UserRoleEnum.ARTIST) navigate(AppView.ARTIST_SETUP);
        else if (role === UserRoleEnum.STOODIO) navigate(AppView.STOODIO_SETUP);
        else if (role === UserRoleEnum.ENGINEER) navigate(AppView.ENGINEER_SETUP);
        else if (role === UserRoleEnum.PRODUCER) navigate(AppView.PRODUCER_SETUP);
        else if (role === UserRoleEnum.LABEL) navigate(AppView.LABEL_SETUP);
    }, [navigate]);
    
    const completeSetup = async (userData: any, role: UserRole) => {
        try {
            const result = await apiService.createUser(userData, role);
            
            if (result && 'email_confirmation_required' in result) {
                alert("Account created! Please check your email to verify your account before logging in.");
                navigate(AppView.LOGIN);
                return;
            }

            if (result) {
                // Supabase automatically signs the user in after signUp if no verification required,
                // so we just need to update the application state.
                const newUser = result as Artist | Engineer | Stoodio | Producer | Label;
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser: newUser as any, role } });
                
                // Force navigation based on role
                if (role === UserRoleEnum.ARTIST) navigate(AppView.ARTIST_DASHBOARD);
                else if (role === UserRoleEnum.ENGINEER) navigate(AppView.ENGINEER_DASHBOARD);
                else if (role === UserRoleEnum.PRODUCER) navigate(AppView.PRODUCER_DASHBOARD);
                else if (role === UserRoleEnum.STOODIO) navigate(AppView.STOODIO_DASHBOARD);
                else if (role === UserRoleEnum.LABEL) {
                    // Direct access to dashboard
                    navigate(AppView.LABEL_DASHBOARD);
                }
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
