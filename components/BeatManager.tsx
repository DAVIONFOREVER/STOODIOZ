import React, { useState } from 'react';
import type { Producer, Instrumental } from '../types';
import { PlusCircleIcon, TrashIcon, EditIcon } from './icons';
import * as apiService from '../services/apiService';

interface BeatManagerProps {
    producer: Producer;
    onUpdateProducer: (updates: Partial<Producer>) => void;
}

const BeatForm: React.FC<{ beat?: Instrumental, onSave: (beat: Instrumental, file?: File) => void, onCancel: () => void, isSaving: boolean }> = ({ beat, onSave, onCancel, isSaving }) => {
    const [title, setTitle] = useState(beat?.title || '');
    const [genre, setGenre] = useState(beat?.genre || '');
    const [tags, setTags] = useState(beat?.tags.join(', ') || '');
    const [priceLease, setPriceLease] = useState(beat?.priceLease || 29.99);
    const [priceExclusive, setPriceExclusive] = useState(beat?.priceExclusive || 299.99);
    const [audioFile, setAudioFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: beat?.id || `beat-${Date.now()}`,
            title,
            genre,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            priceLease,
            priceExclusive,
            audioUrl: beat?.audioUrl || '',
        }, audioFile || undefined);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700 space-y-4">
            <h3 className="font-semibold text-lg">{beat ? 'Edit Beat' : 'Add New Beat'}</h3>
            <div>
                <label>Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 bg-zinc-800 rounded-md" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label>Genre</label><input type="text" value={genre} onChange={e => setGenre(e.target.value)} className="w-full p-2 bg-zinc-800 rounded-md" /></div>
                <div><label>Tags (comma-separated)</label><input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2 bg-zinc-800 rounded-md" /></div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div><label>Lease Price ($)</label><input type="number" value={priceLease} onChange={e => setPriceLease(Number(e.target.value))} className="w-full p-2 bg-zinc-800 rounded-md" required min="0" /></div>
                <div><label>Exclusive Price ($)</label><input type="number" value={priceExclusive} onChange={e => setPriceExclusive(Number(e.target.value))} className="w-full p-2 bg-zinc-800 rounded-md" required min="0" /></div>
            </div>
            <div>
                <label>Audio File (MP3, WAV)</label>
                <input type="file" onChange={e => e.target.files && setAudioFile(e.target.files[0])} className="w-full p-2 bg-zinc-800 rounded-md" accept="audio/mpeg, audio/wav" required={!beat} />
            </div>
             <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Beat'}</button>
            </div>
        </form>
    );
};

const BeatManager: React.FC<BeatManagerProps> = ({ producer, onUpdateProducer }) => {
    const [editingBeat, setEditingBeat] = useState<Instrumental | null | 'new'>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveBeat = async (beatToSave: Instrumental, file?: File) => {
        setIsSaving(true);
        try {
            let audioUrl = beatToSave.audioUrl;
            if (file) {
                audioUrl = await apiService.uploadBeatFile(file, producer.id);
            }
            const finalBeat = { ...beatToSave, audioUrl };
            const existingBeat = producer.instrumentals.find(b => b.id === finalBeat.id);
            const updatedBeats = existingBeat
                ? producer.instrumentals.map(b => b.id === finalBeat.id ? finalBeat : b)
                : [...producer.instrumentals, finalBeat];
            onUpdateProducer({ instrumentals: updatedBeats });
        } catch (error) {
            console.error("Failed to save beat:", error);
            // Optionally show an error to the user
        } finally {
            setEditingBeat(null);
            setIsSaving(false);
        }
    };

    const handleDeleteBeat = (beatId: string) => {
        if (window.confirm("Are you sure you want to delete this beat?")) {
            const updatedBeats = producer.instrumentals.filter(b => b.id !== beatId);
            onUpdateProducer({ instrumentals: updatedBeats });
        }
    };
    
    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-zinc-100">Manage Beat Store</h1>
                <button onClick={() => setEditingBeat('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <PlusCircleIcon className="w-5 h-5"/> Upload Beat
                </button>
            </div>

            {editingBeat && <BeatForm beat={editingBeat === 'new' ? undefined : editingBeat} onSave={handleSaveBeat} onCancel={() => setEditingBeat(null)} isSaving={isSaving} />}
            
            <div className="space-y-4 mt-4">
                {producer.instrumentals.map(beat => (
                    <div key={beat.id} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-orange-400">{beat.title}</h3>
                            <p className="text-sm text-zinc-300">{beat.genre}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-semibold text-green-400">${beat.priceLease} / ${beat.priceExclusive}</span>
                           <button onClick={() => setEditingBeat(beat)} className="p-2 bg-zinc-700 rounded-md"><EditIcon className="w-5 h-5"/></button>
                           <button onClick={() => handleDeleteBeat(beat.id)} className="p-2 bg-red-500/20 text-red-400 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BeatManager;
