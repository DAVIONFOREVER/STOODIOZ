import React, { useState } from 'react';
import { CloseIcon, MagicWandIcon } from './icons';

interface VibeMatcherModalProps {
    onClose: () => void;
    onAnalyze: (vibeDescription: string) => void;
    isLoading: boolean;
}

const VibeMatcherModal: React.FC<VibeMatcherModalProps> = ({ onClose, onAnalyze, isLoading }) => {
    const [vibeDescription, setVibeDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (vibeDescription.trim()) {
            onAnalyze(vibeDescription);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-zinc-800 rounded-xl shadow-2xl w-full max-w-lg transform animate-slide-up border border-zinc-700" role="dialog" aria-modal="true">
                <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-100">AI Vibe Matcher</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <p className="text-slate-300 mb-4">
                            Describe the vibe, genre, or feel of a song you like. Our AI will recommend stoodioz, engineers, and producers that match.
                        </p>
                         <label htmlFor="vibe-description" className="sr-only">Vibe Description</label>
                         <textarea
                            id="vibe-description"
                            value={vibeDescription}
                            onChange={(e) => setVibeDescription(e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g., 'A dreamy, atmospheric track with lo-fi beats and ethereal female vocals, similar to Clairo or beabadoobee.'"
                            required
                         />
                    </div>
                    <div className="p-6 bg-zinc-800/50 border-t border-zinc-700 rounded-b-xl flex justify-end">
                        <button type="button" onClick={onClose} className="text-slate-300 bg-transparent hover:bg-zinc-700 font-bold rounded-lg text-sm px-5 py-3 text-center mr-2 transition-colors border border-zinc-600">
                            Cancel
                        </button>
                        <button type="submit" disabled={!vibeDescription.trim() || isLoading} className="text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-orange-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 w-40">
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                 <MagicWandIcon className="w-5 h-5" />
                                 Find My Vibe
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default VibeMatcherModal;