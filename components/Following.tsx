import React from 'react';
import type { Stoodio, Engineer, Artist } from '../types';
import { UserCheckIcon, LocationIcon } from './icons';

interface FollowingProps {
    studios: Stoodio[];
    engineers: Engineer[];
    artists: Artist[];
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist', id: string) => void;
    onSelectStudio: (studio: Stoodio) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
}

const Following: React.FC<FollowingProps> = ({ studios, engineers, artists, onToggleFollow, onSelectStudio, onSelectArtist, onSelectEngineer }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
            <h1 className="text-2xl font-bold mb-6 text-slate-900">Following</h1>

            <div className="space-y-8">
                {/* Followed Studios */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">Stoodioz</h2>
                    {studios.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {studios.map(studio => (
                                <div key={studio.id} className="bg-slate-50 rounded-xl p-3 flex items-center gap-4 border border-slate-200">
                                    <img src={studio.imageUrl} alt={studio.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-grow">
                                        <button onClick={() => onSelectStudio(studio)} className="font-bold text-slate-800 hover:text-orange-500 transition-colors text-left">{studio.name}</button>
                                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                                            <LocationIcon className="w-4 h-4"/>
                                            {studio.location}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow('stoodio', studio.id)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-100 text-orange-600"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">You're not following any stoodioz yet.</p>
                    )}
                </div>

                {/* Followed Engineers */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">Engineers</h2>
                     {engineers.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {engineers.map(engineer => (
                                <div key={engineer.id} className="bg-slate-50 rounded-xl p-3 flex items-center gap-4 border border-slate-200">
                                    <img src={engineer.imageUrl} alt={engineer.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-grow">
                                        <button onClick={() => onSelectEngineer(engineer)} className="font-bold text-slate-800 hover:text-orange-500 transition-colors text-left">{engineer.name}</button>
                                        <p className="text-sm text-slate-500 truncate">{engineer.specialties.join(', ')}</p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow('engineer', engineer.id)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-100 text-orange-600"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">You're not following any engineers yet.</p>
                    )}
                </div>

                 {/* Followed Artists */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">Artists</h2>
                     {artists.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {artists.map(artist => (
                                <div key={artist.id} className="bg-slate-50 rounded-xl p-3 flex items-center gap-4 border border-slate-200">
                                    <img src={artist.imageUrl} alt={artist.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-grow">
                                        <button onClick={() => onSelectArtist(artist)} className="font-bold text-slate-800 hover:text-orange-500 transition-colors text-left">{artist.name}</button>
                                        <p className="text-sm text-slate-500 truncate">{artist.bio.substring(0,50)}...</p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow('artist', artist.id)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-100 text-orange-600"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">You're not following any artists yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Following;