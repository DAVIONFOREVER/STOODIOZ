
import React, { useState } from 'react';
import type { Producer, Instrumental } from '../types';
import { MusicNoteIcon, DollarSignIcon, EditIcon, TrashIcon, PlusCircleIcon, CloseIcon, PhotoIcon } from './icons';
import { uploadBeatFile, upsertInstrumental, deleteInstrumental } from '../services/apiService';

interface BeatManagerProps {
    producer: Producer;
    onRefresh: () => void;
}

// A professional, dark-themed placeholder image for beats (SVG Data URI)
const DEFAULT_BEAT_COVER = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='%2318181b'%3e%3crect width='200' height='200'/%3e%3cpath fill='%233f3f46' d='M127.5 52.5L127.5 110.625C124.062 108.688 119.938 107.5 115.5 107.5C104.438 107.5 95.5 116.438 95.5 127.5C95.5 138.562 104.438 147.5 115.5 147.5C126.562 147.5 135.5 138.562 135.5 127.5V70.375L87.5 82.375V123.125C84.0625 121.188 79.9375 120 75.5 120C64.4375 120 55.5 128.938 55.5 140C55.5 151.062 64.4375 160 75.5 160C86.5625 160 95.5 151.062 95.5 140V60L127.5 52.5Z'/%3e%3c/svg%3e";

