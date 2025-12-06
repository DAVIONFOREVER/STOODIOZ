
import React, { useState } from 'react';
import { CloseIcon, PlusCircleIcon } from './icons';
import * as apiService from '../services/apiService';

interface LabelRosterImportProps {
    labelId: string;
    onAdded: () => void;
    onClose: () => void;
}

const LabelRosterImport: React.FC<LabelRosterImportProps> = ({ labelId, onAdded, onClose }) => {
    const [email, setEmail] = useState('');
    const [artistId, setArtistId] = useState('');
    const [role, setRole] = useState('Artist');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() && !artistId.trim()) {
            setError("Please provide either an email or an Artist ID.");
            return;
        }

        setLoading(true);
        try {
            // FIX: Corrected function name from 'addArtistToLabelRoster' to 'addArtistToRoster'
            await apiService.addArtistToRoster({
                labelId,
                email: email.trim() || undefined,
                artistId: artistId.trim() || undefined,
                role: role.trim()
            });
            onAdded();
        } catch (err: any) {
            setError(err.message || "Failed to add artist. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full p-3 bg-zinc-800/70 border border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none";
    const labelClasses = "block text-sm font-medium text-zinc-400 mb-1";

    return (
        <div className="cardSurface w-full max-w-lg mx-auto overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-100">Add Artist to Roster</h2>
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className={labelClasses}>Artist Email (for invite)</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="artist@example.com" 
                        className={inputClasses}
                    />
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-black text-zinc-500">OR</span>
                    </div>
                </div>

                <div>
                    <label className={labelClasses}>Existing Artist ID</label>
                    <input 
                        type="text" 
                        value={artistId} 
                        onChange={e => setArtistId(e.target.value)} 
                        placeholder="UUID from database" 
                        className={inputClasses}
                    />
                    <p className="text-xs text-zinc-500 mt-1">If the artist is already on Stoodioz, enter their ID to link directly.</p>
                </div>

                <div>
                    <label className={labelClasses}>Role</label>
                    <input 
                        type="text" 
                        value={role} 
                        onChange={e => setRole(e.target.value)} 
                        placeholder="e.g. Artist, Producer, Writer" 
                        className={inputClasses}
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={loading}
                        className="px-4 py-2 rounded-lg font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-6 py-2 rounded-lg font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Adding...' : (
                            <>
                                <PlusCircleIcon className="w-5 h-5" />
                                Add to Roster
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LabelRosterImport;
