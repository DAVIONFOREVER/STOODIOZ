import React, { useState } from 'react';
import { StoodiozLogoIcon } from './icons';

interface LoginProps {
    onLogin: (email: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('admin@stoodioz.com');
    const [password, setPassword] = useState('password');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-900 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <StoodiozLogoIcon className="w-16 h-16 mx-auto text-orange-500" />
                    <h1 className="text-3xl font-bold text-slate-100 mt-4">Admin Dashboard</h1>
                    <p className="text-slate-400">Please sign in to continue.</p>
                </div>
                <div className="bg-zinc-800 p-8 rounded-2xl border border-zinc-700 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
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
                                className="w-full px-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20">
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;