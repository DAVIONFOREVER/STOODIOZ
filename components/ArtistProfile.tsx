import React, { useMemo } from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, UsersIcon, MicrophoneIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon } from './icons';
import PostFeed from './PostFeed';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import ProfileHeroHeader from './ProfileHeroHeader';

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
        <button onClick={onClick} className="w-full flex items-center gap-3 bg-black/50 p-2 rounded-lg hover:bg-zinc-800 transition-colors text-left border border-orange-500/10 hover:border-orange-500/20">
            <img src={profile.imageUrl} alt={profile.name} className="w-12 h-12 rounded-md object-cover" />
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
    const followers = useMemo(() => allUsers.filter(u => artist.followerIds.includes(u.id)), [allUsers, artist.followerIds]);

    const followedArtists = useMemo(() => artists.filter(a => artist.following.artists.includes(a.id)), [artists, artist.following.artists]);
    const followedEngineers = useMemo(() => engineers.filter(e => artist.following.engineers.includes(e.id)), [engineers, artist.following.engineers]);
    const followedStoodioz = useMemo(() => stoodioz.filter(s => artist.following.stoodioz.includes(s.id)), [stoodioz, artist.following.stoodioz]);
    const followedProducers = useMemo(() => producers.filter(p => artist.following.producers.includes(p.id)), [producers, artist.following.producers]);
    const followingCount = followedArtists.length + followedEngineers.length + followedStoodioz.length + followedProducers.length;

    const sortedPosts = useMemo(() => (artist.posts || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [artist.posts]);

    return (
        <div>
            <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
                 <ProfileHeroHeader profile={artist} />
            </div>

            <div className="max-w-4xl mx-auto space-y-12">
                 <div className="flex justify-center flex-wrap gap-2">
                    <button 
                        onClick={() => currentUser && startConversation(artist)}
                        disabled={!currentUser || currentUser.id === artist.id}
                        className="px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-800 text-slate-100 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageIcon className="w-5 h-5" />
                        Message
                    </button>
                    <button 
                        onClick={() => currentUser && toggleFollow('artist', artist.id)}
                        disabled={!currentUser || currentUser.id === artist.id || artist.id === 'artist-aria-cantata'}
                        className={`flex-shrink-0 px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-orange-400 border-2 border-orange-400 hover:bg-zinc-700'}`}
                    >
                        {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                </div>
                
                 {artist.links && artist.links.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><LinkIcon className="w-6 h-6" /> Links</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {artist.links.map(link => (
                                <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.url} className="bg-black/50 p-3 rounded-lg hover:bg-zinc-800 transition-colors border border-orange-500/20 flex items-center gap-3">
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
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Followers ({followers.length})</h3>
                    {followers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {followers.map(f => {
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
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UserCheckIcon className="w-6 h-6" /> Following ({followingCount})</h3>
                    {followingCount > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => viewArtistProfile(p)} />)}
                            {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => viewEngineerProfile(p)} />)}
                            {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => viewStoodioDetails(p)} />)}
                            {followedProducers.map(p => <ProfileCard key={p.id} profile={p} type="producer" onClick={() => viewProducerProfile(p)} />)}
                        </div>
                    ) : <p className="text-slate-400">Not following anyone yet.</p>}
                </div>

                <div>
                     <h3 className="text-2xl font-bold mb-4 text-slate-100">Posts</h3>
                     <PostFeed 
                        posts={sortedPosts}
                        authors={new Map([[artist.id, artist]])}
                        onLikePost={likePost}
                        onCommentOnPost={commentOnPost}
                        onSelectAuthor={() => viewArtistProfile(artist)}
                     />
                </div>
            </div>
        </div>
    );
};

export default ArtistProfile;
