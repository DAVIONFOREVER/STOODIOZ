import React, { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { AppView, UserRole } from '../types';
import * as apiService from '../services/apiService';
import { useAppState } from '../contexts/AppContext';
import { ChevronLeftIcon, CheckCircleIcon } from './icons';

interface ClaimProfileProps {
    // If rendered with a token in URL (handled by parent/router logic ideally, or parsed here)
    token?: string; 
}

const ClaimProfile: React.FC<ClaimProfileProps> = ({ token }) => {
    const { navigate } = useNavigation();
    const { currentUser } = useAppState();
    
    // Simple state for manual code entry
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If we have a token passed via prop (from URL routing)
    const effectiveToken = token;

    const handleClaimByCode = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!currentUser) {
            setError("You must be logged in to claim a profile.");
            return;
        }
        if (!code.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const { role } = await apiService.claimProfileByCode(code.trim(), currentUser.id);
            alert("Profile claimed successfully!");
            navigateDashboard(role);
        } catch (err: any) {
            setError(err.message || "Failed to claim profile with this code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClaimByToken = async () => {
        if (!currentUser) {
            setError("You must be logged in to claim a profile.");
            return;
        }
        if (!effectiveToken) return;

        setIsLoading(true);
        setError(null);

        try {
            const { role } = await apiService.claimProfileByToken(effectiveToken, currentUser.id);
            alert("Profile claimed successfully!");
            navigateDashboard(role);
        } catch (err: any) {
            setError(err.message || "Invalid or expired claim link.");
        } finally {
            setIsLoading(false);
        }
    };

    const navigateDashboard = (role: UserRole) => {
        switch (role) {
            case 'ARTIST': navigate(AppView.ARTIST_DASHBOARD); break;
            case 'ENGINEER': navigate(AppView.ENGINEER_DASHBOARD); break;
            case 'PRODUCER': navigate(AppView.PRODUCER_DASHBOARD); break;
            default: navigate(AppView.THE_STAGE);
        }
    };

    return (
        <div className="max-w-md mx-auto p-8 mt-10 cardSurface animate-fade-in">
            <h1 className="text-3xl font-extrabold text-center mb-6 text-zinc-100">Claim Your Profile</h1>
            
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-lg mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            {!currentUser ? (
                <div className="text-center space-y-4">
                    <p className="text-zinc-400">You need to log in or create an account to claim a roster spot.</p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => navigate(AppView.LOGIN)}
                            className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            Log In
                        </button>
                        <button 
                            onClick={() => navigate(AppView.CHOOSE_PROFILE)}
                            className="w-full bg-zinc-700 text-zinc-200 font-bold py-3 rounded-lg hover:bg-zinc-600 transition-colors"
                        >
                            Create Account
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Token Flow */}
                    {effectiveToken && (
                        <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 text-center">
                            <p className="text-zinc-200 font-semibold mb-4">You have a valid claim link.</p>
                            <button 
                                onClick={handleClaimByToken}
                                disabled={isLoading}
                                className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? 'Processing...' : (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Claim This Profile
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Code Flow */}
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-px bg-zinc-700 flex-grow"></div>
                            <span className="text-zinc-500 text-sm font-semibold uppercase">Or Enter Code</span>
                            <div className="h-px bg-zinc-700 flex-grow"></div>
                        </div>
                        <form onSubmit={handleClaimByCode} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Claim Code</label>
                                <input 
                                    type="text" 
                                    value={code} 
                                    onChange={(e) => setCode(e.target.value)} 
                                    placeholder="123456" 
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-center tracking-widest text-lg font-mono focus:ring-2 focus:ring-orange-500 outline-none"
                                    maxLength={6}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isLoading || code.length < 6}
                                className="w-full bg-zinc-700 text-white font-bold py-3 rounded-lg hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Verifying...' : 'Claim with Code'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClaimProfile;