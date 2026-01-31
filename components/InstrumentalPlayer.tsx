import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Instrumental, Producer } from '../types';
import { PlayIcon, PauseIcon, DownloadIcon, DollarSignIcon, MusicNoteIcon, LinkIcon, SearchIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import BeatContractModal from './BeatContractModal';

interface InstrumentalPlayerProps {
    instrumentals: Instrumental[];
    onPurchase: (instrumental: Instrumental) => void;
    producer?: any; // Producer info for contract viewing
}

const TAG = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

const PlayingBars: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`flex items-end gap-1 ${className}`} aria-hidden="true">
        {[6, 10, 8, 12].map((h, idx) => (
            <span
                key={idx}
                className="w-1 rounded-sm bg-purple-400 animate-bounce"
                style={{ height: h, animationDelay: `${idx * 0.12}s`, animationDuration: '0.9s' }}
            />
        ))}
    </div>
);

const InstrumentalPlayer: React.FC<InstrumentalPlayerProps> = ({ instrumentals, onPurchase, producer }) => {
    const { currentUser } = useAppState();
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [contractModal, setContractModal] = useState<{ type: 'lease' | 'exclusive'; instrumental: Instrumental } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [genreFilter, setGenreFilter] = useState<string>('All');
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number>(0);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const idleAnimationRef = useRef<number>(0);

    // Get unique genres for filter
    const genres = useMemo(() => {
        const genreSet = new Set<string>();
        instrumentals.forEach(inst => {
            if (inst.genre) genreSet.add(inst.genre);
        });
        return ['All', ...Array.from(genreSet).sort()];
    }, [instrumentals]);

    // Filter instrumentals
    const filteredInstrumentals = useMemo(() => {
        if (!Array.isArray(instrumentals)) return [];
        return instrumentals.filter(inst => {
            if (!inst) return false;
            const matchesSearch = !searchTerm || 
                (inst.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (inst.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesGenre = genreFilter === 'All' || inst.genre === genreFilter;
            return matchesSearch && matchesGenre;
        });
    }, [instrumentals, searchTerm, genreFilter]);

    // Ensure filteredInstrumentals is always an array
    const safeFilteredInstrumentals = Array.isArray(filteredInstrumentals) ? filteredInstrumentals : [];

    const nowPlaying = safeFilteredInstrumentals.find((i) => i.id === playingId) || null;

    // Idle animation when nothing is playing
    const drawIdle = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || idleAnimationRef.current) return; // Prevent multiple animations

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const time = Date.now() * 0.001;

        ctx.fillStyle = 'rgba(24,24,27,0.95)';
        ctx.fillRect(0, 0, w, h);

        const barCount = 32;
        const barW = w / barCount;
        const gap = 2;

        for (let i = 0; i < barCount; i++) {
            const x = i * barW + gap / 2;
            // Create a wave pattern for idle animation
            const wave = Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5;
            const barH = Math.max(4, wave * h * 0.3);
            
            const gr = ctx.createLinearGradient(0, h, 0, 0);
            gr.addColorStop(0, 'rgba(168,85,247,0.3)');
            gr.addColorStop(0.6, 'rgba(168,85,247,0.5)');
            gr.addColorStop(1, 'rgba(236,72,153,0.4)');
            ctx.fillStyle = gr;
            ctx.fillRect(x, h - barH, barW - gap, barH);
        }

        idleAnimationRef.current = requestAnimationFrame(drawIdle);
    }, []);

    // Active visualization when playing
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;
        if (!canvas || !analyser || !dataArray || !playingId) {
            // Stop animation if conditions not met
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = 0;
            }
            return;
        }

        rafRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = 'rgba(24,24,27,0.95)';
        ctx.fillRect(0, 0, w, h);

        const barCount = 32;
        const barW = w / barCount;
        const gap = 2;
        for (let i = 0; i < barCount; i++) {
            const v = dataArray[Math.floor((i / barCount) * (dataArray.length - 1))] ?? 0;
            const barH = Math.max(4, (v / 255) * h * 0.7);
            const x = i * barW + gap / 2;
            const gr = ctx.createLinearGradient(0, h, 0, 0);
            gr.addColorStop(0, 'rgba(168,85,247,0.8)');
            gr.addColorStop(0.6, 'rgba(236,72,153,0.9)');
            gr.addColorStop(1, 'rgba(249,115,22,0.7)');
            ctx.fillStyle = gr;
            ctx.fillRect(x, h - barH, barW - gap, barH);
        }
    }, []);

    const setupAudioContext = useCallback(() => {
        const el = audioRef.current;
        if (!el || sourceRef.current) return;
        try {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const source = ctx.createMediaElementSource(el);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            analyser.connect(ctx.destination);
            ctxRef.current = ctx;
            sourceRef.current = source;
            analyserRef.current = analyser;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        } catch (e) {
            // CORS or other audio context errors - just log and continue without visualization
            console.warn('Audio context setup failed (CORS may be blocking):', e);
            // Don't set up visualization if we can't create audio context
        }
    }, []);

    useEffect(() => {
        if (!playingId || !nowPlaying) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = 0;
            }
            // Start idle animation only if canvas exists
            if (canvasRef.current && !idleAnimationRef.current) {
                drawIdle();
            }
            return () => {
                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current);
                    rafRef.current = 0;
                }
                if (idleAnimationRef.current) {
                    cancelAnimationFrame(idleAnimationRef.current);
                    idleAnimationRef.current = 0;
                }
            };
        }
        // Stop idle animation
        if (idleAnimationRef.current) {
            cancelAnimationFrame(idleAnimationRef.current);
            idleAnimationRef.current = 0;
        }
        
        // Setup audio context and start visualization
        try {
            setupAudioContext();
            if (ctxRef.current?.state === 'suspended') {
                ctxRef.current.resume().catch(e => console.warn('Audio context resume failed:', e));
            }
            // Only start drawing if we have valid audio context
            if (analyserRef.current && dataArrayRef.current) {
                draw();
            }
        } catch (e) {
            console.warn('Audio visualization setup failed:', e);
        }
        
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = 0;
            }
        };
    }, [playingId, nowPlaying, setupAudioContext, draw, drawIdle]);

    // Start idle animation on mount
    useEffect(() => {
        if (!playingId && canvasRef.current) {
            drawIdle();
        }
        return () => {
            if (idleAnimationRef.current) {
                cancelAnimationFrame(idleAnimationRef.current);
            }
        };
    }, [drawIdle]);

    const handlePlayPause = useCallback((instrumental: Instrumental) => {
        if (!instrumental.audio_url) {
            console.warn('No audio URL for instrumental:', instrumental.id);
            return;
        }

        if (playingId === instrumental.id) {
            // Pause current
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            // Play new
            if (audioRef.current) {
                const audio = audioRef.current;
                audio.src = instrumental.audio_url;
                audio.load(); // Explicitly load the new source
                audio.play().catch(e => {
                    console.error("Audio play failed:", e);
                    setPlayingId(null);
                });
                setPlayingId(instrumental.id);
            }
        }
    }, [playingId]);

    return (
        <div className="aria-glass p-10 rounded-[40px] aria-metal-stroke shadow-2xl relative overflow-hidden group">
            {/* Decorative background icon */}
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-all duration-500">
                <MusicNoteIcon className="w-16 h-16 text-purple-400" />
            </div>

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Beat Store</h3>
                </div>
                {instrumentals.length > 0 && (
                    <div className="text-xs text-zinc-500 font-bold">
                        {safeFilteredInstrumentals.length} of {instrumentals.length} beats
                    </div>
                )}
            </div>

            {/* Search and Filter Bar */}
            {instrumentals.length > 0 && (
                <div className="mb-6 space-y-3">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search beats..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                    </div>
                    {genres.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {genres.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => setGenreFilter(genre)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
                                        genreFilter === genre
                                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                            : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-white/5'
                                    }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Always-visible Visualizer */}
            <div className="mb-10 rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/50">
                <div className="px-6 py-3 flex items-center justify-between border-b border-white/5 bg-zinc-900/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                        {nowPlaying ? 'Now Playing' : 'Audio Visualizer'}
                    </p>
                    {nowPlaying && (
                        <p className="font-black text-purple-400 text-sm tracking-tight truncate flex-1 mx-4">
                            {nowPlaying.title}
                        </p>
                    )}
                </div>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={120}
                    className="w-full h-32 block"
                    style={{ maxHeight: 120 }}
                />
            </div>

            {/* Beat Store Content - Always Show Table Structure */}
            <div className="space-y-4">
                {/* Table Header - Always Visible */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    <div className="col-span-1">Cover</div>
                    <div className="col-span-1">Play</div>
                    <div className="col-span-3">Title & Tags</div>
                    <div className="col-span-2">Pricing</div>
                    <div className="col-span-2">Contracts</div>
                    <div className="col-span-1">Actions</div>
                    <div className="col-span-2">Purchase</div>
                </div>

                {safeFilteredInstrumentals.length === 0 ? (
                    <div className="grid grid-cols-12 gap-4 p-8 rounded-xl border border-white/5 bg-zinc-900/20">
                        <div className="col-span-1">
                            <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5">
                                <MusicNoteIcon className="w-8 h-8 text-zinc-700" />
                            </div>
                        </div>
                        <div className="col-span-1 flex items-center">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                                <PlayIcon className="w-5 h-5 text-zinc-700" />
                            </div>
                        </div>
                        <div className="col-span-3 flex flex-col justify-center">
                            <p className="text-zinc-600 font-semibold mb-2">No beat title</p>
                            <span className="text-[10px] text-zinc-700 italic">No tags</span>
                        </div>
                        <div className="col-span-2 flex flex-col gap-2 justify-center">
                            <div>
                                <p className="text-[10px] text-zinc-700 uppercase tracking-[0.1em] mb-1">Lease MP3</p>
                                <p className="text-zinc-700 text-sm">$—</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-700 uppercase tracking-[0.1em] mb-1">Lease WAV</p>
                                <p className="text-zinc-700 text-sm">$—</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-700 uppercase tracking-[0.1em] mb-1">Exclusive</p>
                                <p className="text-zinc-700 text-sm">$—</p>
                            </div>
                        </div>
                        <div className="col-span-2 flex flex-col gap-2 justify-center">
                            <div>
                                <p className="text-[10px] text-zinc-700 uppercase tracking-[0.1em] mb-1">Lease Contract</p>
                                <button className="text-zinc-600 text-xs hover:text-purple-400 transition-colors italic">View —</button>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-700 uppercase tracking-[0.1em] mb-1">Exclusive Contract</p>
                                <button className="text-zinc-600 text-xs hover:text-purple-400 transition-colors italic">View —</button>
                            </div>
                        </div>
                        <div className="col-span-1 flex items-center">
                            <div className="px-4 py-2 rounded-lg bg-zinc-800 border border-white/5">
                                <DownloadIcon className="w-5 h-5 text-zinc-700" />
                            </div>
                        </div>
                        <div className="col-span-2 flex items-center">
                            <div className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-white/5 text-center">
                                <span className="text-zinc-700 text-xs">—</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {safeFilteredInstrumentals.map((instrumental) => {
                        const isOwner = currentUser?.id === instrumental.producer_id;
                        const tags = TAG(instrumental.tags);
                        const showLeaseMp3 = !!(instrumental.audio_url && (instrumental.price_lease ?? 0) > 0);
                        const showLeaseWav = !!(instrumental.wav_url && (instrumental.price_lease_wav ?? 0) > 0);
                        const showExclusive = !!(instrumental.wav_url && (instrumental.price_exclusive ?? 0) > 0);
                        const isPlaying = playingId === instrumental.id;

                        return (
                            <div
                                key={instrumental.id}
                                className={`grid grid-cols-12 gap-4 p-4 rounded-xl border transition-all duration-300 hover:border-purple-500/30 ${
                                    isPlaying
                                        ? 'bg-purple-500/10 border-purple-500/40'
                                        : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50'
                                }`}
                            >
                                {/* Cover Art */}
                                <div className="col-span-1">
                                    {instrumental.cover_art_url ? (
                                        <img
                                            src={instrumental.cover_art_url}
                                            alt={instrumental.title}
                                            className="w-16 h-16 rounded-lg object-cover border border-white/10"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5">
                                            <MusicNoteIcon className="w-8 h-8 text-zinc-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Play Button */}
                                <div className="col-span-1 flex items-center">
                                    <button
                                        onClick={() => handlePlayPause(instrumental)}
                                        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 overflow-visible ${
                                            isPlaying
                                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                                                : 'bg-zinc-800 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30'
                                        }`}
                                    >
                                        {isPlaying && (
                                            <span className="absolute inset-0 rounded-full border border-purple-400/60 animate-ping" />
                                        )}
                                        {isPlaying ? (
                                            <PauseIcon className="w-5 h-5" />
                                        ) : (
                                            <PlayIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                {/* Title & Tags */}
                                <div className="col-span-3 flex flex-col justify-center">
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-lg text-slate-100 mb-2 tracking-tight">
                                            {instrumental.title}
                                        </p>
                                        {isPlaying && <PlayingBars className="mb-2" />}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.length > 0 ? (
                                            tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/30 font-bold uppercase tracking-[0.1em]"
                                                >
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-zinc-600 italic">No tags</span>
                                        )}
                                    </div>
                                </div>

                                {/* Pricing - Always Show All Fields */}
                                <div className="col-span-2 flex flex-col gap-2 justify-center">
                                    <div className="text-left">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.1em] mb-1">
                                            Lease MP3
                                        </p>
                                        {showLeaseMp3 ? (
                                            <p className="font-black text-green-400 text-base">${Number(instrumental.price_lease ?? 0).toFixed(2)}</p>
                                        ) : (
                                            <p className="text-zinc-700 text-sm">$—</p>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.1em] mb-1">
                                            Lease WAV
                                        </p>
                                        {showLeaseWav ? (
                                            <p className="font-black text-green-400 text-base">${Number(instrumental.price_lease_wav ?? 0).toFixed(2)}</p>
                                        ) : (
                                            <p className="text-zinc-700 text-sm">$—</p>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.1em] mb-1">
                                            Exclusive
                                        </p>
                                        {showExclusive ? (
                                            <p className="font-black text-purple-400 text-base">${Number(instrumental.price_exclusive ?? 0).toFixed(2)}</p>
                                        ) : (
                                            <p className="text-zinc-700 text-sm">$—</p>
                                        )}
                                    </div>
                                </div>

                                {/* Contracts */}
                                <div className="col-span-2 flex flex-col gap-2 justify-center">
                                    <div className="text-left">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.1em] mb-1">
                                            Lease Contract
                                        </p>
                                        {(showLeaseMp3 || showLeaseWav) ? (
                                            <button
                                                onClick={() => {
                                                    if (producer) {
                                                        setContractModal({ type: 'lease', instrumental });
                                                    } else {
                                                        alert('Producer information needed to view contract.');
                                                    }
                                                }}
                                                className="text-purple-400 text-xs hover:text-purple-300 transition-colors font-semibold flex items-center gap-1 group"
                                            >
                                                <LinkIcon className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                                View Contract
                                            </button>
                                        ) : (
                                            <p className="text-zinc-700 text-xs italic">—</p>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.1em] mb-1">
                                            Exclusive Contract
                                        </p>
                                        {showExclusive ? (
                                            <button
                                                onClick={() => {
                                                    if (producer) {
                                                        setContractModal({ type: 'exclusive', instrumental });
                                                    } else {
                                                        alert('Producer information needed to view contract.');
                                                    }
                                                }}
                                                className="text-purple-400 text-xs hover:text-purple-300 transition-colors font-semibold flex items-center gap-1 group"
                                            >
                                                <LinkIcon className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                                View Contract
                                            </button>
                                        ) : (
                                            <p className="text-zinc-700 text-xs italic">—</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex items-center gap-2">
                                    {instrumental.is_free_download_available ? (
                                        <a
                                            href={instrumental.audio_url}
                                            download={`${instrumental.title} (Free).mp3`}
                                            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 font-bold text-xs hover:bg-green-500/30 transition-colors border border-green-500/30 flex items-center gap-1.5"
                                        >
                                            <DownloadIcon className="w-4 h-4" />
                                            Free
                                        </a>
                                    ) : (
                                        <a
                                            href={instrumental.audio_url}
                                            download={`${instrumental.title} (Tagged Sample).mp3`}
                                            className="p-2 text-zinc-400 hover:text-purple-400 rounded-lg bg-zinc-800 border border-white/5 hover:border-purple-500/30 transition-colors"
                                            title="Download Sample (Tagged)"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>

                                {/* Purchase Button */}
                                <div className="col-span-2 flex items-center">
                                    {!isOwner ? (
                                        <button
                                            onClick={() => onPurchase(instrumental)}
                                            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black text-sm hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 flex items-center justify-center gap-1.5"
                                        >
                                            <DollarSignIcon className="w-4 h-4" />
                                            Purchase
                                        </button>
                                    ) : (
                                        <span className="text-zinc-600 text-xs italic">Your beat</span>
                                    )}
                                </div>
                            </div>
                        );
                        })}
                    </>
                )}
            </div>
            <audio 
                ref={audioRef} 
                onEnded={() => {
                    setPlayingId(null);
                    if (rafRef.current) {
                        cancelAnimationFrame(rafRef.current);
                        rafRef.current = 0;
                    }
                }}
                onError={(e) => {
                    console.warn('Audio playback error (may be CORS):', e);
                    setPlayingId(null);
                    if (rafRef.current) {
                        cancelAnimationFrame(rafRef.current);
                        rafRef.current = 0;
                    }
                    // Stop any ongoing visualization
                    if (idleAnimationRef.current) {
                        cancelAnimationFrame(idleAnimationRef.current);
                        idleAnimationRef.current = 0;
                    }
                }}
                onLoadedData={() => {
                    // Audio loaded successfully
                }}
                crossOrigin="anonymous"
            />
            
            {/* Contract Modal */}
            {contractModal && producer && (
                <BeatContractModal
                    type={contractModal.type}
                    instrumental={contractModal.instrumental}
                    producer={producer}
                    onClose={() => setContractModal(null)}
                />
            )}
        </div>
    );
};

export default InstrumentalPlayer;
