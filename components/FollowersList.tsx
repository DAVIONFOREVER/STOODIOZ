import React from 'react';
import type { Stoodio, Engineer, Artist } from '../types';
import { UserRole } from '../types';
import { HouseIcon, SoundWaveIcon, MicrophoneIcon } from './icons';

interface FollowersListProps {
    followers: (Stoodio | Engineer | Artist)[];
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
}

const FollowersList: React.FC<FollowersListProps> = ({ followers, onSelectStoodio, onSelectArtist, onSelectEngineer }) => {

    const handleSelect = (user: Stoodio | Engineer | Artist) => {
        if ('amenities' in user) { // Stoodio
            onSelectStoodio(user);
        } else if ('specialties' in user) { // Engineer
            onSelectEngineer(user);
        } else { // Artist
            onSelectArtist(user);
        }
    }

    const getRoleInfo = (user: Stoodio | Engineer | Artist) => {
        if ('amenities' in user) {
            return { role: 'Stoodio', icon: <HouseIcon className="w-4 h-4 text-red-500"/> };
        } else if ('specialties' in user) {
            return { role: 'Engineer', icon: <SoundWaveIcon className="w-4 h-4 text-orange-500"/> };
        } else {
            return { role: 'Artist', icon: <MicrophoneIcon className="w-4 h-4 text-green-500"/> };
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
            <h1 className="text-2xl font-bold mb-6 text-slate-900">Followers ({followers.length})</h1>
            {followers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map(user => {
                        const { role, icon } = getRoleInfo(user);
                        return (
                            <button 
                                key={user.id} 
                                onClick={() => handleSelect(user)}
                                className="bg-slate-50 rounded-xl p-3 flex items-center gap-4 border border-slate-200 hover:border-orange-400 transition-colors text-left w-full"
                            >
                                <img src={user.imageUrl} alt={user.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-800">{user.name}</p>
                                    <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                                        {icon}
                                        {role}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <p className="text-slate-500 text-sm">No followers yet.</p>
            )}
        </div>
    );
};

export default FollowersList;