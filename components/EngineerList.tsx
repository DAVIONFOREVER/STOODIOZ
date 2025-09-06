import React, { useState, useMemo } from 'react';
// FIX: Import UserRole as a value, not just a type, as it's used for enum value comparisons.
import { UserRole, type Engineer, type Artist, type Stoodio } from '../types';
import { StarIcon, UserGroupIcon, UserPlusIcon, UserCheckIcon, AudioIcon, SearchIcon } from './icons';

interface EngineerCardProps {
    engineer: Engineer;
    onToggleFollow: (type: 'engineer', id: string) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    isFollowing: boolean;
    showFollowButton: boolean;
}

const EngineerCard: React.FC<EngineerCardProps> = ({ engineer, onToggleFollow, onSelectEngineer, isFollowing, showFollowButton }) => {
    return (
        <div className="bg-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-orange-500/20 transition-all duration-300 flex flex-col group border border-zinc-700 hover:border-orange-500/50 p-6">
            <div className="flex items-start gap-4">
                <img 
                    className="w-24 h-24 rounded-xl object-cover" 
                    src={engineer.imageUrl} 
                    alt={engineer.name} 
                />
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h2
                            onClick={() => onSelectEngineer(engineer)}
                            className="text-2xl font-bold mb-1 text-slate-100 cursor-pointer hover:text-orange-400 transition-colors"
                        >
                            {engineer.name}
                        </h2>
                        {showFollowButton && (
                             <button 
                                onClick={() => onToggleFollow('engineer', engineer.id)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-slate-200 hover:bg-zinc-600'}`}
                            >
                                {isFollowing ? <UserCheckIcon className="w-4 h-4" /> : <UserPlusIcon className="w-4 h-4" />}
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 my-1">
                        <span className="flex items-center gap-1"><StarIcon className="w-4 h-4 text-yellow-400" /> {engineer.rating.toFixed(1)}</span>
                        <span className="flex items-center gap-1"><UserGroupIcon className="w-4 h-4" /> {engineer.sessionsCompleted} sessions</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mt-2 mb-3">{engineer.bio}</p>
                     <div className="flex flex-wrap gap-2 justify-start mb-4">
                        {engineer.specialties.map(spec => (
                            <span key={spec} className="bg-zinc-700 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">{spec}</span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <AudioIcon className="w-5 h-5 text-slate-400" />
                        <audio controls src={engineer.audioSampleUrl} className="w-full h-8"></audio>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface EngineerListProps {
    engineers: Engineer[];
    onSelectEngineer: (engineer: Engineer) => void;
    onToggleFollow: (type: 'engineer', id: string) => void;
    currentUser: Artist | Stoodio | Engineer | null;
    userRole: UserRole | null;
}

const EngineerList: React.FC<EngineerListProps> = ({ engineers, onSelectEngineer, onToggleFollow, currentUser, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEngineers = useMemo(() => {
        if (!searchTerm) {
            return engineers;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return engineers.filter(engineer => 
            engineer.name.toLowerCase().includes(lowercasedTerm) ||
            engineer.bio.toLowerCase().includes(lowercasedTerm) ||
            engineer.specialties.some(spec => spec.toLowerCase().includes(lowercasedTerm))
        );
    }, [engineers, searchTerm]);

    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">Find Engineers</h1>
            <p className="text-center text-lg text-slate-500 mb-12">Browse talented engineers to bring your sound to life.</p>

            <div className="max-w-2xl mx-auto mb-12">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-zinc-800 border border-zinc-700 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Search by name, specialty (e.g., Hip-Hop), or keyword..."
                    />
                </div>
            </div>

            {filteredEngineers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {filteredEngineers.map(engineer => {
                        const isFollowing = !!(currentUser && 'following' in currentUser && (currentUser.following.engineers || []).includes(engineer.id));
                        const showFollowButton = userRole !== UserRole.ENGINEER;
                        return (
                            <EngineerCard 
                                key={engineer.id} 
                                engineer={engineer}
                                onSelectEngineer={onSelectEngineer}
                                onToggleFollow={onToggleFollow}
                                isFollowing={isFollowing}
                                showFollowButton={showFollowButton}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-zinc-800 rounded-lg border border-zinc-700">
                    <h2 className="text-2xl font-semibold text-slate-100">No Engineers Found</h2>
                    <p className="text-slate-400 mt-2">Try adjusting your search terms to find the perfect match for your project.</p>
                </div>
            )}

             <style>{`
                audio::-webkit-media-controls-panel {
                  backgroundColor: #27272a;
                }
                audio::-webkit-media-controls-play-button,
                audio::-webkit-media-controls-volume-slider,
                audio::-webkit-media-controls-mute-button,
                audio::-webkit-media-controls-timeline {
                  filter: invert(1);
                }
            `}</style>
        </div>
    );
};

export default EngineerList;