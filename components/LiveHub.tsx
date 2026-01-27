import React from 'react';
import LiveRoomCard from './LiveRoomCard';

interface LiveHubProps {
    onStartLive: () => void;
    onJoinLive: (roomId: string) => void;
}

const LiveHub: React.FC<LiveHubProps> = ({ onStartLive, onJoinLive }) => {
    const rooms = [
        { id: 'aria-room', title: 'Aria Cantata Listening Room', host: 'Aria Cantata', listeners: 128 },
        { id: 'beat-lab', title: 'Beat Lab Live Mix', host: 'Stoodioz', listeners: 72 },
    ];

    return (
        <div className="cardSurface p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-orange-400 font-semibold">Live</p>
                    <h3 className="text-lg font-bold text-zinc-100 mt-1">Live Chat Rooms</h3>
                </div>
                <button
                    onClick={onStartLive}
                    className="rounded-full bg-orange-500 text-white text-xs font-semibold px-4 py-2 hover:bg-orange-400 transition-colors"
                >
                    Open Live Chat
                </button>
            </div>
            <div className="space-y-3">
                {rooms.map(room => (
                    <LiveRoomCard
                        key={room.id}
                        title={room.title}
                        host={room.host}
                        listeners={room.listeners}
                        onJoin={() => onJoinLive(room.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default LiveHub;
