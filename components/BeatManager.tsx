
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Producer, Instrumental } from '../types';
import { MusicNoteIcon, DollarSignIcon, EditIcon, TrashIcon, PlusCircleIcon, CloseIcon, PhotoIcon, SearchIcon } from './icons';
import { uploadBeatFile, uploadBeatWav, uploadStemsFile, upsertInstrumental, deleteInstrumental, fetchInstrumentalsForProducer } from '../services/apiService';

interface BeatManagerProps {
    producer: Producer;
    onRefresh: () => void;
}


const BeatFormModal: React.FC<{
    instrumental: Partial<Instrumental> | null;
    onSave: (instrumental: Instrumental, audioFile: File | null, coverArtUrl: string, wavFile?: File | null, stemsFile?: File | null) => void;
    onClose: () => void;
    isUploading: boolean;
}> = ({ instrumental, onSave, onClose, isUploading }) => {
    const [title, setTitle] = useState(instrumental?.title || '');
    const [genre, setGenre] = useState(instrumental?.genre || '');
    const [priceLease, setPriceLease] = useState(instrumental?.price_lease ?? 29.99);
    const [priceLeaseWav, setPriceLeaseWav] = useState<number | ''>(instrumental?.price_lease_wav ?? '');
    const [priceExclusive, setPriceExclusive] = useState(instrumental?.price_exclusive ?? 299.99);
    const [tags, setTags] = useState((instrumental?.tags || []).join(', '));
    const [coverArtPreview, setCoverArtPreview] = useState(instrumental?.cover_art_url || '');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [wavFile, setWavFile] = useState<File | null>(null);
    const [stemsFile, setStemsFile] = useState<File | null>(null);
    const audioFileInputRef = React.useRef<HTMLInputElement>(null);
    const coverArtInputRef = React.useRef<HTMLInputElement>(null);
    const wavFileInputRef = React.useRef<HTMLInputElement>(null);
    const stemsFileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!audioFile && !instrumental?.id) {
            alert('Please select an audio file for new instrumentals.');
            return;
        }
        const finalInstrumental: Instrumental = {
            id: instrumental?.id || crypto.randomUUID(),
            title,
            genre,
            price_lease: priceLease,
            price_lease_wav: (typeof priceLeaseWav === 'number' && priceLeaseWav > 0) ? priceLeaseWav : (null as any),
            price_exclusive: priceExclusive,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            audio_url: instrumental?.audio_url || '',
            wav_url: instrumental?.wav_url || '',
            stems_url: instrumental?.stems_url || '',
            cover_art_url: coverArtPreview || '',
        };
        onSave(finalInstrumental, audioFile, coverArtPreview, wavFile, stemsFile);
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
            reader.onloadend = () => setCoverArtPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleWavFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        setWavFile(f || null);
    };

    const handleStemsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        setStemsFile(f || null);
    };

    const inputClasses = 'w-full p-2 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="w-full max-w-lg cardSurface">
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-zinc-100">{instrumental?.id ? 'Edit Instrumental' : 'Upload New Instrumental'}</h2>
                    <button onClick={onClose} disabled={isUploading}><CloseIcon className="w-6 h-6 text-zinc-400 hover:text-zinc-100" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70dvh] overflow-y-auto">
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
                                        <p className="text-xs text-zinc-400">Click to select image (JPG, PNG, WebP, HEIC, etc.)</p>
                                    </div>
                                )}
                                </div>
                                <input type="file" ref={coverArtInputRef} onChange={handleCoverArtChange} accept="image/*,.heic,.heif" className="hidden" disabled={isUploading} />
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
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Lease MP3 Price ($)</label>
                                <input type="number" value={priceLease} onChange={e => setPriceLease(Number(e.target.value))} required step="0.01" min="0" className={inputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Lease WAV Price ($)</label>
                                <input type="number" value={priceLeaseWav} onChange={e => setPriceLeaseWav(e.target.value === '' ? '' : Number(e.target.value))} step="0.01" min="0" placeholder="Optional" className={inputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Exclusive Price ($)</label>
                                <input type="number" value={priceExclusive} onChange={e => setPriceExclusive(Number(e.target.value))} required step="0.01" min="0" className={inputClasses} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="cursor-pointer" onClick={() => !isUploading && wavFileInputRef.current?.click()}>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">WAV File (for Lease WAV / Exclusive)</label>
                                <div className={`mt-1 flex justify-center px-4 py-3 border-2 border-zinc-600 border-dashed rounded-md hover:border-orange-500 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <p className="text-xs text-zinc-400">{isUploading ? 'Uploading...' : wavFile ? wavFile.name : instrumental?.wav_url ? 'Click to replace WAV' : 'Optional: click to add WAV'}</p>
                                </div>
                                <input type="file" ref={wavFileInputRef} onChange={handleWavFileChange} accept=".wav,audio/wav,audio/x-wav" className="hidden" disabled={isUploading} />
                            </div>
                            <div className="cursor-pointer" onClick={() => !isUploading && stemsFileInputRef.current?.click()}>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Stems ZIP (for Exclusive)</label>
                                <div className={`mt-1 flex justify-center px-4 py-3 border-2 border-zinc-600 border-dashed rounded-md hover:border-orange-500 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <p className="text-xs text-zinc-400">{isUploading ? 'Uploading...' : stemsFile ? stemsFile.name : instrumental?.stems_url ? 'Click to replace stems' : 'Optional: click to add stems .zip'}</p>
                                </div>
                                <input type="file" ref={stemsFileInputRef} onChange={handleStemsFileChange} accept=".zip,application/zip" className="hidden" disabled={isUploading} />
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
    const [searchTerm, setSearchTerm] = useState('');
    const [genreFilter, setGenreFilter] = useState<string>('All');
    const [sortBy, setSortBy] = useState<'newest' | 'title' | 'price'>('newest');
    // Dashboard passes currentUser which often has no instrumentals loaded; Profile uses fetchFullProducer which does.
    // Always fetch our own list by profile_id so the dashboard shows the same beats as the public profile.
    const [instrumentalsList, setInstrumentalsList] = useState<Instrumental[]>([]);
    const profileId = (producer as any)?.profile_id ?? producer?.id;
    const loadInstrumentals = useCallback(async () => {
        if (!profileId) return;
        try {
            const list = await fetchInstrumentalsForProducer(profileId);
            setInstrumentalsList(Array.isArray(list) ? list : []);
        } catch {
            setInstrumentalsList(Array.isArray(producer.instrumentals) ? producer.instrumentals : []);
        }
    }, [profileId, producer.instrumentals]);
    useEffect(() => {
        loadInstrumentals();
    }, [loadInstrumentals]);

    const handleOpenModal = (instrumental: Partial<Instrumental> | null = null) => {
        setEditingInstrumental(instrumental);
        setIsModalOpen(true);
    };

    const handleSaveInstrumental = async (
        instrumentalToSave: Instrumental,
        audioFile: File | null,
        coverArtUrl: string,
        wavFile?: File | null,
        stemsFile?: File | null
    ) => {
        setIsUploading(true);
        // Owner must be profile id so RLS and forward-facing profile (fetch by profile_id) show the beat
        const ownerId = profileId ?? (producer as any)?.profile_id ?? producer.id;
        const finalInstrumental: Record<string, unknown> = { ...instrumentalToSave, cover_art_url: coverArtUrl, producer_id: ownerId };

        try {
            if (audioFile) {
                const res = await uploadBeatFile(producer.id, audioFile);
                finalInstrumental.audio_url = (res as any)?.url ?? (instrumentalToSave.audio_url || '');
            }
            if (wavFile) {
                const { url } = await uploadBeatWav(producer.id, wavFile);
                finalInstrumental.wav_url = url;
            }
            if (stemsFile) {
                const { url } = await uploadStemsFile(producer.id, stemsFile);
                finalInstrumental.stems_url = url;
            }

            await upsertInstrumental(finalInstrumental as any);
            await loadInstrumentals();
            onRefresh();
            setIsModalOpen(false);
            setEditingInstrumental(null);
        } catch (error) {
            console.error('Failed to save instrumental:', error);
            alert('Error saving beat. Please check your connection.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteInstrumental = async (instrumentalId: string) => {
        if (window.confirm('Are you sure you want to delete this instrumental?')) {
            try {
                await deleteInstrumental(instrumentalId);
                await loadInstrumentals();
                onRefresh();
            } catch (error) {
                console.error("Failed to delete instrumental:", error);
                alert("Error deleting beat.");
            }
        }
    };

    const instrumentals = instrumentalsList.length > 0 ? instrumentalsList : (producer.instrumentals || []);
    
    // Get unique genres for filter
    const genres = useMemo(() => {
        const genreSet = new Set<string>();
        instrumentals.forEach(inst => {
            if (inst.genre) genreSet.add(inst.genre);
        });
        return ['All', ...Array.from(genreSet).sort()];
    }, [instrumentals]);

    // Filter and sort instrumentals
    const filteredAndSorted = useMemo(() => {
        let filtered = instrumentals.filter(inst => {
            const matchesSearch = !searchTerm || 
                inst.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (inst.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesGenre = genreFilter === 'All' || inst.genre === genreFilter;
            return matchesSearch && matchesGenre;
        });

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'price':
                    return (b.price_lease || 0) - (a.price_lease || 0);
                case 'newest':
                default:
                    return 0; // Keep original order (newest first from API)
            }
        });

        return filtered;
    }, [instrumentals, searchTerm, genreFilter, sortBy]);

    return (
        <div className="p-6 aria-glass rounded-[40px] aria-metal-stroke shadow-2xl relative overflow-hidden group">
            {/* Decorative background icon */}
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-500">
                <MusicNoteIcon className="w-32 h-32 text-purple-400" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></div>
                            <h1 className="text-3xl font-black text-zinc-100 tracking-tight">My Beat Store</h1>
                        </div>
                        <p className="text-sm text-zinc-400">Manage your beats, pricing, and contracts</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal({})} 
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 text-sm"
                    >
                        <PlusCircleIcon className="w-5 h-5"/>
                        Upload Beat
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search beats by title or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-[0.2em] font-black">
                            Filters:
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {genres.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => setGenreFilter(genre)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        genreFilter === genre
                                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                            : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-white/5'
                                    }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-zinc-500 uppercase tracking-[0.2em] font-black">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-4 py-2 bg-zinc-800/50 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                <option value="newest">Newest First</option>
                                <option value="title">Title A-Z</option>
                                <option value="price">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            
                {/* Beats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSorted.length > 0 ? filteredAndSorted.map(inst => (
                        <div key={inst.id} className="aria-glass rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden">
                            {/* Hover gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-600/0 group-hover:from-purple-500/5 group-hover:to-pink-600/5 transition-all duration-300"></div>
                            
                            <div className="relative z-10">
                                {/* Cover Art */}
                                <div className="relative mb-4 aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-white/5 group-hover:scale-[1.02] transition-transform duration-300">
                                    {inst.cover_art_url ? (
                                        <img src={inst.cover_art_url} alt={inst.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <MusicNoteIcon className="w-16 h-16 text-zinc-600" />
                                        </div>
                                    )}
                                    {/* Genre Badge */}
                                    {inst.genre && (
                                        <div className="absolute top-2 left-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">{inst.genre}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Title */}
                                <h3 className="font-black text-xl text-zinc-100 mb-2 tracking-tight line-clamp-1">{inst.title}</h3>

                                {/* Tags */}
                                {inst.tags && inst.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {inst.tags.slice(0, 3).map((tag, idx) => (
                                            <span key={idx} className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/30 font-bold uppercase tracking-[0.1em]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Pricing */}
                                <div className="space-y-2 mb-4 pb-4 border-b border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-500 uppercase tracking-[0.1em]">Lease MP3</span>
                                        <span className="font-black text-green-400">${Number(inst.price_lease ?? 0).toFixed(2)}</span>
                                    </div>
                                    {inst.wav_url && (inst.price_lease_wav ?? 0) > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-500 uppercase tracking-[0.1em]">Lease WAV</span>
                                            <span className="font-black text-green-400">${Number(inst.price_lease_wav ?? 0).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-500 uppercase tracking-[0.1em]">Exclusive</span>
                                        <span className="font-black text-purple-400">${Number(inst.price_exclusive ?? 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleOpenModal(inst)} 
                                        className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-purple-500/20 text-zinc-300 hover:text-purple-400 rounded-lg border border-white/5 hover:border-purple-500/30 transition-all font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <EditIcon className="w-4 h-4"/>
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteInstrumental(inst.id)} 
                                        className="px-4 py-2 bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/5 hover:border-red-500/30 transition-all"
                                    >
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-16 aria-glass rounded-2xl border border-white/10">
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>
                                <MusicNoteIcon className="relative w-16 h-16 mx-auto text-zinc-600" />
                            </div>
                            <p className="text-zinc-400 font-semibold mb-2">No beats found</p>
                            {searchTerm || genreFilter !== 'All' ? (
                                <p className="text-sm text-zinc-500">Try adjusting your filters</p>
                            ) : (
                                <>
                                    <p className="text-sm text-zinc-500 mb-4">Upload your first beat to start selling!</p>
                                    <button 
                                        onClick={() => handleOpenModal({})} 
                                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
                                    >
                                        Upload Beat
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {isModalOpen && <BeatFormModal instrumental={editingInstrumental} onSave={handleSaveInstrumental} onClose={() => setIsModalOpen(false)} isUploading={isUploading} />}
        </div>
    );
};

export default BeatManager;
