import React, { useState, useRef } from 'react';
import type { MixingSample } from '../types';
import { PlayIcon, PauseIcon } from './icons';

interface MixingSamplePlayerProps {
    mixingSamples: MixingSample[];
}

const MixingSamplePlayer: React.FC<MixingSamplePlayerProps> = ({ mixingSamples }) => {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handlePlayPause = (sample: MixingSample) => {
        if (playingId === sample.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = sample.audioUrl;
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
                setPlayingId(sample.id);
            }
        }
    };

    if (!mixingSamples || mixingSamples.length === 0) {
        return (
            <div className="bg-black/50 backdrop-blur-md rounded-2xl p-8 border border-orange-500/20 text-center shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <p className="text-zinc-400">This engineer hasn't uploaded any mixing samples yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-black/50 backdrop-blur-md rounded-2xl shadow-[0_0_30px_rgba(249,115,22,0.15)] border border-orange-500/20">
            <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
            <h2 className="text-2xl font-bold text-slate-100 p-6 border-b border-orange-500/20">Mixing Samples</h2>
            <div className="divide-y divide-orange-500/20">
                {mixingSamples.map(sample => (
                    <div key={sample.id} className="p-4 flex items-center gap-4 hover:bg-zinc-900/50">
                        <button onClick={() => handlePlayPause(sample)} className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition-colors flex-shrink-0">
                            {playingId === sample.id ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                        </button>
                        <div className="flex-grow">
                            <p className="font-bold text-lg text-slate-100">{sample.title}</p>
                            <p className="text-sm text-slate-400">{sample.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MixingSamplePlayer;
