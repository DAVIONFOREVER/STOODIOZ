
import React, { useState, useEffect } from 'react';
import type { Producer } from '../types';
import { EditIcon } from './icons';

interface ProducerSettingsProps {
    producer: Producer;
    onUpdateProducer: (updatedProfile: Partial<Producer>) => void;
}

const ProducerSettings: React.FC<ProducerSettingsProps> = ({ producer, onUpdateProducer }) => {
    const [name, setName] = useState(producer.name);
    const [bio, setBio] = useState(producer.bio);
    const [genres, setGenres] = useState((producer.genres || []).join(', '));
    // FIX: Corrected property name from 'pullUpPrice' to 'pull_up_price'
    const [pullUpPrice, setPullUpPrice] = useState(producer.pull_up_price || 0);

    useEffect(() => {
        setName(producer.name);
        setBio(producer.bio);
        setGenres((producer.genres || []).join(', '));
        // FIX: Corrected property name from 'pullUpPrice' to 'pull_up_price'
        setPullUpPrice(producer.pull_up_price || 0);
    }, [producer]);
    
    const hasChanges = 
        name !== producer.name ||
        bio !== producer.bio ||
        genres !== (producer.genres || []).join(', ') ||
        // FIX: Corrected property name from 'pullUpPrice' to 'pull_up_price'
        pullUpPrice !== (producer.pull_up_price || 0);

    const handleSave = () => {
        const updatedProfile: Partial<Producer> = {
            name,
            bio,
            genres: genres.split(',').map(g => g.trim()).filter(Boolean),
            // FIX: Corrected property name from 'pullUpPrice' to 'pull_up_price'
            pull_up_price: pullUpPrice,
        };
        onUpdateProducer(updatedProfile);
    };
    
    const inputClasses = "w-full p-2 bg-zinc-700 border-zinc-600 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";
    const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";

    return (
        <div className="p-6 cardSurface">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <EditIcon className="w-6 h-6 text-orange-400" />
                Profile Settings
            </h1>
            <p className="text-zinc-400 mb-6">
                Update your public profile information and session settings.
            </p>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="producer-name" className={labelClasses}>Producer Name</label>
                    <input type="text" id="producer-name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="producer-bio" className={labelClasses}>Bio</label>
                    <textarea id="producer-bio" value={bio} onChange={e => setBio(e.target.value)} rows={4} className={inputClasses}></textarea>
                </div>
                <div>
                    <label htmlFor="producer-genres" className={labelClasses}>Genres (comma-separated)</label>
                    <input type="text" id="producer-genres" value={genres} onChange={e => setGenres(e.target.value)} placeholder="e.g., Hip-Hop, Trap, R&B" className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="producer-pullup" className={labelClasses}>"Pull Up" Session Fee ($)</label>
                    <input type="number" id="producer-pullup" value={pullUpPrice} onChange={e => setPullUpPrice(Number(e.target.value))} min="0" className={inputClasses} />
                    <p className="text-xs text-zinc-500 mt-1">Set a fee for you to personally attend a studio session. Set to 0 if not applicable.</p>
                </div>
            </div>
            
            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default ProducerSettings;
