

import React, { useState, useMemo } from 'react';
import type { Stoodio, Artist, Review, Booking, Engineer, Post, Room } from '../types';
import { UserRole } from '../types';
import Calendar from './Calendar';
import PostFeed from './PostFeed';
import { ChevronLeftIcon, PhotoIcon, UserPlusIcon, UserCheckIcon, StarIcon, UsersIcon, MessageIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon, DollarSignIcon, LinkIcon } from './icons';

interface StoodioDetailProps {
    stoodio: Stoodio;
    reviews: Review[];
    bookings: Booking[];
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onBook: (date: string, time: string, room: Room) => void;
    onBack: () => void;
    currentUser: Artist | Engineer | Stoodio | null;
    userRole: UserRole | null;
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist', id: string) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onStartConversation: (participant: Stoodio | Artist | Engineer) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
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


const StoodioDetail: React.FC<StoodioDetailProps> = ({ stoodio, reviews, bookings, allArtists, allEngineers, allStoodioz, onBook, onBack, currentUser, userRole, onToggleFollow, onSelectArtist, onSelectEngineer, onSelectStoodio, onStartConversation, onLikePost, onCommentOnPost }) => {
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string, time: string } | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(stoodio.rooms[0] || null);

    const isFollowing = currentUser && 'following' in currentUser ? (currentUser.following.stoodioz || []).includes(stoodio.id) : false;

    const stoodioReviews = reviews.filter(r => r.stoodioId === stoodio.id);
    
    const allUsers = useMemo(() => [...allArtists, ...allEngineers, ...allStoodioz], [allArtists, allEngineers, allStoodioz]);
    const followers = useMemo(() => allUsers.filter(u => stoodio.followerIds.includes(u.id)), [allUsers, stoodio.followerIds]);
    const followedArtists = useMemo(() => allArtists.filter(a => stoodio.following.artists.includes(a.id)), [allArtists, stoodio.following.artists]);
    const followedEngineers = useMemo(() => allEngineers.filter(e => stoodio.following.engineers.includes(e.id)), [allEngineers, stoodio.following.engineers]);
    const followedStoodioz = useMemo(() => allStoodioz.filter(s => stoodio.following.stoodioz.includes(s.id)), [allStoodioz, stoodio.following.stoodioz]);
    const followingCount = followedArtists.length + followedEngineers.length + followedStoodioz.length;

    const handleSelectTimeSlot = (date: string, time: string) => {
        if (selectedTimeSlot?.date === date && selectedTimeSlot?.time === time) {
             setSelectedTimeSlot(null); // Deselect if clicking the same slot
        } else {
            setSelectedTimeSlot({ date, time });
        }
    };

