import React, { useMemo } from 'react';
import LiveRoomCard from './LiveRoomCard';
import { useLiveRooms } from '../hooks/useLiveRooms';
import { useAppState } from '../contexts/AppContext';

interface LiveHubProps {
    onStartLive: () => void;
    onJoinLive: (roomId: string) => void;
}

const LiveHub: React.FC<LiveHubProps> = ({ onStartLive, onJoinLive }) => {
    const { rooms, isLoading } = useLiveRooms();
    const { currentUser, artists, engineers, stoodioz, producers, labels } = useAppState();

    const usersMap = useMemo(() => {
        const allUsers = [
            ...(artists ?? []),
            ...(engineers ?? []),
            ...(stoodioz ?? []),
            ...(producers ?? []),
            ...(labels ?? []),
        ];
        if (currentUser) allUsers.push(currentUser);
        const map = new Map<string, any>();
        allUsers.forEach(u => u?.id && map.set(u.id, u));
        return map;
    }, [artists, engineers, stoodioz, producers, labels, currentUser]);

    const resolveHostName = (hostId: string) => {
        const host = usersMap.get(hostId);
        return host?.name || 'Live Host';
    };

    const filteredRooms = useMemo(() => {
        const MAX_STALE_HOURS = 6;
        return (rooms || []).filter((room) => {
            const host = usersMap.get(room.host_id);
            if (!host) return false;
            if (host?.is_shadow) return false;
            if (!room.created_at) return true;
            const ageMs = Date.now() - new Date(room.created_at).getTime();
            const ageHours = ageMs / (1000 * 60 * 60);
            const listeners = room.listeners || 0;
            // Hide stale rooms with no real activity
            if (ageHours > MAX_STALE_HOURS && listeners <= 1) return false;
            return true;
        });
    }, [rooms, usersMap]);

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
                {isLoading && (
                    <p className="text-sm text-zinc-400">Loading live rooms...</p>
                )}
                {!isLoading && filteredRooms.length === 0 && (
                    <p className="text-sm text-zinc-400">No live rooms yet. Start the first one.</p>
                )}
                {filteredRooms.map(room => (
                    <LiveRoomCard
                        key={room.id}
                        title={room.title}
                        host={resolveHostName(room.host_id)}
                        listeners={room.listeners || 0}
                        onJoin={() => onJoinLive(room.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default LiveHub;
