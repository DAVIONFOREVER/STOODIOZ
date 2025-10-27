
import React, { useState } from 'react';
import { CloseIcon, MagicWandIcon } from './icons';

interface VibeMatcherModalProps {
    onClose: () => void;
    onAnalyze: (description: string) => void;
    isLoading: boolean;
}

const VibeMatcherModal: React.FC<VibeMatcherModalProps> = ({ onClose, onAnalyze, isLoading }) => {
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim()) {
            onAnalyze(description);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg border border-zinc-700 animate-slide-up">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <MagicWandIcon className="w-6 h-6 text-orange-400" />
                        Vibe Matcher
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <p className="text-slate-300 mb-4">Describe the sound or vibe you're going for, and our AI will recommend the perfect studio, engineer, or producer for your project.</p>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            className="w-full p-3 bg-zinc-700 rounded-md text-slate-100 focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., 'A warm, vintage 70s rock sound with a modern punch', 'Dark, atmospheric trap beats similar to Travis Scott', or 'Clean and crisp pop vocals like Ariana Grande'..."
                        />
                    </div>
                    <div className="p-4 bg-zinc-800/50 border-t border-zinc-700">
                        <button
                            type="submit"
                            disabled={isLoading || !description.trim()}
                            className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                'Find My Vibe'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VibeMatcherModal;
