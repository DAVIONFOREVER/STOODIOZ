
import React from 'react';
import { CloseCircleIcon } from '../icons';

const LabelDisabled: React.FC = () => {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/30">
                <CloseCircleIcon className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100 mb-4">
                Account Disabled
            </h1>
            
            <p className="text-zinc-400 max-w-lg mb-8 text-lg">
                This label account has been suspended or disabled. Please contact support for assistance.
            </p>
            
            <button 
                onClick={() => window.location.href = "mailto:support@stoodioz.com"}
                className="bg-zinc-800 text-zinc-200 font-bold py-3 px-8 rounded-lg hover:bg-zinc-700 transition-all border border-zinc-600"
            >
                Contact Support
            </button>
        </div>
    );
};

export default LabelDisabled;
