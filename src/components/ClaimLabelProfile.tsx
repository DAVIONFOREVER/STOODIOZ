
import React, { useState } from 'react';
import { AppView } from '../types';
import * as apiService from '../services/apiService';
import { CloseIcon } from './icons';

interface ClaimLabelProfileProps {
    onNavigate: (view: AppView) => void;
}

const ClaimLabelProfile: React.FC<ClaimLabelProfileProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await apiService.claimLabelRosterProfile({ email, password, name });
            setSuccess(true);
            setTimeout(() => {
                onNavigate(AppView.LOGIN);
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Failed to claim profile.");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto p-8 mt-10 cardSurface text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-green-400 mb-4">Profile Claimed!</h2>
                <p className="text-zinc-300 mb-6">
                    Your account has been created and linked to your label. Redirecting to login...
                </p>
                <button 
                    onClick={() => onNavigate(AppView.LOGIN)}
                    className="bg-zinc-700 text-zinc-200 px-6 py-2 rounded-lg hover:bg-zinc-600"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-8 mt-10 cardSurface animate-fade-in relative">
             <button 
                onClick={() => onNavigate(AppView.LOGIN)} 
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200"
            >
                <CloseIcon className="w-6 h-6" />
            </button>

            <h1 className="text-3xl font-extrabold text-center mb-2 text-zinc-100">Claim Label Profile</h1>
            <p className="text-center text-zinc-400 mb-8">Enter your details to activate your roster account.</p>
            
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-lg mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="invited@email.com"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Display Name (Optional)</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="Stage Name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">New Password</label>
                    <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Confirm Password</label>
                    <input 
                        type="password" 
                        required 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                    {loading ? 'Claiming...' : 'Claim & Create Account'}
                </button>
            </form>
        </div>
    );
};

export default ClaimLabelProfile;
