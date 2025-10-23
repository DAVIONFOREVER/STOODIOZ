import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Artist, Engineer, Stoodio, Producer } from '../types';

export const useProfile = () => {
    const dispatch = useAppDispatch();
    const { currentUser, artists, engineers, producers, stoodioz } = useAppState();
    const [isSaved, setIsSaved] = useState(false);
    
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const updateProfile = async (updates: Partial<Artist | Engineer | Stoodio | Producer>) => {
        if (!currentUser) return;
        try {
            const updatedUserPartial = await apiService.updateUser(currentUser.id, updates);
            if (updatedUserPartial) {
                const updatedUsers = allUsers.map(u => u.id === updatedUserPartial.id ? { ...u, ...updatedUserPartial } : u);
                dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as (Artist | Engineer | Stoodio | Producer)[] } });
                setIsSaved(true);
            }
        } catch (error) {
            console.error("Failed to update profile:", error);
        }
    };

    useEffect(() => {
        if (isSaved) {
            const timer = setTimeout(() => setIsSaved(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isSaved]);

    const verificationSubmit = useCallback(async (stoodioId: string, data: { googleBusinessProfileUrl: string; websiteUrl: string }) => {
        try {
            const updatedStoodioPartial = await apiService.submitForVerification(stoodioId, data);
            const updatedUsers = allUsers.map(u => u.id === stoodioId ? { ...u, ...updatedStoodioPartial } : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as (Artist | Engineer | Stoodio | Producer)[] } });

            // Simulate the admin approval delay
            setTimeout(async () => {
                const finalStoodio = await apiService.approveVerification(stoodioId);
                const finalUsers = updatedUsers.map(u => u.id === stoodioId ? { ...u, ...finalStoodio } : u);
                dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: finalUsers as (Artist | Engineer | Stoodio | Producer)[] } });
            }, 4000);
        } catch (error) {
            console.error("Verification submission failed:", error);
        }
    }, [allUsers, dispatch]);
    
    return { updateProfile, verificationSubmit, isSaved };
};