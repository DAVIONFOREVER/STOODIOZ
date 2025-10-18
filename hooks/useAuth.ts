import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import type { Artist, Engineer, Stoodio, Producer, UserRole } from '../types';

export const useAuth = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();
    const { artists, engineers, producers, stoodioz } = useAppState();

    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const login = useCallback((email: string, password: string): void => {
        const user = allUsers.find(u => u.email === email && u.password === password);
        if (user) {
            dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: { user } });
            if ('Notification' in window && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        } else {
            dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Login failed. Try 'artist@stoodioz.com', etc., with password 'password'." } });
        }
    }, [allUsers, dispatch]);

    const logout = useCallback(() => dispatch({ type: ActionTypes.LOGOUT }), [dispatch]);

    const selectRoleToSetup = useCallback((role: UserRole) => {
        if (role === 'ARTIST') navigate('ARTIST_SETUP');
        else if (role === 'STOODIO') navigate('STOODIO_SETUP');
        else if (role === 'ENGINEER') navigate('ENGINEER_SETUP');
        else if (role === 'PRODUCER') navigate('PRODUCER_SETUP');
    }, [navigate]);
    
    const completeSetup = (newUser: Artist | Engineer | Stoodio | Producer, role: UserRole) => {
        dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser, role } });
    };

    return { login, logout, selectRoleToSetup, completeSetup };
};
