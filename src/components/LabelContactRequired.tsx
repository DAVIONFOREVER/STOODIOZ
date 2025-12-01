
import React from 'react';
import { BriefcaseIcon, CheckCircleIcon } from './icons';
import { useNavigation } from '../hooks/useNavigation';
import { AppView } from '../types';

const LabelContactRequired: React.FC = () => {
    const { navigate } = useNavigation();

    return (
        <div className="max-w-xl mx-auto p-8 mt-12 cardSurface text-center animate-fade-in">
            <div className="bg-orange-500/10 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-orange-500/30">
                <BriefcaseIcon className="w-10 h-10 text-orange-400" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-100 mb-4">Application Received</h1>
            
            <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
                Thanks for creating a Label account. Stoodioz Label Mode requires a verification call and custom pricing configuration to ensure the best experience for your roster.
            </p>
            
            <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-8 text-left">
                <h3 className="font-bold text-zinc-100 mb-2 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" /> Next Steps:
                </h3>
                <ul className="list-disc list-inside text-zinc-400 space-y-1 ml-1">
                    <li>Our onboarding team will review your details.</li>
                    <li>We'll contact you at the email provided.</li>
                    <li>Once verified, your dashboard will be activated.</li>
                </ul>
            </div>

            <button 
                onClick={() => navigate(AppView.LANDING_PAGE)}
                className="w-full bg-zinc-700 text-slate-100 font-bold py-3 px-6 rounded-lg hover:bg-zinc-600 transition-all"
            >
                Back to Home
            </button>
        </div>
    );
};

export default LabelContactRequired;
