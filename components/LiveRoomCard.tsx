import React from 'react';
import { VideoCameraIcon, UsersIcon } from './icons';

interface LiveRoomCardProps {
    title: string;
    host: string;
    listeners: number;
    onJoin: () => void;
}

const LiveRoomCard: React.FC<LiveRoomCardProps> = ({ title, host, listeners, onJoin }) => {
    return (
        <button
            onClick={onJoin}
            className="w-full text-left rounded-2xl border border-zinc-800/70 bg-zinc-900/60 hover:bg-zinc-900 transition-colors p-4 flex items-start gap-3"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300">
                <VideoCameraIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-100">{title}</p>
                <p className="text-xs text-zinc-400">Hosted by {host}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                    <UsersIcon className="w-4 h-4" />
                    <span>{listeners} listening</span>
                </div>
            </div>
        </button>
    );
};

export default LiveRoomCard;
