
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
    dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });
    dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

    const supabase = getSupabase();
    if (!supabase) {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Database connection failed." } });
        return;
    }

    const { data, error } = await (supabase.auth as any).signInWithPassword({
        email,
        password,
    });

    if (error) {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
        return;
    }

    // Hydration handled by App.tsx onAuthStateChange()
}, [dispatch, navigate]);


    const logout = useCallback(async () => {
        // 1. Navigate to a safe, public view immediately to unmount protected components.
        navigate(AppView.LOGIN);

        // 2. Clear local state and session.
        // Use a short timeout to allow navigation to complete visually before state is wiped.
        setTimeout(async () => {
            try {
                const supabase = getSupabase();
                if (supabase) await (supabase.auth as any).signOut();
                
                // Clear any session/local storage if used for tokens (Supabase handles its own)
                localStorage.clear();
                sessionStorage.clear();

            } catch (e) {
                console.warn("Supabase signout error (ignoring):", e);
            }
            
            // 3. Dispatch the logout action to reset AppContext.
            dispatch({ type: ActionTypes.LOGOUT });
        }, 50); // 50ms delay is usually sufficient
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
