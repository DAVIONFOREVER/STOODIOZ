import React from 'react';
import type { Stoodio, Engineer, Artist, Producer } from '../types';
import { UserCheckIcon, LocationIcon, MusicNoteIcon } from './icons';

interface FollowingProps {
    studios: Stoodio[];
    engineers: Engineer[];
    artists: Artist[];
    producers: Producer[];
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist' | 'producer', id: string) => void;
    onSelectStudio: (studio: Stoodio) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectProducer: (producer: Producer) => void;
}

const Following: React.FC<FollowingProps> = ({ studios, engineers, artists, producers, onToggleFollow, onSelectStudio, onSelectArtist, onSelectEngineer, onSelectProducer }) => {
    return (
        <div className="p-6 cardSurface">
            <h1 className="text-2xl font-bold mb-6 text-zinc-100">Following</h1>

            <div className="space-y-8">
                {/* Followed Studios */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-zinc-300">Stoodioz</h2>
                    {studios.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {studios.map(studio => (
                                <div key={studio.id} className="cardSurface p-3 flex items-center gap-4">
                                    <img src={studio.imageUrl} alt={studio.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-grow">
                                        <button onClick={() => onSelectStudio(studio)} className="font-bold text-zinc-200 hover:text-orange-400 transition-colors text-left">{studio.name}</button>
                                        <p className="text-sm text-zinc-400 flex items-center gap-1.5 mt-1">
                                            <LocationIcon className="w-4 h-4"/>
                                            {studio.location}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow('stoodio', studio.id)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500/20 text-orange-300"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">You're not following any stoodioz yet.</p>
                    )}
                </div>

                {/* Followed Engineers */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-zinc-300">Engineers</h2>
                     {engineers.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {engineers.map(engineer => (
                                <div key={engineer.id} className="cardSurface p-3 flex items-center gap-4">
                                    <img src={engineer.imageUrl} alt={engineer.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-grow">
                                        <button onClick={() => onSelectEngineer(engineer)} className="font-bold text-zinc-200 hover:text-orange-400 transition-colors text-left">{engineer.name}</button>
                                        <p className="text-sm text-zinc-400 truncate">{engineer.specialties.join(', ')}</p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow('engineer', engineer.id)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500/20 text-orange-300"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">You're not following any engineers yet.</p>
                    )}
                </div>

                 {/* Followed Artists */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-zinc-300">Artists</h2>
                     {artists.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {artists.map(artist => (
                                <div key={artist.id} className="cardSurface p-3 flex items-center gap-4">
                                    <img src={artist.imageUrl} alt={artist.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-grow">
                                        <button onClick={() => onSelectArtist(artist)} className="font-bold text-zinc-200 hover:text-orange-400 transition-colors text-left">{artist.name}</button>
                                        <p className="text-sm text-zinc-400 truncate">{artist.bio.substring(0,50)}...</p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow('artist', artist.id)}
                                        disabled={artist.id === 'artist-aria-cantata'}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500/20 text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">You're not following any artists yet.</p>
                    )}
                </div>

                {/* Followed Producers */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-zinc-300">Producers</h2>
                     {producers.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {producers.map(producer => (
                                <div key={producer.id} className="cardSurface p-3 flex items-center gap-4">
                                    <img src={producer.imageUrl} alt={producer.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-grow">
                                        <button onClick={() => onSelectProducer(producer)} className="font-bold text-zinc-200 hover:text-orange-400 transition-colors text-left">{producer.name}</button>
                                        <p className="text-sm text-zinc-400 truncate">{producer.genres.join(', ')}</p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow('producer', producer.id)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500/20 text-orange-300"
                                    >
                                        <UserCheckIcon className="w-4 h-4" />
                                        Following
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">You're not following any producers yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Following;