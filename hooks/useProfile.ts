
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Artist, Engineer, Stoodio, Producer, UserRole } from '../types';

export const useProfile = () => {
    const dispatch = useAppDispatch();
    const { currentUser, artists, engineers, producers, stoodioz, userRole } = useAppState();
    const [isSaved, setIsSaved] = useState(false);
    
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const getTableNameFromRole = (role: UserRole | null): string | null => {
        if (!role) return null;
        switch(role) {
            case 'ARTIST': return 'artists';
            case 'ENGINEER': return 'engineers';
            case 'PRODUCER': return 'producers';
            case 'STOODIO': return 'stoodioz';
            default: return null;
        }
    }

    const updateProfile = async (updates: Partial<Artist | Engineer | Stoodio | Producer>) => {
        if (!currentUser || !userRole) return;
        try {
            const tableName = getTableNameFromRole(userRole);
            if (!tableName) return;

            const updatedUser = await apiService.updateUser(currentUser.id, tableName, updates);
            
            // To ensure relational data (like rooms, samples) isn't lost, merge the update
            // with the existing full object in the state.
            const fullUpdatedUser = { ...currentUser, ...updatedUser };

            const updatedUsers = allUsers.map(u => u.id === fullUpdatedUser.id ? fullUpdatedUser : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as (Artist | Engineer | Stoodio | Producer)[] } });
            setIsSaved(true);
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
        } catch (error) {
            console.error("Verification submission failed:", error);
        }
    }, [allUsers, dispatch]);
    
    return { updateProfile, verificationSubmit, isSaved };
};
