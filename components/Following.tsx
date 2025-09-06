import React from 'react';
// FIX: Changed type `Studio` to `Stoodio` to match the definition in types.ts.
import type { Stoodio, Engineer, Artist } from '../types';
import { UserCheckIcon, LocationIcon } from './icons';

interface FollowingProps {
    // FIX: Changed type `Studio` to `Stoodio`.
    studios: Stoodio[];
    engineers: Engineer[];
    artists: Artist[];
    // FIX: Changed type `'studio'` to `'stoodio'`.
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist', id: string) => void;
    // FIX: Changed type `Studio` to `Stoodio`.
    onSelectStudio: (studio: Stoodio) => void;
    onSelectArtist: (artist: Artist) => void;
}

const Following: React.FC<FollowingProps> = ({ studios, engineers, artists, onToggleFollow, onSelectStudio, onSelectArtist }) => {
    return (
        <div>
            <h1 className="text-5xl font-extrabold text-center mb-2 tracking-tight text-slate-100">Following</h1>
            <p className="text-center text-lg text-slate-400 mb-12">Your favorite stoodioz, engineers, and artists, all in one place.</p>

            <div className="space-y-12">
                {/* Followed Studios */}
                <div>
                    <h2 className="text-3xl font-bold mb-6 text-slate-100">Stoodioz</h2>
                    {studios.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {studios.map(studio => (
                                <div key={studio.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                    <img src={studio.imageUrl} alt={studio.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-grow">
                                        <button onClick={() => onSelectStudio(studio)} className="font-bold text-lg text-slate-100 hover:text-orange-400 transition-colors text-left">{studio.name}</button>
                                        <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                                            <LocationIcon className="w-4 h-4"/>
                                            {studio.location}
                                        </p>
                                    </div>
                                    <button 
                                        // FIX: Changed type `'studio'` to `'stoodio'`.
                                        onClick={() => onToggleFollow('stoodio', studio.id)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400">You're not following any stoodioz yet.</p>
                    )}
                </div>

                {/* Followed Engineers */}
                <div>
                    <h2 className="text-3xl font-bold mb-6 text-slate-100">Engineers</h2>
                     {engineers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {engineers.map(engineer => (
                                <div key={engineer.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                    <img src={engineer.imageUrl} alt={engineer.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className="font-bold text-lg text-slate-100">{engineer.name}</p>
                                        <p className="text-sm text-slate-400 truncate">{engineer.specialties.join(', ')}</p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow('engineer', engineer.id)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400">You're not following any engineers yet.</p>
                    )}
                </div>

                 {/* Followed Artists */}
                <div>
                    <h2 className="text-3xl font-bold mb-6 text-slate-100">Artists</h2>
                     {artists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {artists.map(artist => (
                                <div key={artist.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                    <img src={artist.imageUrl} alt={artist.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                    <div className="flex-grow">
                                        <button onClick={() => onSelectArtist(artist)} className="font-bold text-lg text-slate-100 hover:text-orange-400 transition-colors text-left">{artist.name}</button>
                                        <p className="text-sm text-slate-400 truncate">{artist.bio.substring(0,50)}...</p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow('artist', artist.id)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400">You're not following any artists yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Following;