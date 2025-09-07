import React, { useState } from 'react';
import type { Stoodio } from '../types';
import { VerificationStatus } from '../types';
import { VerifiedIcon, ClockIcon, LinkIcon } from './icons';

interface VerificationManagerProps {
    stoodio: Stoodio;
    onVerificationSubmit: (stoodioId: string, data: { googleBusinessProfileUrl: string; websiteUrl: string }) => void;
}

const VerificationManager: React.FC<VerificationManagerProps> = ({ stoodio, onVerificationSubmit }) => {
    const [googleBusinessProfileUrl, setGoogleBusinessProfileUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onVerificationSubmit(stoodio.id, { googleBusinessProfileUrl, websiteUrl });
    };

    if (stoodio.verificationStatus === VerificationStatus.VERIFIED) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 text-center">
                <VerifiedIcon className="w-16 h-16 text-blue-500 mx-auto" />
                <h3 className="text-2xl font-bold text-slate-900 mt-4">You're Verified!</h3>
                <p className="text-slate-600 mt-2">Your stoodio is now marked as a trusted and legitimate business on the platform. Verified stoodioz get a boost in search results.</p>
            </div>
        );
    }

    if (stoodio.verificationStatus === VerificationStatus.PENDING) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 text-center">
                <ClockIcon className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
                <h3 className="text-2xl font-bold text-slate-900 mt-4">Verification Pending</h3>
                <p className="text-slate-600 mt-2">Your submission is under review by our team. This usually takes 24-48 hours. We'll notify you once it's complete.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Get Your Stoodio Verified</h1>
            <p className="text-slate-500 mb-6">
                Submit your public business information to earn a "Verified" badge. This helps artists trust your listing and improves your visibility in search results.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="google-url" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Google Business Profile URL
                    </label>
                    <input
                        type="url"
                        id="google-url"
                        value={googleBusinessProfileUrl}
                        onChange={(e) => setGoogleBusinessProfileUrl(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        required
                        className="w-full p-2 bg-slate-100 border-slate-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                 <div>
                    <label htmlFor="website-url" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                         <LinkIcon className="w-4 h-4" /> Official Website URL
                    </label>
                    <input
                        type="url"
                        id="website-url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://www.yourstudio.com"
                        required
                        className="w-full p-2 bg-slate-100 border-slate-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                 <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors">
                    Submit for Verification
                </button>
            </form>
        </div>
    );
};

export default VerificationManager;
