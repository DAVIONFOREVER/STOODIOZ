import React, { useState, useRef } from 'react';
import type { Instrumental } from '../types';
import { PlayIcon, PauseIcon, DownloadIcon, DollarSignIcon, MusicNoteIcon } from './icons';

interface InstrumentalPlayerProps {
    instrumentals: Instrumental[];
    onInquire: (instrumental: Instrumental) => void;
}

const InstrumentalPlayer: React.FC<InstrumentalPlayerProps> = ({ instrumentals, onInquire }) => {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handlePlayPause = (instrumental: Instrumental) => {
        if (playingId === instrumental.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = instrumental.audioUrl;
                audioRef.current.play();
                setPlayingId(instrumental.id);
            }
        }
    };

    if (instrumentals.length === 0) {
        return (
            <div className="bg-zinc-800 rounded-2xl p-8 border border-zinc-700 text-center">
                <p className="text-zinc-400">This producer hasn't uploaded any instrumentals yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg border border-zinc-700">
             <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
            <h2 className="text-2xl font-bold text-slate-100 p-6 border-b border-zinc-700">Beat Store</h2>
            <div className="divide-y divide-zinc-700">
                {instrumentals.map(instrumental => (
                    <div key={instrumental.id} className="p-4 flex flex-col sm:flex-row items-center gap-4 hover:bg-zinc-700/50">
                        {instrumental.coverArtUrl ? (
                            <img src={instrumental.coverArtUrl} alt={instrumental.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-20 h-20 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                <MusicNoteIcon className="w-10 h-10 text-zinc-500" />
                            </div>
                        )}
                        <button onClick={() => handlePlayPause(instrumental)} className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition-colors flex-shrink-0">
                            {playingId === instrumental.id ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                        </button>
                        <div className="flex-grow text-center sm:text-left">
                            <p className="font-bold text-lg text-slate-100">{instrumental.title}</p>
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-1">
                                {instrumental.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-center">
                                <p className="text-xs text-zinc-400">Lease</p>
                                <p className="font-semibold text-green-400">${instrumental.priceLease.toFixed(2)}</p>
                            </div>
                             <div className="text-center">
                                <p className="text-xs text-zinc-400">Exclusive</p>
                                <p className="font-semibold text-green-400">${instrumental.priceExclusive.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {instrumental.isFreeDownloadAvailable ? (
                                <a href={instrumental.audioUrl} download={`${instrumental.title} (Free).mp3`} className="bg-zinc-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-zinc-600 transition-colors text-sm flex items-center gap-1.5">
                                    <DownloadIcon className="w-4 h-4" />
                                    Free
                                </a>
                            ) : (
                                <a href={instrumental.audioUrl} download={`${instrumental.title} (Tagged Sample).mp3`} className="p-2 text-zinc-400 hover:text-orange-400 rounded-full bg-zinc-700" title="Download Sample (Tagged)">
                                    <DownloadIcon className="w-5 h-5"/>
                                </a>
                            )}
                             <button onClick={() => onInquire(instrumental)} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center gap-1.5">
                                <DollarSignIcon className="w-4 h-4" />
                                Purchase
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InstrumentalPlayer;