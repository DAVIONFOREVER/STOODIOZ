
import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { UserRole as UserRoleEnum } from '../types';
import { getSupabase } from '../lib/supabase';

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
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

        const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
        const tryOrSilence = async <T>(p: Promise<T>) => {
            try { return await Promise.race([p, timeout(2500)]); }
            catch { /* ignore */ }
        };

        const supabase = getSupabase();
  
        // 1) Stop Realtime immediately
        if (supabase) {
            await tryOrSilence(Promise.resolve().then(() => supabase.realtime.disconnect()));
        }
        
        // 2) Server-side revoke of refresh sessions (fast-return)
        // Note: This endpoint must exist on your Supabase Edge Functions for this to work effectively.
        // If it doesn't exist, tryOrSilence will catch the 404/error and proceed.
        if (supabase) {
            try {
                 const { data } = await supabase.auth.getSession();
                 if (data.session?.access_token) {
                    await tryOrSilence(fetch('/functions/v1/force-logout', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { Authorization: `Bearer ${data.session.access_token}` }
                    }));
                 }
            } catch { /* ignore */ }
        }
        
        // 3) Local sign out
        if (supabase) {
            await tryOrSilence(supabase.auth.signOut());
        }
        
        // 4) Clear all app/browser caches safely
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch {}
        
        try {
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
            }
        } catch {}
        
        try {
            // Clear IndexedDB (optional, but good hygiene if you cache data)
            if ('indexedDB' in window) {
                const dbs = await (indexedDB as any).databases?.() || [];
                await Promise.all(
                    dbs.map((d: any) => d?.name && new Promise<void>((res) => {
                        const req = indexedDB.deleteDatabase(d.name);
                        req.onsuccess = req.onerror = req.onblocked = () => res();
                    }))
                );
            }
        } catch {}
        
        // 5. Reset Global State
        dispatch({ type: ActionTypes.LOGOUT });
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });

        // 6) Hard redirect to login (no spinner)
        // We use window.location.replace to clear history stack and ensure a fresh load
        window.location.replace('/');

    }, [dispatch]);

    const selectRoleToSetup = useCallback(async (role: UserRole) => {
        // Simple navigation. Do NOT attempt to check auth status here, 
        // as the user is likely creating a NEW account.
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
                alert("Account created! Please check your email to verify your account before logging in.");
                navigate(AppView.LOGIN);
                return;
            }

            if (result) {
                const newUser = result as Artist | Engineer | Stoodio | Producer | Label;
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser, role } });
                
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
