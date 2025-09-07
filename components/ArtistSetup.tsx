
import React, { useState } from 'react';
import { AppView } from '../types';

interface ArtistSetupProps {
    onCompleteSetup: (name: string, bio: string, email: string, password: string) => void;
    onNavigate: (view: AppView) => void;
}

const ArtistSetup: React.FC<ArtistSetupProps> = ({ onCompleteSetup, onNavigate }) => {
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
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
            <h1 className="text-4xl font-extrabold text-center mb-2 text-slate-900">Create Your <span className="text-orange-500">Artist Profile</span></h1>
            <p className="text-center text-slate-500 mb-8">Tell the community who you are and create your account.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Artist/Band Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-100 border-slate-300 text-slate-800 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g., Luna Vance"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">Your Bio</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-100 border-slate-300 text-slate-800 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Describe your sound, your influences, and what you're looking for."
                        required
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className="h-4 w-4 rounded border-slate-300 bg-slate-100 text-orange-500 focus:ring-orange-500 mt-1"
                        required
                        />
                        <span className="ml-3 text-sm text-slate-600">
                        I have read and agree to the{' '}
                        <button type="button" onClick={() => onNavigate(AppView.PRIVACY_POLICY)} className="font-medium text-orange-500 hover:underline">
                            User Agreement &amp; Privacy Policy
                        </button>
                        .
                        </span>
                    </label>
                </div>
                <button type="submit" disabled={!isFormValid} className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    Complete Profile
                </button>
            </form>
        </div>
    );
};

export default ArtistSetup;