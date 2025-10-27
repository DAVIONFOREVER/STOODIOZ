
import React, { useState } from 'react';
import { AppView, UserRole } from '../types';
import { ChevronLeftIcon } from './icons';
import PrivacyPolicy from './PrivacyPolicy';

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
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (agreedToTerms) {
            onCompleteSetup(name, bio, email, password);
        } else {
            alert("Please agree to the User Agreement & Privacy Policy.");
        }
    };
    
    if (showPrivacyPolicy) {
        return <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />;
    }

    return (
        <div className="max-w-lg mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-zinc-700/50 shadow-2xl">
            <button onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Profile Selection
            </button>
            <h1 className="text-4xl font-extrabold text-center mb-2 text-slate-100">Create Your Artist Profile</h1>
            <p className="text-center text-slate-400 mb-8">Tell us a bit about yourself to get started.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="artist-name" className="block text-sm font-medium text-slate-300 mb-2">Artist Name / Alias</label>
                    <input type="text" id="artist-name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border-zinc-700 rounded-lg" required />
                </div>
                <div>
                    <label htmlFor="artist-bio" className="block text-sm font-medium text-slate-300 mb-2">Your Bio</label>
                    <textarea id="artist-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 bg-zinc-800 border-zinc-700 rounded-lg" placeholder="What kind of music do you make?"></textarea>
                </div>
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border-zinc-700 rounded-lg" required />
                </div>
                 <div>
                    <label htmlFor="password" aria-label="Password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border-zinc-700 rounded-lg" required />
                </div>
                <div className="flex items-start">
                    <input id="terms" name="terms" type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="h-4 w-4 text-orange-600 border-gray-300 rounded mt-1" />
                    <div className="ml-3 text-sm">
                        <label htmlFor="terms" className="text-slate-400">
                            I agree to the{' '}
                            <button type="button" onClick={() => setShowPrivacyPolicy(true)} className="font-medium text-orange-400 hover:underline">
                                User Agreement & Privacy Policy
                            </button>
                            .
                        </label>
                    </div>
                </div>
                <button type="submit" disabled={!agreedToTerms} className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed">
                    Complete Profile
                </button>
            </form>
        </div>
    );
};

export default ArtistSetup;
