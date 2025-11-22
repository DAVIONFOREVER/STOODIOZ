

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
                const audio = audioRef.current;
                // FIX: Corrected property 'audioUrl' to 'audio_url' to match the 'MixingSample' type definition.
                audio.src = sample.audio_url;
                audio.load(); // Explicitly load the new source
                audio.play().catch(e => console.error("Audio play failed:", e));
                setPlayingId(sample.id);
            }
        }
    };

    if (!mixingSamples || mixingSamples.length === 0) {
        return (
            <div className="bg-zinc-800 rounded-2xl p-8 border border-zinc-700 text-center">
                <p className="text-zinc-400">This engineer hasn't uploaded any mixing samples yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg border border-zinc-700">
            <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
            <h2 className="text-2xl font-bold text-slate-100 p-6 border-b border-zinc-700">Mixing Samples</h2>
            <div className="divide-y divide-zinc-700">
                {mixingSamples.map(sample => (
                    <div key={sample.id} className="p-4 flex items-center gap-4 hover:bg-zinc-700/50">
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