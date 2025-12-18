import { useState, useCallback } from 'react';
import * as apiService from '../services/apiService';
import { RosterMember, UserRole } from '../types';

export const useLabel = (labelId: string) => {
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRoster = useCallback(async () => {
        if (!labelId) return;
        setLoading(true);
        try {
            const data = await apiService.fetchLabelRoster(labelId);
            setRoster(data);
            setError(null);
        } catch (err: any) {
            console.error("Failed to fetch roster:", err);
            setError("Failed to load roster.");
        } finally {
            setLoading(false);
        }
    }, [labelId]);

    const importRoster = useCallback(async (rows: { name: string; email?: string; role: 'artist' | 'producer' | 'engineer' }[]) => {
        setLoading(true);
        try {
            const promises = rows.map(row => 
                apiService.createShadowProfile(
                    row.role.toUpperCase() as any,
                    labelId,
                    { name: row.name, email: row.email }
                )
            );
            
            await Promise.all(promises);
            await refreshRoster();
            
        } catch (err: any) {
            console.error("Import failed:", err);
            throw new Error("Failed to import roster. " + (err.message || ""));
        } finally {
            setLoading(false);
        }
    }, [labelId, refreshRoster]);

    return {
        roster,
        loading,
        error,
        refreshRoster,
        importRoster
    };
};
