
import { useState, useEffect } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Label, LabelMember } from '../types';
import { UserRole, AppView } from '../types';

export const useLabel = (navigate: (view: AppView) => void) => {
    const { currentUser, userRole } = useAppState();
    const dispatch = useAppDispatch();
    const [labelProfile, setLabelProfile] = useState<Label | null>(null);
    const [memberRole, setMemberRole] = useState<'owner' | 'anr' | 'assistant' | 'finance' | null>(null);
    const [isLoadingLabel, setIsLoadingLabel] = useState(false);

    useEffect(() => {
        const loadLabelData = async () => {
            if (!currentUser) return;
            
            // Only attempt if role suggests potential label association
            // Note: The main auth logic might have already set UserRole.LABEL, 
            // but we double check here to hydrate specific label state.
            if (userRole === UserRole.LABEL || !userRole) {
                setIsLoadingLabel(true);
                try {
                    const result = await apiService.fetchLabelProfile(currentUser.id);
                    if (result) {
                        setLabelProfile(result.label);
                        setMemberRole(result.role);
                        // Ensure app state reflects this is a label user
                        if (userRole !== UserRole.LABEL) {
                             // This might trigger a re-render/dispatch loop if not careful, 
                             // but is necessary if initial login didn't catch it.
                             // Ideally login handles this.
                        }
                    }
                } catch (error) {
                    console.error("Failed to load label profile", error);
                } finally {
                    setIsLoadingLabel(false);
                }
            }
        };

        loadLabelData();
    }, [currentUser, userRole]);

    const redirectToDashboard = () => {
        navigate(AppView.LABEL_DASHBOARD);
    };

    return {
        labelProfile,
        memberRole,
        isLoadingLabel,
        redirectToDashboard
    };
};
