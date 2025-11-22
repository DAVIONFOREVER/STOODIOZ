
import React, { useState } from 'react';
import { AppView } from '../types';

interface LoginProps {
    onLogin: (email: string, password: string) => void;
    error: string | null;
    onNavigate: (view: AppView) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="max-w-md mx-auto p-8 mt-16 cardSurface">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-slate-100">Welcome Back</h1>
            <p className="text-center text-slate-400 mb-8">Log in to your Stoodioz account.</p>
            {error && (
                <div className={`border p-4 rounded-lg mb-6 text-sm ${
                    error.toLowerCase().includes("email not confirmed") 
                    ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-200" 
                    : "bg-red-500/20 border-red-500/30 text-red-300"
                }`}>
                    {error.toLowerCase().includes("email not confirmed") ? (
                        <div className="text-center">
                            <strong className="block text-lg mb-1">Email Verification Required</strong>
                            <p>Please check your inbox (and spam folder) for a confirmation link from Stoodioz/Supabase before logging in.</p>
                        </div>
                    ) : (
                        <div className="text-center font-semibold">{error}</div>
                    )}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label htmlFor="password" aria-label="Password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                    />
                </div>
                <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20">
                    Log In
                </button>
            </form>
             <div className="text-center mt-6">
                <p className="text-sm text-slate-400">
                    Don't have an account?{' '}
                    <button onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} className="font-semibold text-orange-400 hover:underline">
                        Get Started
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
