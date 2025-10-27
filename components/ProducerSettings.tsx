import React, { useState } from 'react';
import type { Producer } from '../types';
import { EditIcon } from './icons';

interface ProducerSettingsProps {
    producer: Producer;
    onUpdateProducer: (updates: Partial<Producer>) => void;
}

const ProducerSettings: React.FC<ProducerSettingsProps> = ({ producer, onUpdateProducer }) => {
    const [name, setName] = useState(producer.name);
    const [bio, setBio] = useState(producer.bio);
    const [genres, setGenres] = useState(producer.genres.join(', '));
    const [pullUpPrice, setPullUpPrice] = useState(producer.pullUpPrice || 0);
    const [imageUrl, setImageUrl] = useState(producer.imageUrl);
    const [coverUrl, setCoverUrl] = useState(producer.cover_image_url || '');

    const handleSave = () => {
        onUpdateProducer({
            name,
            bio,
            genres: genres.split(',').map(g => g.trim()).filter(Boolean),
            pullUpPrice,
            imageUrl,
            cover_image_url: coverUrl,
        });
    };

    const hasChanges = name !== producer.name || bio !== producer.bio || genres !== producer.genres.join(', ') || pullUpPrice !== (producer.pullUpPrice || 0) || imageUrl !== producer.imageUrl || coverUrl !== (producer.cover_image_url || '');
    
    const inputClasses = "w-full p-2 bg-zinc-700 border-zinc-600 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";
    const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <EditIcon className="w-6 h-6 text-orange-400" />
                Profile Settings
            </h1>
            <p className="text-zinc-400 mb-6">Update your public profile information.</p>
            <div className="space-y-4">
                <div><label className={labelClasses}>Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} /></div>
                <div><label className={labelClasses}>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className={inputClasses}></textarea></div>
                <div><label className={labelClasses}>Genres (comma-separated)</label><input type="text" value={genres} onChange={e => setGenres(e.target.value)} className={inputClasses} /></div>
                <div><label className={labelClasses}>"Pull Up" Session Fee ($)</label><input type="number" value={pullUpPrice} onChange={e => setPullUpPrice(Number(e.target.value))} className={inputClasses} min="0" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Profile Picture URL</label>
                        <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputClasses} placeholder="https://..." />
                    </div>
                    <div>
                        <label className={labelClasses}>Cover Image URL</label>
                        <input type="text" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className={inputClasses} placeholder="https://..." />
                    </div>
                </div>
            </div>
             <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={!hasChanges} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default ProducerSettings;