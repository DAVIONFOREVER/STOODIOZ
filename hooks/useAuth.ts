
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
                'stoodioz': UserRoleEnum.STOODIO,
                'labels': UserRoleEnum.LABEL,
            };
            
            // Prioritize finding specialized roles first. This fixes issues where a user might exist 
            // in multiple tables (rare but possible) or if the fallback logic was too broad.
            const tables = ['labels', 'stoodioz', 'producers', 'engineers', 'artists'];
            
            let userProfile: Artist | Engineer | Stoodio | Producer | any | null = null;
            let detectedRole: UserRole | undefined;
    
            for (const table of tables) {
                // Adjust select query based on table for relational data
                let selectQuery = '*';
                if (table === 'stoodioz') selectQuery = '*, rooms(*), in_house_engineers(*)';
                if (table === 'engineers') selectQuery = '*, mixing_samples(*)';
                if (table === 'producers') selectQuery = '*, instrumentals(*)';
                if (table === 'labels') selectQuery = '*';

                let { data: profileData, error: profileError } = await supabase
                    .from(table)
                    .select(selectQuery)
                    .eq(table === 'labels' ? 'id' : 'email', table === 'labels' ? data.user.id : email) // Labels use ID check primarily
                    .limit(1);

                // Special case for Label Team Members who log in but aren't in 'labels' table directly
                if (table === 'labels' && (!profileData || profileData.length === 0)) {
                     const { data: memberData } = await supabase
                        .from('label_team_members')
                        .select('label_id, labels(*)')
                        .eq('user_id', data.user.id)
                        .maybeSingle();
                     
                     if (memberData && memberData.labels) {
                         profileData = [memberData.labels];
                     }
                } else if (profileError && table !== 'labels') {
                    // Fallback for non-label tables if complex query fails
                    const retry = await supabase
                        .from(table)
                        .select('*')
                        .eq('email', email)
                        .limit(1);
                    profileData = retry.data;
                    profileError = retry.error;
                }

                if (profileData && profileData.length > 0) {
                    userProfile = profileData[0];
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
                else if (detectedRole === UserRoleEnum.LABEL) navigate(AppView.LABEL_DASHBOARD);

            } else {
                console.warn(`Login successful, but no profile found for ${email}. Routing to profile setup.`);
                navigate(AppView.CHOOSE_PROFILE);
            }
        } else {
             dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "An unknown error occurred during login." } });
        }
    }, [dispatch, navigate]);

    const logout = useCallback(async () => {
        navigate(AppView.LANDING_PAGE);
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
        // Note: Label setup usually done via admin or specialized flow, not standard signup yet
    }, [navigate]);
    
    const completeSetup = async (userData: any, role: UserRole) => {
        try {
            const result = await apiService.createUser(userData, role);
            if (result && 'email_confirmation_required' in result) {
                alert("Account created! Please check your email to verify.");
                navigate(AppView.LOGIN);
                return;
            }
            if (result) {
                const newUser = result as Artist | Engineer | Stoodio | Producer;
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser, role } });
                
                if (role === UserRoleEnum.ARTIST) navigate(AppView.ARTIST_DASHBOARD);
                else if (role === UserRoleEnum.ENGINEER) navigate(AppView.ENGINEER_DASHBOARD);
                else if (role === UserRoleEnum.PRODUCER) navigate(AppView.PRODUCER_DASHBOARD);
                else if (role === UserRoleEnum.STOODIO) navigate(AppView.STOODIO_DASHBOARD);
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
