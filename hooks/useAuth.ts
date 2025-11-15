import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { UserRole } from '../types';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        try {
            const user = await apiService.findUserByCredentials(email, password);
            if (user) {
                dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: { user } });
                if ('Notification' in window && Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }
            } else {
                dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Invalid email or password." } });
            }
        } catch (error) {
            console.error("Login error:", error);
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "An error occurred during login." } });
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
