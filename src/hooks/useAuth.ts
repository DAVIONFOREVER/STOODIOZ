
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

        const { data, error } = await (supabase.auth as any).signInWithPassword({
            email,
            password,
        });
    
        if (error) {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
            return;
        }
    
        // Login successful → find user profile, set user & navigate via dispatch
        if (data.user) {
            const userId = data.user.id; 
            
            // Check Label Table First (Optimization)
            const { data: profileRole } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (profileRole?.role === 'LABEL') {
                const { data: labelProfile } = await supabase
                    .from('labels')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (labelProfile) {
                    dispatch({
                        type: ActionTypes.LOGIN_SUCCESS,
                        payload: { user: labelProfile, role: UserRoleEnum.LABEL }
                    });
                    // Note: Navigation is handled by the App component reacting to state, 
                    // or explicitly here if needed, but App state takes precedence.
                    return;
                }
            }
            
            const roleMap: Record<string, UserRole> = {
                'artists': UserRoleEnum.ARTIST,
                'engineers': UserRoleEnum.ENGINEER,
                'producers': UserRoleEnum.PRODUCER,
                'stoodioz': UserRoleEnum.STOODIO,
                'labels': UserRoleEnum.LABEL
            };
            
            const tables = ['stoodioz', 'producers', 'engineers', 'artists', 'labels'];
            
            let userProfile: Artist | Engineer | Stoodio | Producer | Label | null = null;
            let detectedRole: UserRole | undefined;
    
            for (const table of tables) {
                let selectQuery = '*';
                if (table === 'stoodioz') selectQuery = '*, rooms(*), in_house_engineers(*)';
                if (table === 'engineers') selectQuery = '*, mixing_samples(*)';
                if (table === 'producers') selectQuery = '*, instrumentals(*)';

                let { data: profileData, error: profileError } = await supabase
                    .from(table)
                    .select(selectQuery)
                    .eq('id', userId)
                    .maybeSingle();

                if (profileError) {
                    // Retry basic
                    const retry = await supabase.from(table).select('*').eq('id', userId).maybeSingle();
                    profileData = retry.data;
                }

                if (profileData) {
                    userProfile = profileData as unknown as Artist | Engineer | Stoodio | Producer | Label;
                    detectedRole = roleMap[table];
                    break; 
                }
            }
    
            if (userProfile && detectedRole) {
                dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: { user: userProfile, role: detectedRole } });
                if ('Notification' in window && Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }
            } else {
                dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Profile not found. Please contact support." } });
            }
        } else {
             dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "An unknown error occurred during login." } });
        }
    }, [dispatch, navigate]);

    const logout = useCallback(async () => {
        // 1. Clear state immediately
        dispatch({ type: ActionTypes.LOGOUT });
        
        // 2. Navigate away
        navigate(AppView.LANDING_PAGE);

        // 3. Simple Supabase Sign Out (Reverted from complex performLogout)
        const supabase = getSupabase();
        if (supabase) {
            await (supabase.auth as any).signOut();
        }
    }, [dispatch, navigate]);

    const selectRoleToSetup = useCallback(async (role: UserRole) => {
        if (role === 'ARTIST') navigate(AppView.ARTIST_SETUP);
        else if (role === 'STOODIO') navigate(AppView.STOODIO_SETUP);
        else if (role === 'ENGINEER') navigate(AppView.ENGINEER_SETUP);
        else if (role === 'PRODUCER') navigate(AppView.PRODUCER_SETUP);
        else if (role === 'LABEL') {
            const supabase = getSupabase();
            const authUser = await (supabase as any).auth.getUser();

            if (authUser?.data?.user?.id) {
                await (supabase as any)
                    .from('profiles')
                    .update({ role: 'LABEL' })
                    .eq('id', authUser.data.user.id);
            }

            navigate(AppView.LABEL_SETUP);
        }
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
                const newUser = result as Artist | Engineer | Stoodio | Producer | Label;
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser, role } });
                // Note: Persistence logic in App.tsx will handle routing, or explicit navigation here:
                 if (role === UserRoleEnum.ARTIST) navigate(AppView.ARTIST_DASHBOARD);
                else if (role === UserRoleEnum.ENGINEER) navigate(AppView.ENGINEER_DASHBOARD);
                else if (role === UserRoleEnum.PRODUCER) navigate(AppView.PRODUCER_DASHBOARD);
                else if (role === UserRoleEnum.STOODIO) navigate(AppView.STOODIO_DASHBOARD);
                else if (role === UserRoleEnum.LABEL) navigate(AppView.LABEL_DASHBOARD);
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
