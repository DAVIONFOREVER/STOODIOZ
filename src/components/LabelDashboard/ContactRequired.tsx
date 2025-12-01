import React from 'react';
import { BriefcaseIcon } from '../icons';

const ContactRequired: React.FC = () => {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                <BriefcaseIcon className="w-10 h-10 text-orange-500" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100 mb-4">
                Thanks for creating a label account.
            </h1>
            
            <p className="text-zinc-400 max-w-lg mb-8 text-lg">
                Stoodioz Label Mode requires a verification call and custom pricing.
                We’ll contact you to complete onboarding and activate your label.
            </p>
            
            <div className="bg-zinc-800/50 border border-zinc-700 p-6 rounded-xl max-w-md w-full mb-8">
                <div className="flex justify-center">
                    <span className="bg-yellow-500/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-yellow-500/20">
                        Status: Pending Verification
                    </span>
                </div>
            </div>

            <button 
                onClick={() => window.location.href = "mailto:support@stoodioz.com?subject=Label%20Activation%20Request"}
                className="bg-zinc-100 text-zinc-900 font-bold py-3 px-8 rounded-lg hover:bg-white transition-all shadow-lg hover:shadow-xl"
            >
                Request Contact
            </button>
        </div>
    );
};

export default ContactRequired;