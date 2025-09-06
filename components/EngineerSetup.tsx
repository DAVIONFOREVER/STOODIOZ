import React, { useState } from 'react';
import { AppView } from '../types';

interface EngineerSetupProps {
    onCompleteSetup: (name: string, bio: string, email: string, password: string) => void;
    onNavigate: (view: AppView) => void;
}

const EngineerSetup: React.FC<EngineerSetupProps> = ({ onCompleteSetup, onNavigate }) => {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && bio.trim() && email.trim() && password.trim() && agreedToTerms) {
            onCompleteSetup(name, bio, email, password);
        }
    };
    
    const isFormValid = name.trim() && bio.trim() && email.trim() && password.trim() && agreedToTerms;

    return (
        <div className="max-w-2xl mx-auto bg-zinc-800 p-8 rounded-2xl border border-zinc-700">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-orange-500">Create Your Engineer Profile</h1>
            <p className="text-center text-slate-400 mb-8">Showcase your skills, experience, and create your account.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-4 pr-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g., Alex Robinson"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-slate-300 mb-2">Your Bio</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full pl-4 pr-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Describe your engineering philosophy, specialties, and past work."
                        required
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-4 pr-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" aria-label="Password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-4 pr-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="terms" className="flex items-start">
                        <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-500 bg-zinc-700 text-orange-500 focus:ring-orange-500 mt-1"
                        required
                        />
                        <span className="ml-3 text-sm text-slate-300">
                        I have read and agree to the{' '}
                        <button type="button" onClick={() => onNavigate(AppView.PRIVACY_POLICY)} className="font-medium text-orange-400 hover:underline">
                            User Agreement &amp; Privacy Policy
                        </button>
                        .
                        </span>
                    </label>
                </div>
                <button type="submit" disabled={!isFormValid} className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:bg-slate-600 disabled:cursor-not-allowed">
                    Complete Profile
                </button>
            </form>
        </div>
    );
};

export default EngineerSetup;