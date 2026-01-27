import React, { useEffect, useState, useMemo } from 'react';
import { AppView } from '../types';
import { useNavigation } from '../hooks/useNavigation';
import { getClaimDetails } from '../services/apiService';
import { StoodiozLogoIcon, CheckCircleIcon } from './icons';
import appIcon from '../assets/stoodioz-app-icon.png';

interface ClaimEntryScreenProps {
    token?: string;
}

const ClaimEntryScreen: React.FC<ClaimEntryScreenProps> = ({ token: propToken }) => {
    const { navigate } = useNavigation();
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<{ labelName: string; role: string; email?: string } | null>(null);
    const [error, setError] = useState('');

    const token = useMemo(() => {
        if (typeof window === 'undefined') return propToken || '';
        const q = new URLSearchParams(window.location.search);
        const fromUrl = q.get('claim') || q.get('token');
        const fromStorage = sessionStorage.getItem('claim_token_from_url');
        return fromUrl || fromStorage || propToken || '';
    }, [propToken]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const q = new URLSearchParams(window.location.search);
            const fromUrl = q.get('claim') || q.get('token');
            if (fromUrl) {
                sessionStorage.setItem('claim_token_from_url', fromUrl);
                const u = new URL(window.location.href);
                u.searchParams.delete('claim');
                u.searchParams.delete('token');
                window.history.replaceState({}, '', u.toString());
            }
        }
    }, []);

    useEffect(() => {
        if (!token) {
            setError('This invite link is invalid or has already been claimed.');
            setLoading(false);
            return;
        }
        const fetchDetails = async () => {
            setLoading(true);
            const data = await getClaimDetails(token);
            if (data) {
                setDetails(data);
            } else {
                setError('This invite link is invalid or has already been claimed.');
            }
            setLoading(false);
        };
        fetchDetails();
    }, [token]);

    const handleLogin = () => {
        if (token) sessionStorage.setItem('pending_claim_token', token);
        navigate(AppView.LOGIN);
    };

    const handleSignup = () => {
        if (token) sessionStorage.setItem('pending_claim_token', token);
        navigate(AppView.CHOOSE_PROFILE);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <img src={appIcon} alt="Loading" className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
                <div className="cardSurface p-8 max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Invalid Link</h2>
                    <p className="text-zinc-400">{error}</p>
                    <button 
                        onClick={() => navigate(AppView.LANDING_PAGE)}
                        className="mt-6 text-zinc-300 hover:text-white font-bold underline"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="cardSurface max-w-md w-full p-8 text-center animate-fade-in">
                <StoodiozLogoIcon className="w-16 h-16 text-orange-500 mx-auto mb-6" />
                
                <h1 className="text-3xl font-extrabold text-zinc-100 mb-2">You're Invited!</h1>
                <p className="text-zinc-400 mb-8">
                    <span className="font-bold text-white">{details?.labelName}</span> has invited you to join their roster as a <span className="text-orange-400 font-bold">{details?.role}</span>.
                </p>

                {details?.email && (
                    <div className="bg-zinc-800 p-4 rounded-lg mb-8 border border-zinc-700">
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Reserved For</p>
                        <p className="text-zinc-200 font-mono">{details.email}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <button 
                        onClick={handleSignup}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        Accept & Create Account
                    </button>
                    
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700"></div></div>
                        <div className="relative flex justify-center"><span className="px-2 bg-black text-zinc-500 text-sm">Already have an account?</span></div>
                    </div>

                    <button 
                        onClick={handleLogin}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3.5 rounded-xl transition-colors border border-zinc-700"
                    >
                        Log In to Claim
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClaimEntryScreen;
