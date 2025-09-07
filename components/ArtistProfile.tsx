// FIX: Implemented the ArtistProfile component which was previously a placeholder file, causing import errors.
import React from 'react';
import type { Artist, Engineer, Stoodio, UserRole } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon } from './icons';
import PostFeed from './PostFeed';

interface ArtistProfileProps {
    artist: Artist;
    onBack: () => void;
    onToggleFollow: (type: 'artist' | 'stoodio' | 'engineer', id: string) => void;
    isFollowing: boolean;
    userRole: UserRole | null;
    onStartNavigation: () => void;
    onStartConversation: (participant: Artist) => void;
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
}

const ArtistProfile: React.FC<ArtistProfileProps> = (props) => {
    const { artist, onBack, onToggleFollow, isFollowing, currentUser, onStartConversation, onLikePost, onCommentOnPost } = props;
    
    const authorsMap = new Map<string, Artist | Engineer | Stoodio>([[artist.id, artist]]);

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Artists
            </button>
            <div className="max-w-4xl mx-auto">
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-8 border border-zinc-700">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                        <img src={artist.imageUrl} alt={artist.name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-zinc-700 flex-shrink-0" />
                        <div className="text-center sm:text-left flex-grow">
                            <h1 className="text-4xl font-extrabold text-orange-500">{artist.name}</h1>
                            <p className="text-slate-300 leading-relaxed mt-4">{artist.bio}</p>
                            <div className="flex justify-center sm:justify-start gap-2 mt-6">
                                <button 
                                    onClick={() => currentUser && onStartConversation(artist)}
                                    disabled={!currentUser || currentUser.id === artist.id}
                                    className="px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MessageIcon className="w-5 h-5" />
                                    Message
                                </button>
                                <button 
                                    onClick={() => currentUser && onToggleFollow('artist', artist.id)}
                                    disabled={!currentUser || currentUser.id === artist.id}
                                    className={`flex-shrink-0 px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-orange-400 border-2 border-orange-400 hover:bg-zinc-600'}`}
                                >
                                    {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8">
                     <h3 className="text-2xl font-bold mb-4 text-slate-100">Posts</h3>
                     <PostFeed 
                        posts={artist.posts || []}
                        authors={authorsMap}
                        onLikePost={onLikePost}
                        onCommentOnPost={onCommentOnPost}
                        currentUser={currentUser}
                     />
                </div>
            </div>
        </div>
    );
};

export default ArtistProfile;