const BeatFormModal: React.FC<{
    instrumental: Partial<Instrumental> | null;
    onSave: (instrumental: Instrumental, audioFile: File | null, coverArtUrl: string) => void;
    onClose: () => void;
    isUploading: boolean;
}> = ({ instrumental, onSave, onClose, isUploading }) => {
    const [title, setTitle] = useState(instrumental?.title || '');
    const [genre, setGenre] = useState(instrumental?.genre || '');
    const [priceLease, setPriceLease] = useState(instrumental?.price_lease || 29.99);
    const [priceExclusive, setPriceExclusive] = useState(instrumental?.price_exclusive || 299.99);
    const [tags, setTags] = useState((instrumental?.tags || []).join(', '));
    const [coverArtPreview, setCoverArtPreview] = useState(instrumental?.cover_art_url || '');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const audioFileInputRef = React.useRef<HTMLInputElement>(null);
    const coverArtInputRef = React.useRef<HTMLInputElement>(null);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!audioFile && !instrumental?.id) {
            alert('Please select an audio file for new instrumentals.');
            return;
        }
        // FIX: Use crypto.randomUUID() to generate a valid UUID for the database
        const finalInstrumental: Instrumental = {
            id: instrumental?.id || crypto.randomUUID(),
            title,
            genre,
            price_lease: priceLease,
            price_exclusive: priceExclusive,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            audio_url: instrumental?.audio_url || '', 
            // Use the uploaded preview or fall back to the system default placeholder (no random picsum images)
            cover_art_url: coverArtPreview || DEFAULT_BEAT_COVER,
        };
        onSave(finalInstrumental, audioFile, coverArtPreview);
    };

    const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAudioFile(file);
        }
    };

    const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverArtPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const inputClasses = "w-full p-2 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="w-full max-w-lg cardSurface">
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-zinc-100">{instrumental?.id ? 'Edit Instrumental' : 'Upload New Instrumental'}</h2>
                    <button onClick={onClose} disabled={isUploading}><CloseIcon className="w-6 h-6 text-zinc-400 hover:text-zinc-100" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClasses}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="cursor-pointer" onClick={() => !isUploading && audioFileInputRef.current?.click()}>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Audio File</label>
                                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-600 border-dashed rounded-md hover:border-orange-500 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <div className="space-y-1 text-center">
                                        <MusicNoteIcon className="mx-auto h-12 w-12 text-zinc-500" />
                                        <p className="text-xs text-zinc-400">
                                            {isUploading ? 'Uploading...' : (audioFile ? audioFile.name : (instrumental?.audio_url ? 'Click to replace file' : 'Click to select MP3 or WAV'))}
                                        </p>
                                    </div>
                                </div>
                                <input type="file" ref={audioFileInputRef} onChange={handleAudioFileChange} accept=".mp3,.wav" className="hidden" disabled={isUploading} />
                            </div>
                             <div className="cursor-pointer" onClick={() => !isUploading && coverArtInputRef.current?.click()}>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Cover Art</label>
                                <div className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-zinc-600 border-dashed rounded-md hover:border-orange-500 transition-colors h-full">
                                    {coverArtPreview ? (
                                        <img src={coverArtPreview} alt="Cover art preview" className="max-h-24 object-contain rounded"/>
                                    ) : (
                                        <div className="space-y-1 text-center">
                                            <PhotoIcon className="mx-auto h-12 w-12 text-zinc-500" />
                                            <p className="text-xs text-zinc-400">Click to select PNG or JPG</p>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={coverArtInputRef} onChange={handleCoverArtChange} accept="image/png, image/jpeg" className="hidden" disabled={isUploading} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Genre</label>
                                <input type="text" value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g., Trap" required className={inputClasses}/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Tags (comma-separated)</label>
                                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g., Hard, 808" className={inputClasses}/>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Lease Price ($)</label>
                                <input type="number" value={priceLease} onChange={e => setPriceLease(Number(e.target.value))} required className={inputClasses}/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Exclusive Price ($)</label>
                                <input type="number" value={priceExclusive} onChange={e => setPriceExclusive(Number(e.target.value))} required className={inputClasses}/>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-700/50 flex justify-end gap-2">
                        <button type="button" onClick={onClose} disabled={isUploading} className="px-4 py-2 text-sm rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors">Cancel</button>
                        <button type="submit" disabled={isUploading} className="px-4 py-2 text-sm rounded bg-orange-500 text-white hover:bg-orange-600 disabled:bg-zinc-600 flex items-center gap-2 transition-colors">
                            {isUploading && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isUploading ? 'Uploading...' : 'Save Instrumental'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const BeatManager: React.FC<BeatManagerProps> = ({ producer, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInstrumental, setEditingInstrumental] = useState<Partial<Instrumental> | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleOpenModal = (instrumental: Partial<Instrumental> | null = null) => {
        setEditingInstrumental(instrumental);
        setIsModalOpen(true);
    };

    const handleSaveInstrumental = async (instrumentalToSave: Instrumental, audioFile: File | null, coverArtUrl: string) => {
        setIsUploading(true);
        let finalInstrumental = { ...instrumentalToSave, cover_art_url: coverArtUrl };

        try {
            if (audioFile) {
                const uploadedAudioUrl = await uploadBeatFile(audioFile, producer.id);
                finalInstrumental.audio_url = uploadedAudioUrl;
            }

            await upsertInstrumental(finalInstrumental, producer.id);
            onRefresh(); 
            setIsModalOpen(false);
            setEditingInstrumental(null);
        } catch (error) {
            console.error("Failed to save instrumental:", error);
            alert("Error saving beat. Please check your connection.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteInstrumental = async (instrumentalId: string) => {
        if (window.confirm('Are you sure you want to delete this instrumental?')) {
            try {
                await deleteInstrumental(instrumentalId);
                onRefresh();
            } catch (error) {
                console.error("Failed to delete instrumental:", error);
                alert("Error deleting beat.");
            }
        }
    };

    return (
        <div className="p-6 cardSurface">
             <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold text-zinc-100">My Beats</h1>
                 <button onClick={() => handleOpenModal({})} className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm">
                    <PlusCircleIcon className="w-5 h-5"/>
                    Upload Beat
                </button>
            </div>
            
            <div className="space-y-4">
                {(producer.instrumentals || []).length > 0 ? producer.instrumentals.map(inst => (
                    <div key={inst.id} className="cardSurface p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-purple-500/30 transition-colors">
                        <img src={inst.cover_art_url} alt={inst.title} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg text-zinc-200 flex items-center gap-2"><MusicNoteIcon className="w-5 h-5 text-purple-400"/> {inst.title}</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <div className="text-sm font-semibold text-green-400 flex items-center gap-1">
                                    <DollarSignIcon className="w-4 h-4" /> Lease: ${inst.price_lease.toFixed(2)}
                                </div>
                                 <div className="text-sm font-semibold text-green-400 flex items-center gap-1">
                                    <DollarSignIcon className="w-4 h-4" /> Exclusive: ${inst.price_exclusive.toFixed(2)}
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                             <button onClick={() => handleOpenModal(inst)} className="p-2 text-zinc-400 hover:text-orange-400 rounded-full bg-zinc-800 hover:bg-orange-500/10 transition-colors"><EditIcon className="w-5 h-5"/></button>
                             <button onClick={() => handleDeleteInstrumental(inst.id)} className="p-2 text-zinc-400 hover:text-red-400 rounded-full bg-zinc-800 hover:bg-red-500/10 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 bg-zinc-800/50 rounded-xl border border-zinc-700 border-dashed">
                        <MusicNoteIcon className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
                        <p className="text-zinc-400">You haven't uploaded any beats yet.</p>
                         <p className="text-sm text-zinc-500 mt-1">Upload your first beat to start selling!</p>
                    </div>
                )}
            </div>
            
            {isModalOpen && <BeatFormModal instrumental={editingInstrumental} onSave={handleSaveInstrumental} onClose={() => setIsModalOpen(false)} isUploading={isUploading} />}
        </div>
    );
};

export default BeatManager;
