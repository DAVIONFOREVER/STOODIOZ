
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { getSupabase } from '../lib/supabase';
// FIX: Import missing Stoodio type
import type { Artist, Engineer, Stoodio, Producer, UserRole, Label } from '../types';

export const useProfile = () => {
    const dispatch = useAppDispatch();
    const { currentUser, artists, engineers, producers, stoodioz, labels, userRole } = useAppState();
    const [isSaved, setIsSaved] = useState(false);
    
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz, ...labels], [artists, engineers, producers, stoodioz, labels]);

    const getTableNameFromRole = (role: UserRole | null): string | null => {
        if (!role) return null;
        switch(role) {
            case 'ARTIST': return 'artists';
            case 'ENGINEER': return 'engineers';
            case 'PRODUCER': return 'producers';
            case 'STOODIO': return 'stoodioz';
            case 'LABEL': return 'labels';
            default: return null;
        }
    }

    const updateProfile = async (updates: Partial<Artist | Engineer | Stoodio | Producer | Label>) => {
        if (!currentUser || !userRole) return;
        try {
            const tableName = getTableNameFromRole(userRole);
            if (!tableName) return;

            const updatedUser = await apiService.updateUser(currentUser.id, tableName, updates);
            
            // To ensure relational data (like rooms, samples) isn't lost, merge the update
            // with the existing full object in the state.
            const fullUpdatedUser = { ...currentUser, ...updatedUser };

            const updatedUsers = allUsers.map(u => u.id === fullUpdatedUser.id ? fullUpdatedUser : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as (Artist | Engineer | Stoodio | Producer | Label)[] } });
            setIsSaved(true);
        } catch (error) {
            console.error("Failed to update profile:", error);
        }
    };

    const refreshCurrentUser = useCallback(async () => {
        if (!currentUser || !userRole) return;
        const supabase = getSupabase();
        if (!supabase) return;

        const tableName = getTableNameFromRole(userRole);
        if (!tableName) return;

        let selectQuery = '*';
        if (userRole === 'STOODIO') selectQuery = '*, rooms(*), in_house_engineers(*)';
        if (userRole === 'ENGINEER') selectQuery = '*, mixing_samples(*)';
        if (userRole === 'PRODUCER') selectQuery = '*, instrumentals(*)';

        try {
            const { data, error } = await supabase
                .from(tableName)
                .select(selectQuery)
                .eq('id', currentUser.id)
                .single();
            
            if (error) throw error;
            if (data) {
                // Cast to correct type and update
                const refreshedUser = data as unknown as Artist | Engineer | Stoodio | Producer | Label;
                // We also need to update this user in the larger lists (engineers, stoodioz, etc)
                const updatedUsers = allUsers.map(u => u.id === refreshedUser.id ? refreshedUser : u);
                
                dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
                // Explicitly set current user to ensure immediate reflection
                dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: refreshedUser } });
            }

        } catch (error) {
             console.error("Failed to refresh user profile:", error);
        }
    }, [currentUser, userRole, allUsers, dispatch]);

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
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as (Artist | Engineer | Stoodio | Producer | Label)[] } });
        } catch (error) {
            console.error("Verification submission failed:", error);
        }
    }, [allUsers, dispatch]);
    
    return { updateProfile, refreshCurrentUser, verificationSubmit, isSaved };
};
