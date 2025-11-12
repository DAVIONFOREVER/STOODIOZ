import React, { useState } from 'react';
import type { Producer, Instrumental } from '../types';
import { MusicNoteIcon, DollarSignIcon, EditIcon, TrashIcon, PlusCircleIcon, CloseIcon, PhotoIcon } from './icons';
import { uploadBeatFile } from '../services/apiService';

interface BeatManagerProps {
    producer: Producer;
    onUpdateProducer: (updatedProfile: Partial<Producer>) => void;
}

const BeatFormModal: React.FC<{
    instrumental: Partial<Instrumental> | null;
    onSave: (instrumental: Instrumental, file: File | null) => void;
    onClose: () => void;
}> = ({ instrumental, onSave, onClose }) => {
    const [title, setTitle] = useState(instrumental?.title || '');
    const [genre, setGenre] = useState(instrumental?.genre || '');
    const [priceLease, setPriceLease] = useState(instrumental?.priceLease || 29.99);
    const [priceExclusive, setPriceExclusive] = useState(instrumental?.priceExclusive || 299.99);
    const [tags, setTags] = useState((instrumental?.tags || []).join(', '));
    const [coverArtUrl, setCoverArtUrl] = useState(instrumental?.coverArtUrl || '');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalInstrumental: Instrumental = {
            id: instrumental?.id || `inst-${Date.now()}`,
            title,
            genre,
            priceLease,
            priceExclusive,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            audioUrl: instrumental?.audioUrl || '', // Will be replaced by the uploaded file URL
            coverArtUrl: coverArtUrl || `https://picsum.photos/seed/${title.replace(/\s+/g, '')}/200/200`,
        };
        onSave(finalInstrumental, audioFile);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAudioFile(file);
        }
    };
    
    const inputClasses = "w-full p-2 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg cardSurface">
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-zinc-100">{instrumental?.id ? 'Edit Instrumental' : 'Upload New Instrumental'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-zinc-400 hover:text-zinc-100" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClasses}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Audio File</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-600 border-dashed rounded-md hover:border-orange-500 transition-colors">
                                    <div className="space-y-1 text-center">
                                        <MusicNoteIcon className="mx-auto h-12 w-12 text-zinc-500" />
                                        <p className="text-xs text-zinc-400">{audioFile ? audioFile.name : 'Click to select MP3 or WAV'}</p>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".mp3,.wav" className="hidden" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Cover Art</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-600 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <PhotoIcon className="mx-auto h-12 w-12 text-zinc-500" />
                                        <p className="text-xs text-zinc-400">PNG or JPG (Simulated)</p>
                                    </div>
                                </div>
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
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm rounded bg-orange-500 text-white hover:bg-orange-600">Save Instrumental</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const BeatManager: React.FC<BeatManagerProps> = ({ producer, onUpdateProducer }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInstrumental, setEditingInstrumental] = useState<Partial<Instrumental> | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleOpenModal = (instrumental: Partial<Instrumental> | null = null) => {
        setEditingInstrumental(instrumental);
        setIsModalOpen(true);
    };

    const handleSaveInstrumental = async (instrumentalToSave: Instrumental, file: File | null) => {
        setIsUploading(true);
        let finalInstrumental = { ...instrumentalToSave };

        try {
            if (file) {
                const audioUrl = await uploadBeatFile(file, producer.id);
                finalInstrumental.audioUrl = audioUrl;
            }

            let updatedInstrumentals: Instrumental[];
            const existingIndex = producer.instrumentals.findIndex(i => i.id === finalInstrumental.id);

            if (existingIndex > -1) {
                updatedInstrumentals = producer.instrumentals.map(i => i.id === finalInstrumental.id ? finalInstrumental : i);
            } else {
                updatedInstrumentals = [...producer.instrumentals, finalInstrumental];
            }
            
            onUpdateProducer({ instrumentals: updatedInstrumentals });
            
        } catch (error) {
            console.error("Failed to save instrumental:", error);
            alert("Error saving beat. Please check the console for details.");
        } finally {
            setIsModalOpen(false);
            setEditingInstrumental(null);
            setIsUploading(false);
        }
    };

    const handleDeleteInstrumental = (instrumentalId: string) => {
        if (window.confirm('Are you sure you want to delete this instrumental?')) {
            const updatedInstrumentals = producer.instrumentals.filter(i => i.id !== instrumentalId);
            onUpdateProducer({ instrumentals: updatedInstrumentals });
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
                {producer.instrumentals.length > 0 ? producer.instrumentals.map(inst => (
                    <div key={inst.id} className="cardSurface p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <img src={inst.coverArtUrl} alt={inst.title} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg text-zinc-200 flex items-center gap-2"><MusicNoteIcon className="w-5 h-5 text-purple-400"/> {inst.title}</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <div className="text-sm font-semibold text-green-400 flex items-center gap-1">
                                    <DollarSignIcon className="w-4 h-4" /> Lease: ${inst.priceLease.toFixed(2)}
                                </div>
                                 <div className="text-sm font-semibold text-green-400 flex items-center gap-1">
                                    <DollarSignIcon className="w-4 h-4" /> Exclusive: ${inst.priceExclusive.toFixed(2)}
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                             <button onClick={() => handleOpenModal(inst)} className="p-2 text-zinc-400 hover:text-orange-400 rounded-full bg-zinc-800 hover:bg-orange-500/10"><EditIcon className="w-5 h-5"/></button>
                             <button onClick={() => handleDeleteInstrumental(inst.id)} className="p-2 text-zinc-400 hover:text-red-400 rounded-full bg-zinc-800 hover:bg-red-500/10"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center py-8 text-zinc-500">You haven't uploaded any beats yet. Upload your first beat to start selling!</p>
                )}
            </div>
            
            {isModalOpen && <BeatFormModal instrumental={editingInstrumental} onSave={handleSaveInstrumental} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default BeatManager;