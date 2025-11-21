
import React, { useMemo, useState, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Post } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, UsersIcon, MicrophoneIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, PhotoIcon, PlayIcon } from './icons';
import PostFeed from './PostFeed';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { fetchUserPosts } from '../services/apiService';

const ProfileCard: React.FC<{
    profile: Stoodio | Engineer | Artist | Producer;
    type: 'stoodio' | 'engineer' | 'artist' | 'producer';
    onClick: () => void;
}> = ({ profile, type, onClick }) => {
    let icon;
    let details;
    if (type === 'stoodio') {
        icon = <HouseIcon className="w-4 h-4" />;
        details = (profile as Stoodio).location;
    } else if (type === 'engineer') {
        icon = <SoundWaveIcon className="w-4 h-4" />;
        details = (profile as Engineer).specialties.join(', ');
    } else if (type === 'producer') {
        icon = <MusicNoteIcon className="w-4 h-4" />;
        details = (profile as Producer).genres.join(', ');
    } else { // artist
        icon = <MicrophoneIcon className="w-4 h-4" />;
        details = (profile as Artist).bio;
    }

    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 p-2 text-left cardSurface">
            {/* FIX: Corrected property name from 'imageUrl' to 'image_url' */}
            <img src={profile.image_url} alt={profile.name} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};

const ArtistProfile: React.FC = () => {
    const { 
        selectedArtist, 
        currentUser,
        artists,
        engineers,
        stoodioz,
        producers,
    } = useAppState();

    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile } = useNavigation();
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(useNavigation().navigate);

    const artist = selectedArtist;
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        if (artist?.id) {
            // Fetch fresh posts for the public profile
            fetchUserPosts(artist.id).then(setPosts);
        }
    }, [artist?.id]);

    const mediaItems = useMemo(() => {
        return posts.filter(p => p.image_url || p.video_url).map(p => ({
            id: p.id,
            url: p.image_url || p.video_thumbnail_url || '',
            type: p.video_url ? 'video' : 'image'
        }));
    }, [posts]);

    if (!artist) {
        return (
            <div className="text-center text-zinc-400">
                <p>Artist not found.</p>
                <button onClick={goBack} className="mt-4 text-orange-400">Go Back</button>
            </div>
        );
    }
    
    const isFollowing = currentUser ? ('following' in currentUser && (currentUser.following.artists || []).includes(artist.id)) : false;
    
    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    // FIX: Corrected property name from 'followerIds' to 'follower_ids' to match the type definition.
    const followers = useMemo(() => allUsers.filter(u => (artist.follower_ids || []).includes(u.id)), [allUsers, artist.follower_ids]);

    const followedArtists = useMemo(() => artists.filter(a => (artist.following?.artists || []).includes(a.id)), [artists, artist.following?.artists]);
    const followedEngineers = useMemo(() => engineers.filter(e => (artist.following?.engineers || []).includes(e.id)), [engineers, artist.following?.engineers]);
    const followedStoodioz = useMemo(() => stoodioz.filter(s => (artist.following?.stoodioz || []).includes(s.id)), [stoodioz, artist.following?.stoodioz]);
    const followedProducers = useMemo(() => producers.filter(p => (artist.following?.producers || []).includes(p.id)), [producers, artist.following?.producers]);
    const followingCount = followedArtists.length + followedEngineers.length + followedStoodioz.length + followedProducers.length;

    return (
        <div>
            <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Artists
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Left Column: Info & Feed */}
                <div className="lg:col-span-3">
                     <img 
                        src={artist.cover_image_url || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop'} 
                        alt={`${artist.name}'s cover`}
                        className="w-full h-64 object-cover rounded-2xl mb-6 shadow-lg"
                    />

                     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-4">
                        <div className="flex items-start gap-4">
                             <img src={artist.image_url} alt={artist.name} className="w-24 h-24 rounded-full object-cover border-4 border-zinc-700 -mt-12 shadow-lg flex-shrink-0" />
                             <div>
                                <h1 className="text-4xl font-extrabold text-orange-500">{artist.name}</h1>
                                <p className="text-zinc-400 mt-1">Remote</p>
                            </div>
                        </div>
                         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => currentUser && startConversation(artist)}
                                disabled={!currentUser || currentUser.id === artist.id}
                                className="w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MessageIcon className="w-5 h-5" />
                                Message
                            </button>
                            <button 
                                onClick={() => currentUser && toggleFollow('artist', artist.id)}
                                disabled={!currentUser || currentUser.id === artist.id || artist.id === 'artist-aria-cantata'}
                                className={`flex-shrink-0 w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-orange-400 border-2 border-orange-400 hover:bg-zinc-600'}`}
                            >
                                {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed mt-4 mb-8">{artist.bio}</p>

                    {/* Recent Media Gallery */}
                    {mediaItems.length > 0 && (
                        <div className="mb-10">
                            <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2">
                                <PhotoIcon className="w-6 h-6 text-orange-400" /> Recent Media
                            </h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {mediaItems.slice(0, 8).map(item => (
                                    <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 group cursor-pointer">
                                        <img src={item.url} alt="Media" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        {item.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                                                <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-10">
                         <h3 className="text-2xl font-bold mb-4 text-slate-100">Posts</h3>
                         <PostFeed 
                            posts={posts}
                            authors={new Map([[artist.id, artist]])}
                            onLikePost={likePost}
                            onCommentOnPost={commentOnPost}
                            onSelectAuthor={() => viewArtistProfile(artist)}
                         />
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <div className="lg:col-span-2 space-y-8">
                     {artist.links && artist.links.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2"><LinkIcon className="w-5 h-5" /> Links</h3>
                            <div className="space-y-3">
                                {artist.links.map(link => (
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.url} className="p-3 transition-colors flex items-center gap-3 cardSurface hover:bg-zinc-800">
                                        <LinkIcon className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                                        <div className="overflow-hidden">
                                            <p className="font-semibold text-sm text-slate-200 truncate">{link.title}</p>
                                            <p className="text-xs text-slate-400 truncate">{link.url}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UsersIcon className="w-5 h-5" /> Followers ({followers.length})</h3>
                        {followers.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {followers.slice(0, 5).map(f => {
                                    const type = 'amenities' in f ? 'stoodio' : 'specialties' in f ? 'engineer' : 'instrumentals' in f ? 'producer' : 'artist';
                                    const onClick = () => {
                                        if (type === 'artist') viewArtistProfile(f as Artist);
                                        else if (type === 'engineer') viewEngineerProfile(f as Engineer);
                                        else if (type === 'stoodio') viewStoodioDetails(f as Stoodio);
                                        else if (type === 'producer') viewProducerProfile(f as Producer);
                                    };
                                    return <ProfileCard key={f.id} profile={f} type={type} onClick={onClick} />;
                                })}
                            </div>
                        ) : <p className="text-slate-400">No followers yet.</p>}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UserCheckIcon className="w-5 h-5" /> Following ({followingCount})</h3>
                        {followingCount > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => viewArtistProfile(p)} />)}
                                {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => viewEngineerProfile(p)} />)}
                                {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => viewStoodioDetails(p)} />)}
                                {followedProducers.map(p => <ProfileCard key={p.id} profile={p} type="producer" onClick={() => viewProducerProfile(p)} />)}
                            </div>
                        ) : <p className="text-slate-400">Not following anyone yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistProfile;