    const isBookingDisabled = !selectedTimeSlot || !selectedRoom || !currentUser || userRole === UserRole.STOODIO;
    const sortedPosts = useMemo(() => (stoodio.posts || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [stoodio.posts]);


    const getButtonText = (mobile: boolean = false) => {
        if (!currentUser) return 'Login to Book';
        if (userRole === UserRole.STOODIO) return 'Stoodioz Cannot Book';
        if (!selectedRoom) return 'Select a Room';
        if (!selectedTimeSlot) return 'Select a Time Slot';
        return mobile ? `Book for ${selectedTimeSlot.time}` : `Book ${selectedRoom.name}: ${selectedTimeSlot.time}`;
    };
    
    return (
        <div>
             <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Stoodioz
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Left Column: Stoodio Info */}
                <div className="lg:col-span-3 space-y-12">
                    <div>
                        <img src={stoodio.imageUrl} alt={stoodio.name} className="w-full h-80 object-cover rounded-2xl mb-6 shadow-lg" />
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-4">
                            <div>
                                <h1 className="text-5xl font-extrabold text-orange-500">{stoodio.name}</h1>
                                <p className="text-slate-400 mt-2">{stoodio.location} &middot; {stoodio.followers.toLocaleString()} followers</p>
                            </div>
                             <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button 
                                    onClick={() => currentUser && onStartConversation(stoodio)}
                                    disabled={!currentUser}
                                    className="w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MessageIcon className="w-5 h-5" />
                                    Message
                                </button>
                                <button 
                                    onClick={() => currentUser && onToggleFollow('stoodio', stoodio.id)}
                                    disabled={!currentUser}
                                    className={`flex-shrink-0 w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-orange-400 border-2 border-orange-400 hover:bg-zinc-600'}`}
                                >
                                    {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{stoodio.description}</p>
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-orange-400">Amenities</h3>
                        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-slate-200">
                            {stoodio.amenities.map(amenity => (
                                <li key={amenity} className="flex items-center">
                                    <svg className="w-5 h-5 mr-3 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                    {amenity}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><SoundWaveIcon className="w-6 h-6" /> In-House Engineers</h3>
                        {(stoodio.inHouseEngineers && stoodio.inHouseEngineers.length > 0) ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {stoodio.inHouseEngineers.map(info => {
                                    const engineer = allEngineers.find(e => e.id === info.engineerId);
                                    if (!engineer) return null;
                                    return (
                                        <div key={engineer.id} className="bg-zinc-800 rounded-xl p-3 flex items-center gap-4 border border-zinc-700 hover:border-orange-500/50 transition-colors">
                                            <img src={engineer.imageUrl} alt={engineer.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                            <div className="flex-grow">
                                                <button onClick={() => onSelectEngineer(engineer)} className="font-bold text-slate-200 hover:text-orange-400 transition-colors text-left">{engineer.name}</button>
                                                <p className="text-sm text-slate-400 truncate">{engineer.specialties.join(', ')}</p>
                                                <div className="text-sm font-semibold text-green-400 flex items-center gap-1 mt-1">
                                                    <DollarSignIcon className="w-4 h-4" /> ${info.payRate}/hr
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-400">This studio uses freelance engineers from the platform.</p>
                        )}
                    </div>

                     {stoodio.links && stoodio.links.length > 0 && (
                        <div>
                            <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><LinkIcon className="w-6 h-6" /> Links</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {stoodio.links.map(link => (
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
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Followers ({followers.length})</h3>
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
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><UserCheckIcon className="w-6 h-6" /> Following ({followingCount})</h3>
                        {followingCount > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => onSelectArtist(p)} />)}
                                {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => onSelectEngineer(p)} />)}
                                {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => onSelectStoodio(p)} />)}
                            </div>
                        ) : <p className="text-slate-400">Not following anyone yet.</p>}
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-orange-400">Posts & Updates</h3>
                        <PostFeed 
                            posts={sortedPosts}
                            authors={new Map([[stoodio.id, stoodio]])}
                            onLikePost={onLikePost}
                            onCommentOnPost={onCommentOnPost}
                            currentUser={currentUser}
                        />
                    </div>
                </div>

                {/* Right Column: Calendar and Booking */}
                <div className="lg:col-span-2">
                    <div className="bg-zinc-800 p-6 rounded-2xl shadow-lg border border-zinc-700 sticky top-28">
                        <h2 className="text-3xl font-bold mb-4 text-center text-slate-100">Book a Room</h2>
                        <div className="space-y-4 mb-6">
                            {stoodio.rooms.map(room => (
                                <button key={room.id} onClick={() => setSelectedRoom(room)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedRoom?.id === room.id ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-slate-100">{room.name}</span>
                                        <span className="font-bold text-lg text-orange-400">${room.hourlyRate}/hr</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{room.description}</p>
                                </button>
                            ))}
                        </div>

                        <Calendar 
                            availability={stoodio.availability}
                            bookings={bookings}
                            onSelectTimeSlot={handleSelectTimeSlot}
                            selectedTimeSlot={selectedTimeSlot}
                        />
                        <div className="hidden lg:block mt-6">
                            <button 
                                onClick={() => selectedTimeSlot && selectedRoom && onBook(selectedTimeSlot.date, selectedTimeSlot.time, selectedRoom)}
                                disabled={isBookingDisabled}
                                className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none shadow-lg">
                                {getButtonText()}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky bottom bar for mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-sm p-4 border-t border-zinc-700 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                 <button 
                    onClick={() => selectedTimeSlot && selectedRoom && onBook(selectedTimeSlot.date, selectedTimeSlot.time, selectedRoom)}
                    disabled={isBookingDisabled}
                    className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none shadow-lg">
                    {getButtonText(true)}
                </button>
            </div>
        </div>
    );
};

export default StoodioDetail;