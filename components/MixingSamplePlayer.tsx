
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { MixingSample } from '../types';
import { PlayIcon, PauseIcon, SoundWaveIcon, StarIcon, SearchIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';

interface MixingSamplePlayerProps {
    mixingSamples: MixingSample[];
    engineerId?: string;
}

const PlayingBars: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`flex items-end gap-1 ${className}`} aria-hidden="true">
        {[6, 10, 8, 12].map((h, idx) => (
            <span
                key={idx}
                className="w-1 rounded-sm bg-orange-400 animate-bounce"
                style={{ height: h, animationDelay: `${idx * 0.12}s`, animationDuration: '0.9s' }}
            />
        ))}
    </div>
);

const MixingSamplePlayer: React.FC<MixingSamplePlayerProps> = ({ mixingSamples, engineerId }) => {
    const { currentUser } = useAppState();
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [samplesWithRatings, setSamplesWithRatings] = useState<MixingSample[]>(mixingSamples);
    const [ratingModal, setRatingModal] = useState<{ sampleId: string; sampleTitle: string } | null>(null);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedRating, setSelectedRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number>(0);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const idleAnimationRef = useRef<number>(0);

    // Load ratings for all samples
    useEffect(() => {
        const loadRatings = async () => {
            if (!mixingSamples.length) return;
            
            try {
                const ratingsPromises = mixingSamples.map(async (sample) => {
                    const ratings = await apiService.fetchMixingSampleRatings(sample.id);
                    const avgRating = ratings.length > 0 
                        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
                        : 0;
                    const userRating = currentUser 
                        ? ratings.find(r => r.rater_id === currentUser.id)?.rating 
                        : undefined;
                    
                    return {
                        ...sample,
                        avg_rating: avgRating,
                        rating_count: ratings.length,
                        user_rating: userRating,
                    };
                });
                
                const updated = await Promise.all(ratingsPromises);
                setSamplesWithRatings(updated);
            } catch (error) {
                console.error('Error loading ratings:', error);
                setSamplesWithRatings(mixingSamples);
            }
        };
        
        loadRatings();
    }, [mixingSamples, currentUser?.id]);

    // Filter samples
    const filteredSamples = useMemo(() => {
        if (!searchTerm) return samplesWithRatings;
        return samplesWithRatings.filter(sample =>
            sample.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sample.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [samplesWithRatings, searchTerm]);

    const nowPlaying = filteredSamples.find((s) => s.id === playingId) || null;

    // Idle animation when nothing is playing
    const drawIdle = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || idleAnimationRef.current) return;

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
            const wave = Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5;
            const barH = Math.max(4, wave * h * 0.3);
            
            const gr = ctx.createLinearGradient(0, h, 0, 0);
            gr.addColorStop(0, 'rgba(249,115,22,0.3)');
            gr.addColorStop(0.6, 'rgba(249,115,22,0.5)');
            gr.addColorStop(1, 'rgba(251,146,60,0.4)');
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
            gr.addColorStop(0, 'rgba(249,115,22,0.8)');
            gr.addColorStop(0.6, 'rgba(251,146,60,0.9)');
            gr.addColorStop(1, 'rgba(234,88,12,0.7)');
            ctx.fillStyle = gr;
            ctx.fillRect(x, h - barH, barW - gap, barH);
        }
    }, [playingId]);

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
            console.warn('Audio context setup failed:', e);
        }
    }, []);

    useEffect(() => {
        if (!playingId || !nowPlaying) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = 0;
            }
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
        if (idleAnimationRef.current) {
            cancelAnimationFrame(idleAnimationRef.current);
            idleAnimationRef.current = 0;
        }
        
        try {
            setupAudioContext();
            if (ctxRef.current?.state === 'suspended') {
                ctxRef.current.resume().catch(e => console.warn('Audio context resume failed:', e));
            }
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

    const handlePlayPause = useCallback((sample: MixingSample) => {
        if (!sample.audio_url) {
            console.warn('No audio URL for sample:', sample.id);
            return;
        }

        if (playingId === sample.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                const audio = audioRef.current;
                audio.src = sample.audio_url;
                audio.load();
                audio.play().catch(e => {
                    console.error("Audio play failed:", e);
                    setPlayingId(null);
                });
                setPlayingId(sample.id);
            }
        }
    }, [playingId]);

    const handleRateSample = async () => {
        if (!ratingModal || !currentUser || !selectedRating) return;
        
        setIsSubmittingRating(true);
        try {
            await apiService.rateMixingSample(
                ratingModal.sampleId,
                currentUser.id,
                selectedRating,
                ratingComment || undefined
            );
            
            // Reload ratings
            const ratings = await apiService.fetchMixingSampleRatings(ratingModal.sampleId);
            const avgRating = ratings.length > 0 
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
                : 0;
            const userRating = ratings.find(r => r.rater_id === currentUser.id)?.rating;
            
            setSamplesWithRatings(prev => prev.map(s => 
                s.id === ratingModal.sampleId 
                    ? { ...s, avg_rating: avgRating, rating_count: ratings.length, user_rating: userRating }
                    : s
            ));
            
            setRatingModal(null);
            setSelectedRating(0);
            setRatingComment('');
            setHoverRating(0);
        } catch (error) {
            console.error('Error rating sample:', error);
            alert('Failed to submit rating. Please try again.');
        } finally {
            setIsSubmittingRating(false);
        }
    };

    if (!mixingSamples || mixingSamples.length === 0) {
        return (
            <div className="aria-glass p-10 rounded-[40px] aria-metal-stroke shadow-2xl text-center">
                <SoundWaveIcon className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400 text-lg">This engineer hasn't uploaded any mixing samples yet.</p>
            </div>
        );
    }

    return (
        <div className="aria-glass p-10 rounded-[40px] aria-metal-stroke shadow-2xl relative overflow-hidden group mb-8">
            {/* Decorative background icon */}
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-all duration-500">
                <SoundWaveIcon className="w-16 h-16 text-orange-400" />
            </div>

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Mixing Samples</h3>
                </div>
                {mixingSamples.length > 0 && (
                    <div className="text-xs text-zinc-500 font-bold">
                        {filteredSamples.length} of {mixingSamples.length} samples
                    </div>
                )}
            </div>

            {/* Search Bar */}
            {mixingSamples.length > 0 && (
                <div className="mb-6">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search mixing samples..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Always-visible Visualizer */}
            <div className="mb-10 rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/50">
                <div className="px-6 py-3 flex items-center justify-between border-b border-white/5 bg-zinc-900/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                        {nowPlaying ? 'Now Playing' : 'Audio Visualizer'}
                    </p>
                    {nowPlaying && (
                        <p className="font-black text-orange-400 text-sm tracking-tight truncate flex-1 mx-4">
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

            {/* Samples Grid */}
            <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    <div className="col-span-1">Play</div>
                    <div className="col-span-4">Title & Description</div>
                    <div className="col-span-2">Rating</div>
                    <div className="col-span-2">Your Rating</div>
                    <div className="col-span-3">Actions</div>
                </div>

                {filteredSamples.length === 0 ? (
                    <div className="grid grid-cols-12 gap-4 p-8 rounded-xl border border-white/5 bg-zinc-900/20">
                        <div className="col-span-12 text-center">
                            <p className="text-zinc-600 font-semibold">No samples found</p>
                            <span className="text-[10px] text-zinc-700 italic">Try a different search term</span>
                        </div>
                    </div>
                ) : (
                    filteredSamples.map((sample) => {
                        const isPlaying = playingId === sample.id;
                        const avgRating = sample.avg_rating || 0;
                        const ratingCount = sample.rating_count || 0;
                        const userRating = sample.user_rating;

                        return (
                            <div
                                key={sample.id}
                                className={`grid grid-cols-12 gap-4 p-4 rounded-xl border transition-all duration-300 hover:border-orange-500/30 ${
                                    isPlaying
                                        ? 'bg-orange-500/10 border-orange-500/40'
                                        : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50'
                                }`}
                            >
                                {/* Play Button */}
                                <div className="col-span-1 flex items-center">
                                    <button
                                        onClick={() => handlePlayPause(sample)}
                                        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 overflow-visible ${
                                            isPlaying
                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                                                : 'bg-zinc-800 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30'
                                        }`}
                                    >
                                        {isPlaying && (
                                            <span className="absolute inset-0 rounded-full border border-orange-400/60 animate-ping" />
                                        )}
                                        {isPlaying ? (
                                            <PauseIcon className="w-5 h-5" />
                                        ) : (
                                            <PlayIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                {/* Title & Description */}
                                <div className="col-span-4 flex flex-col justify-center">
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-lg text-slate-100 mb-2 tracking-tight">
                                            {sample.title}
                                        </p>
                                        {isPlaying && <PlayingBars className="mb-2" />}
                                    </div>
                                    <p className="text-sm text-zinc-400 line-clamp-2">
                                        {sample.description || 'No description'}
                                    </p>
                                </div>

                                {/* Average Rating */}
                                <div className="col-span-2 flex flex-col justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <StarIcon
                                                    key={star}
                                                    className={`w-4 h-4 ${
                                                        star <= Math.round(avgRating)
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-zinc-600'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-zinc-400">
                                            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                                        </span>
                                    </div>
                                    {ratingCount > 0 && (
                                        <p className="text-[10px] text-zinc-500 mt-1">
                                            {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
                                        </p>
                                    )}
                                </div>

                                {/* Your Rating */}
                                <div className="col-span-2 flex flex-col justify-center">
                                    {currentUser && currentUser.id !== engineerId ? (
                                        userRating ? (
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <StarIcon
                                                        key={star}
                                                        className={`w-4 h-4 ${
                                                            star <= userRating
                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                : 'text-zinc-600'
                                                        }`}
                                                    />
                                                ))}
                                                <span className="text-xs text-zinc-400 ml-1">{userRating}/5</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setRatingModal({ sampleId: sample.id, sampleTitle: sample.title })}
                                                className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-semibold"
                                            >
                                                Rate this mix
                                            </button>
                                        )
                                    ) : (
                                        <span className="text-xs text-zinc-600 italic">—</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="col-span-3 flex items-center gap-2">
                                    {currentUser && currentUser.id !== engineerId && !userRating && (
                                        <button
                                            onClick={() => setRatingModal({ sampleId: sample.id, sampleTitle: sample.title })}
                                            className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs hover:bg-orange-500/30 transition-colors border border-orange-500/30 flex items-center gap-1.5"
                                        >
                                            <StarIcon className="w-3 h-3" />
                                            Rate
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
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
                    console.warn('Audio playback error:', e);
                    setPlayingId(null);
                    if (rafRef.current) {
                        cancelAnimationFrame(rafRef.current);
                        rafRef.current = 0;
                    }
                    if (idleAnimationRef.current) {
                        cancelAnimationFrame(idleAnimationRef.current);
                        idleAnimationRef.current = 0;
                    }
                }}
                crossOrigin="anonymous"
            />

            {/* Rating Modal */}
            {ratingModal && currentUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-lg cardSurface animate-slide-up">
                        <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-zinc-100">Rate This Mix</h2>
                            <button 
                                onClick={() => {
                                    setRatingModal(null);
                                    setSelectedRating(0);
                                    setRatingComment('');
                                    setHoverRating(0);
                                }}
                                className="text-zinc-400 hover:text-zinc-200"
                            >
                                <span className="text-2xl">×</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-lg text-zinc-300 mb-2">"{ratingModal.sampleTitle}"</p>
                            <p className="text-sm text-zinc-400 mb-6">How would you rate this mix?</p>
                            
                            <div className="flex justify-center items-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setSelectedRating(star)}
                                        className="p-1 transition-transform hover:scale-110"
                                    >
                                        <StarIcon 
                                            className={`w-10 h-10 transition-colors ${
                                                (hoverRating || selectedRating) >= star 
                                                    ? 'text-yellow-400 fill-yellow-400' 
                                                    : 'text-zinc-600'
                                            }`} 
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                rows={3}
                                className="w-full p-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 mb-4"
                                placeholder="Share your thoughts about this mix... (optional)"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setRatingModal(null);
                                        setSelectedRating(0);
                                        setRatingComment('');
                                        setHoverRating(0);
                                    }}
                                    className="flex-1 px-4 py-2 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors"
                                    disabled={isSubmittingRating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRateSample}
                                    disabled={!selectedRating || isSubmittingRating}
                                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MixingSamplePlayer;
