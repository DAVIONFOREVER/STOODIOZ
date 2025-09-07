
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
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xl mt-16">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-slate-900">Welcome Back</h1>
            <p className="text-center text-slate-500 mb-8">Log in to your Stoodioz account.</p>
            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mb-6 text-center">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-100 border-slate-300 text-slate-800 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label htmlFor="password" aria-label="Password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-100 border-slate-300 text-slate-800 rounded-lg focus:ring-orange-500 focus:border-orange-500"
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
                <p className="text-sm text-slate-500">
                    Don't have an account?{' '}
                    <button onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} className="font-semibold text-orange-500 hover:underline">
                        Get Started
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;