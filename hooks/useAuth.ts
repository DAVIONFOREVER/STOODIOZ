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
            const userId = data.user.id; 
            
            // 1. Fetch exact role from profiles table (Source of Truth)
            const { data: profileRole } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (!profileRole) {
                dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Profile record missing." } });
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
                return;
            }

            const role = profileRole.role as UserRole;
            const roleTableMap: Record<UserRole, string> = {
                [UserRoleEnum.ARTIST]: 'artists',
                [UserRoleEnum.ENGINEER]: 'engineers',
                [UserRoleEnum.PRODUCER]: 'producers',
                [UserRoleEnum.STOODIO]: 'stoodioz',
                [UserRoleEnum.LABEL]: 'labels',
                [UserRoleEnum.VIDEOGRAPHER]: 'videographers'
            };

            const tableName = roleTableMap[role];
            
            // 2. Fetch full profile data from specialized table
            const { data: userData, error: userError } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', userId)
                .single();

            if (userError || !userData) {
                 dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Detailed profile data not found." } });
                 dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
                 return;
            }

            // 3. Dispatch success with explicit role and attached property
            dispatch({ 
                type: ActionTypes.LOGIN_SUCCESS, 
                payload: { 
                    user: { ...userData, role } as any, 
                    role 
                } 
            });

            if ('Notification' in window && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
            
        } else {
             dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "An unknown error occurred during login." } });
        }
    }, [dispatch, navigate]);

    const logout = useCallback(async () => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        
        // Wipe local state first
        dispatch({ type: ActionTypes.LOGOUT });
        
        // Perform hard logout (Storage, WS, Auth)
        await performLogout();
        
        // Force clean URL
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
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser: { ...result, role } as any, role } });
            }
        } catch(error: any) {
            console.error("Setup completion error:", error);
            alert(`Signup failed: ${error.message}`);
        }
    };

    return { login, logout, selectRoleToSetup, completeSetup };
};