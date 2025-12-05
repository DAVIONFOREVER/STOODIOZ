
import React, { useEffect, useState } from 'react';
import { AppView } from '../types';
import { useNavigation } from '../hooks/useNavigation';
import { useAppState } from '../contexts/AppContext';
import { claimProfileByToken, getClaimDetails } from '../services/apiService';
import { CheckCircleIcon, CloseIcon } from './icons';

const ClaimConfirmScreen: React.FC = () => {
    const { navigate } = useNavigation();
    const { currentUser } = useAppState();
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState<{ labelName: string; role: string } | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('pending_claim_token');
        if (!storedToken) {
            navigate(AppView.ARTIST_DASHBOARD); // Fallback
            return;
        }
        setToken(storedToken);

        // Fetch details for display
        getClaimDetails(storedToken).then(data => {
            if (data) setDetails(data);
        });
    }, []);

    const handleClaim = async () => {
        if (!currentUser || !token) return;
        setLoading(true);
        try {
            await claimProfileByToken(token, currentUser.id);
            localStorage.removeItem('pending_claim_token'); // Clean up
            alert(`Success! You have joined ${details?.labelName || 'the label'} roster.`);
            // Redirect to appropriate dashboard
            navigate(AppView.ARTIST_DASHBOARD); 
        } catch (error: any) {
            console.error("Claim failed:", error);
            alert(`Failed to claim profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        localStorage.removeItem('pending_claim_token');
        navigate(AppView.ARTIST_DASHBOARD);
    };

    if (!currentUser) return null; // Should be handled by parent logic

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="cardSurface max-w-md w-full p-8 animate-fade-in relative">
                <button onClick={handleCancel} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200">
                    <CloseIcon className="w-6 h-6" />
                </button>

                <div className="text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-10 h-10 text-green-500" />
                    </div>
                    
                    <h1 className="text-2xl font-bold text-zinc-100 mb-2">Confirm Roster Spot</h1>
                    <p className="text-zinc-400 mb-8">
                        You are about to link your account <strong>{currentUser.name}</strong> to <span className="text-white font-bold">{details?.labelName || 'the label'}</span> as a <span className="text-orange-400 font-bold">{details?.role}</span>.
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={handleClaim}
                            disabled={loading}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Linking...' : 'Confirm & Join Roster'}
                        </button>
                        <button 
                            onClick={handleCancel}
                            disabled={loading}
                            className="w-full bg-transparent text-zinc-400 hover:text-zinc-200 font-bold py-3 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimConfirmScreen;
