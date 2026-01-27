import React from 'react';
import type { Stoodio, Engineer, Artist, Producer } from '../types';
import { HouseIcon, SoundWaveIcon, MicrophoneIcon, MusicNoteIcon } from './icons';
import { getProfileImageUrl } from '../constants';

interface FollowersListProps {
    followers: (Stoodio | Engineer | Artist | Producer)[];
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectProducer: (producer: Producer) => void;
}

const FollowersList: React.FC<FollowersListProps> = ({ followers, onSelectStoodio, onSelectArtist, onSelectEngineer, onSelectProducer }) => {

    const handleSelect = (user: Stoodio | Engineer | Artist | Producer) => {
        if ('amenities' in user) { // Stoodio
            onSelectStoodio(user);
        } else if ('specialties' in user) { // Engineer
            onSelectEngineer(user);
        } else if ('instrumentals' in user) { // Producer
            onSelectProducer(user);
        } else { // Artist
            onSelectArtist(user);
        }
    }

    const getRoleInfo = (user: Stoodio | Engineer | Artist | Producer) => {
        if ('amenities' in user) {
            return { role: 'Stoodio', icon: <HouseIcon className="w-4 h-4 text-red-400"/> };
        } else if ('specialties' in user) {
            return { role: 'Engineer', icon: <SoundWaveIcon className="w-4 h-4 text-orange-400"/> };
        } else if ('instrumentals' in user) {
            return { role: 'Producer', icon: <MusicNoteIcon className="w-4 h-4 text-purple-400"/> };
        } else {
            return { role: 'Artist', icon: <MicrophoneIcon className="w-4 h-4 text-green-400"/> };
        }
    }

    return (
        <div className="p-6 cardSurface">
            <h1 className="text-2xl font-bold mb-6 text-zinc-100">Followers ({followers.length})</h1>
            {followers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map(user => {
                        const { role, icon } = getRoleInfo(user);
                        return (
                            <button 
                                key={user.id} 
                                onClick={() => handleSelect(user)}
                                className="cardSurface p-3 flex items-center gap-4 text-left w-full"
                            >
                                {/* FIX: Corrected property 'imageUrl' to 'image_url' to match the user type definition. */}
                                <img src={getProfileImageUrl(user)} alt={user.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                <div className="flex-grow">
                                    <p className="font-bold text-zinc-200">{user.name}</p>
                                    <div className="text-sm text-zinc-400 flex items-center gap-1.5 mt-1">
                                        {icon}
                                        {role}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <p className="text-zinc-500 text-sm">No followers yet.</p>
            )}
        </div>
    );
};

export default FollowersList;