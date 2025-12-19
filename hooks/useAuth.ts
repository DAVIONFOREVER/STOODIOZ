import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { UserRole as UserRoleEnum } from '../types';
import { getSupabase, performLogout, supabase } from '../lib/supabase';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: null } });

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: error.message } });
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            return;
        }

        if (data.session && data.session.user) {
            const user = data.session.user;
            const result = await apiService.fetchCurrentUserProfile(user.id);

            if (result) {
                dispatch({
                    type: ActionTypes.LOGIN_SUCCESS,
                    payload: { user: result.user, role: result.role }
                });
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            } else {
                dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Profile not found. Please complete setup." } });
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
                navigate(AppView.CHOOSE_PROFILE);
            }
        } else {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Session not established." } });
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }
    }, [dispatch, navigate]);

    const logout = useCallback(async () => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        dispatch({ type: ActionTypes.LOGOUT });
        await performLogout();
        navigate(AppView.LANDING_PAGE);
    }, [dispatch, navigate]);

    const selectRoleToSetup = useCallback(async (role: UserRole) => {
        if (role === UserRoleEnum.ARTIST) navigate(AppView.ARTIST_SETUP);
        else if (role === UserRoleEnum.STOODIO) navigate(AppView.STOODIO_SETUP);
        else if (role === UserRoleEnum.ENGINEER) navigate(AppView.ENGINEER_SETUP);
        else if (role === UserRoleEnum.PRODUCER) navigate(AppView.PRODUCER_SETUP);
        else if (role === UserRoleEnum.LABEL) navigate(AppView.LABEL_SETUP);
    }, [navigate]);
    
    return { login, logout, selectRoleToSetup };
};