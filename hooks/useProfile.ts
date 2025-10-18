
import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import { VerificationStatus } from '../types';

export const useProfile = () => {
    const dispatch = useAppDispatch();
    // FIX: Get individual user arrays instead of non-existent `allUsers`.
    const { currentUser, stoodioz, artists, engineers, producers } = useAppState();
    
    const updateAllUserState = (updatedUsers: (Artist | Engineer | Stoodio | Producer)[]) => {
        dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
    };

    const updateProfile = (updates: Partial<Artist | Engineer | Stoodio | Producer>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updates };
        dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: updatedUser } });
        // FIX: Construct `allUsers` locally from state.
        const allUsers = [...artists, ...engineers, ...producers, ...stoodioz];
        const updatedUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        updateAllUserState(updatedUsers);
    };

    const verificationSubmit = useCallback(async (stoodioId: string, data: { googleBusinessProfileUrl: string; websiteUrl: string }) => {
        const { updatedStoodioz, temporaryStoodio } = await apiService.submitForVerification(stoodioId, data, stoodioz);
        dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: [ ...artists, ...engineers, ...producers, ...updatedStoodioz] }});
        if (currentUser?.id === stoodioId) dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: temporaryStoodio } });

        setTimeout(() => {
            const finalStoodioz = stoodioz.map(s => s.id === stoodioId ? { ...s, verificationStatus: VerificationStatus.VERIFIED } : s);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: [ ...artists, ...engineers, ...producers, ...finalStoodioz] }});
             if (currentUser?.id === stoodioId) {
                const finalUser = finalStoodioz.find(s => s.id === stoodioId);
                if (finalUser) dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: finalUser } });
             }
        }, 4000);
    }, [stoodioz, artists, engineers, producers, currentUser, dispatch]);
    
    return { updateProfile, verificationSubmit };
};
