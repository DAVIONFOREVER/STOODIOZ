import React, { useMemo } from 'react';
import type { Producer, Review, Artist, Stoodio, UserRole, Engineer } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, UsersIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon, DollarSignIcon, CalendarIcon, MusicNoteIcon } from './icons';
import PostFeed from './PostFeed';
import InstrumentalPlayer from './InstrumentalPlayer';

interface ProducerProfileProps {
    producer: Producer;
    onBack: () => void;
    reviews: Review[];
    onToggleFollow: (type: 'producer' | 'stoodio' | 'engineer' | 'artist', id: string) => void;
    isFollowing: boolean;
    userRole: UserRole | null;
    onStartConversation: (participant: Producer) => void;
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    allProducers: Producer[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectProducer: (producer: Producer) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | Producer | null;
    onInitiateBookingWithProducer: (producer: Producer) => void;
}

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
        <button onClick={onClick} className="w-full flex items-center gap-3 bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 transition-colors text-left">
            <img src={profile.imageUrl} alt={profile.name} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};

const ProducerProfile: React.FC<ProducerProfileProps> = (props) => {
    const { producer, onBack, onToggleFollow, isFollowing, currentUser, onStartConversation, onLikePost, onCommentOnPost, allArtists, allEngineers, allStoodioz, allProducers, onSelectArtist, onSelectEngineer, onSelectStoodio, onSelectProducer, onInitiateBookingWithProducer } = props;
    
    const allUsers = useMemo(() => [...allArtists, ...allEngineers, ...allStoodioz, ...allProducers], [allArtists, allEngineers, allStoodioz, allProducers]);
    const followers = useMemo(() => allUsers.filter(u => producer.followerIds.includes(u.id)), [allUsers, producer.followerIds]);

    const followedArtists = useMemo(() => allArtists.filter(a => producer.following.artists.includes(a.id)), [allArtists, producer.following.artists]);
    const followedEngineers = useMemo(() => allEngineers.filter(e => producer.following.engineers.includes(e.id)), [allEngineers, producer.following.engineers]);
    const followedStoodioz = useMemo(() => allStoodioz.filter(s => producer.following.stoodioz.includes(s.id)), [allStoodioz, producer.following.stoodioz]);
    const followedProducers = useMemo(() => allProducers.filter(p => producer.following.producers.includes(p.id)), [allProducers, producer.following.producers]);
    const followingCount = followedArtists.length + followedEngineers.length + followedStoodioz.length + followedProducers.length;

    const sortedPosts = useMemo(() => (producer.posts || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [producer.posts]);

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Producers
            </button>
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-8 border border-zinc-700">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                        <img src={producer.imageUrl} alt={producer.name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-zinc-700 flex-shrink-0" />
                        <div className="text-center sm:text-left flex-grow">
                            <h1 className="text-4xl font-extrabold text-purple-400">{producer.name}</h1>
                            <p className="text-slate-300 leading-relaxed mt-4">{producer.bio}</p>
                             {producer.pullUpPrice && (
                                <div className="mt-4 inline-block bg-green-500/10 text-green-300 font-bold py-2 px-4 rounded-lg">
                                    <span className="flex items-center gap-2">
                                        <DollarSignIcon className="w-5 h-5"/>
                                        <span>"Pull Up" Session Fee: ${producer.pullUpPrice}</span>
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-center sm:justify-start flex-wrap gap-2 mt-6">
                                {producer.pullUpPrice && currentUser && (
                                     <button 
                                        onClick={() => onInitiateBookingWithProducer(producer)}
                                        className="px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                     >
                                        <CalendarIcon className="w-5 h-5" />
                                        Book Pull Up Session
                                    </button>
                                )}
                                <button 
                                    onClick={() => currentUser && onStartConversation(producer)}
                                    disabled={!currentUser || currentUser.id === producer.id}
                                    className="px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MessageIcon className="w-5 h-5" />
                                    Message
                                </button>
                                <button 
                                    onClick={() => currentUser && onToggleFollow('producer', producer.id)}
                                    disabled={!currentUser || currentUser.id === producer.id}
                                    className={`flex-shrink-0 px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-purple-500 text-white' : 'bg-zinc-700 text-purple-400 border-2 border-purple-400 hover:bg-zinc-600'}`}
                                >
                                    {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <InstrumentalPlayer instrumentals={producer.instrumentals} onInquire={(instrumental) => { /* TODO: Implement inbox inquiry */ }} />
                
                 {producer.links && producer.links.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><LinkIcon className="w-6 h-6" /> Links</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {producer.links.map(link => (
                                <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.url} className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center gap-3">
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
                                    if (type === 'artist') onSelectArtist(f as Artist);
                                    else if (type === 'engineer') onSelectEngineer(f as Engineer);
                                    else if (type === 'stoodio') onSelectStoodio(f as Stoodio);
                                    else if (type === 'producer') onSelectProducer(f as Producer);
                                }
                                return <ProfileCard key={f.id} profile={f} type={type} onClick={onClick} />;
                            })}
                        </div>
                    ) : <p className="text-slate-400">No followers yet.</p>}
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UserCheckIcon className="w-6 h-6" /> Following ({followingCount})</h3>
                    {followingCount > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => onSelectArtist(p)} />)}
                            {followedProducers.map(p => <ProfileCard key={p.id} profile={p} type="producer" onClick={() => onSelectProducer(p)} />)}
                            {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => onSelectEngineer(p)} />)}
                            {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => onSelectStoodio(p)} />)}
                        </div>
                    ) : <p className="text-slate-400">Not following anyone yet.</p>}
                </div>
                
                <div>
                     <h3 className="text-2xl font-bold mb-4 text-slate-100">Posts</h3>
                     <PostFeed 
                        posts={sortedPosts}
                        authors={new Map([[producer.id, producer]])}
                        onLikePost={onLikePost}
                        onCommentOnPost={onCommentOnPost}
                        currentUser={currentUser}
                     />
                </div>
            </div>
        </div>
    );
};

export default ProducerProfile;