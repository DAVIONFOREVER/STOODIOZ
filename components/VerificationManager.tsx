import React, { useState } from 'react';
import type { Stoodio } from '../types';
import { VerificationStatus } from '../types';
import { CheckCircleIcon, ClockIcon, ShieldCheckIcon } from './icons';

interface VerificationManagerProps {
    stoodio: Stoodio;
    onVerificationSubmit: (stoodioId: string, data: { googleBusinessProfileUrl: string, websiteUrl: string }) => void;
}

const VerificationManager: React.FC<VerificationManagerProps> = ({ stoodio, onVerificationSubmit }) => {
    const [googleUrl, setGoogleUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onVerificationSubmit(stoodio.id, { googleBusinessProfileUrl: googleUrl, websiteUrl });
    };

    if (stoodio.verificationStatus === VerificationStatus.VERIFIED) {
        return (
             <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/30 text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4"/>
                <h2 className="text-2xl font-bold text-green-300">Your Stoodio is Verified!</h2>
                <p className="text-green-400/80 mt-2">Your profile now has a verified badge, increasing trust and visibility.</p>
            </div>
        );
    }

    if (stoodio.verificationStatus === VerificationStatus.PENDING) {
        return (
             <div className="bg-yellow-500/10 p-6 rounded-lg border border-yellow-500/30 text-center">
                <ClockIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse"/>
                <h2 className="text-2xl font-bold text-yellow-300">Verification Pending</h2>
                <p className="text-yellow-400/80 mt-2">Our team is reviewing your submission. This usually takes 24-48 hours.</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <ShieldCheckIcon className="w-6 h-6 text-orange-400"/>
                Get Verified
            </h1>
            <p className="text-zinc-400 mb-6">Verify your stoodio to gain trust, get a badge on your profile, and improve your search ranking.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Google Business Profile URL</label>
                    <input type="url" value={googleUrl} onChange={e => setGoogleUrl(e.target.value)} className="w-full p-2 bg-zinc-700 rounded-md" required placeholder="https://maps.google.com/..." />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Official Website URL (optional)</label>
                    <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="w-full p-2 bg-zinc-700 rounded-md" placeholder="https://mystudio.com" />
                </div>
                 <div className="flex justify-end">
                    <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all">
                        Submit for Verification
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VerificationManager;
