// FIX: Implemented the EngineerProfile component which was previously a placeholder file, causing import errors.
import React, { useState, useMemo } from 'react';
import type { Engineer, Review, Artist, Stoodio, UserRole, Booking, Location } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, StarIcon, CogIcon, CalendarIcon, RoadIcon, LinkIcon, UsersIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon } from './icons';
import PostFeed from './PostFeed';

interface EngineerProfileProps {
    engineer: Engineer;
    onBack: () => void;
    reviews: Review[];
    onToggleFollow: (type: 'engineer', id: string) => void;
    isFollowing: boolean;
    userRole: UserRole | null;
    bookings: Booking[];
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onStartNavigation: (location: Location) => void;
    onStartConversation: (participant: Engineer) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
    onInitiateBooking: (engineer: Engineer, date: string, time: string) => void;
}

const ProfileCard: React.FC<{
    profile: Stoodio | Engineer | Artist;
    type: 'stoodio' | 'engineer' | 'artist';
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
    } else {
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


const EngineerProfile: React.FC<EngineerProfileProps> = (props) => {
    const { engineer, onBack, reviews, onToggleFollow, isFollowing, currentUser, onStartConversation, onLikePost, onCommentOnPost, onInitiateBooking, onStartNavigation, allArtists, allEngineers, allStoodioz, onSelectArtist, onSelectEngineer, onSelectStoodio } = props;
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('12:00');

    const engineerReviews = reviews.filter(r => r.engineerId === engineer.id);
    
    const allUsers = useMemo(() => [...allArtists, ...allEngineers, ...allStoodioz], [allArtists, allEngineers, allStoodioz]);
    const followers = useMemo(() => allUsers.filter(u => engineer.followerIds.includes(u.id)), [allUsers, engineer.followerIds]);

    const followedArtists = useMemo(() => allArtists.filter(a => engineer.following.artists.includes(a.id)), [allArtists, engineer.following.artists]);
    const followedEngineers = useMemo(() => allEngineers.filter(e => engineer.following.engineers.includes(e.id)), [allEngineers, engineer.following.engineers]);
    const followedStoodioz = useMemo(() => allStoodioz.filter(s => engineer.following.stoodioz.includes(s.id)), [allStoodioz, engineer.following.stoodioz]);
    const followingCount = followedArtists.length + followedEngineers.length + followedStoodioz.length;

    const sortedPosts = useMemo(() => (engineer.posts || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [engineer.posts]);

    const handleBookClick = () => {
        onInitiateBooking(engineer, date, time);
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Engineers
            </button>
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-8 border border-zinc-700">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                        <img src={engineer.imageUrl} alt={engineer.name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-zinc-700 flex-shrink-0" />
                        <div className="text-center sm:text-left flex-grow">
                            <h1 className="text-4xl font-extrabold text-orange-500">{engineer.name}</h1>
                            <div className="flex items-center justify-center sm:justify-start gap-1 text-yellow-400 mt-2">
                                <StarIcon className="w-5 h-5" />
                                <span className="font-bold text-lg text-slate-200">{engineer.rating.toFixed(1)}</span>
                                <span className="text-slate-400 text-sm">({engineerReviews.length} reviews)</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed mt-4">{engineer.bio}</p>
                            <div className="flex justify-center sm:justify-start gap-2 mt-6">
                                <button
                                    onClick={() => onStartNavigation(engineer.coordinates)}
                                    className="px-4 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RoadIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => currentUser && onStartConversation(engineer)}
                                    disabled={!currentUser || currentUser.id === engineer.id}
                                    className="px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MessageIcon className="w-5 h-5" />
                                    Message
                                </button>
                                <button 
                                    onClick={() => currentUser && onToggleFollow('engineer', engineer.id)}
                                    disabled={!currentUser || currentUser.id === engineer.id}
                                    className={`flex-shrink-0 px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-orange-400 border-2 border-orange-400 hover:bg-zinc-600'}`}
                                >
                                    {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        </div>
                    </div>
                     <div className="border-t border-zinc-700 my-6"></div>
                     <div>
                        <h3 className="text-xl font-bold mb-3 text-orange-400 flex items-center gap-2"><CogIcon className="w-6 h-6"/>Specialties</h3>
                        <div className="flex flex-wrap gap-2">
                            {engineer.specialties.map(spec => (
                                <span key={spec} className="bg-zinc-700 text-slate-200 text-sm font-medium px-3 py-1.5 rounded-full">{spec}</span>
                            ))}
                        </div>
                    </div>
                </div>

                 <div className="bg-zinc-800 rounded-2xl shadow-lg p-8 border border-zinc-700">
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><CalendarIcon className="w-6 h-6"/>Book a Session</h3>
                    <div className="grid sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-zinc-700 border-zinc-600 rounded-lg p-2.5" />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-slate-400 mb-1">Time</label>
                             <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 rounded-lg p-2.5" />
                        </div>
                        <button onClick={handleBookClick} disabled={!currentUser} className="w-full sm:col-span-1 bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-all disabled:bg-slate-500 disabled:cursor-not-allowed">
                            Find a Stoodio
                        </button>
                    </div>
                </div>

                 {engineer.links && engineer.links.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><LinkIcon className="w-6 h-6" /> Links</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {engineer.links.map(link => (
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
                                const type = 'amenities' in f ? 'stoodio' : 'specialties' in f ? 'engineer' : 'artist';
                                const onClick = () => type === 'artist' ? onSelectArtist(f as Artist) : type === 'engineer' ? onSelectEngineer(f as Engineer) : onSelectStoodio(f as Stoodio);
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
                            {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => onSelectEngineer(p)} />)}
                            {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => onSelectStoodio(p)} />)}
                        </div>
                    ) : <p className="text-slate-400">Not following anyone yet.</p>}
                </div>
                
                <div>
                     <h3 className="text-2xl font-bold mb-4 text-slate-100">Posts</h3>
                     <PostFeed 
                        posts={sortedPosts}
                        authors={new Map([[engineer.id, engineer]])}
                        onLikePost={onLikePost}
                        onCommentOnPost={onCommentOnPost}
                        currentUser={currentUser}
                     />
                </div>
            </div>
        </div>
    );
};

export default EngineerProfile;