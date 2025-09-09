
import React, { useState } from 'react';
import { CloseIcon, LinkIcon } from './icons';

interface VibeMatcherModalProps {
    onClose: () => void;
    onAnalyze: (songUrl: string) => void;
    isLoading: boolean;
}

const VibeMatcherModal: React.FC<VibeMatcherModalProps> = ({ onClose, onAnalyze, isLoading }) => {
    const [songUrl, setSongUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (songUrl.trim()) {
            onAnalyze(songUrl);
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
                            Paste a link to a reference track (e.g., from YouTube, Spotify, SoundCloud) to find stoodioz and engineers that match its vibe.
                        </p>
                         <label htmlFor="song-url" className="sr-only">Song URL</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                               <LinkIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="url"
                                id="song-url"
                                value={songUrl}
                                onChange={(e) => setSongUrl(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                placeholder="https://www.youtube.com/watch?v=..."
                                required
                            />
                        </div>
                    </div>
                    <div className="p-6 bg-zinc-800/50 border-t border-zinc-700 rounded-b-xl flex justify-end">
                        <button type="button" onClick={onClose} className="text-slate-300 bg-transparent hover:bg-zinc-700 font-bold rounded-lg text-sm px-5 py-3 text-center mr-2 transition-colors border border-zinc-600">
                            Cancel
                        </button>
                        <button type="submit" disabled={!songUrl.trim() || isLoading} className="text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-orange-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition-all shadow-md shadow-orange-500/20">
                            {isLoading ? 'Analyzing...' : 'Find My Vibe'}
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