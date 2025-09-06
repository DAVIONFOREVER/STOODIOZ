
import React, { useState } from 'react';
import type { Engineer, Review, Artist, Booking, Stoodio, Comment, LinkAttachment, Post } from '../types';
import { UserRole } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, StarIcon, UsersIcon, UserGroupIcon, AudioIcon, MessageIcon, SoundWaveIcon, HouseIcon, MicrophoneIcon } from './icons';
import PostFeed from './PostFeed';
import Calendar from './Calendar';

interface EngineerProfileProps {
    engineer: Engineer;
    reviews: Review[];
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    bookings: Booking[];
    onBack: () => void;
    onToggleFollow: (type: 'engineer' | 'artist' | 'stoodio', id: string) => void;
    isFollowing: boolean;
    userRole: UserRole | null;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onStartNavigation: (engineer: Engineer) => void;
    onStartConversation: (participant: Stoodio | Artist | Engineer) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
    onInitiateBooking: (engineer: Engineer, date: string, time: string) => void;
}

type ProfileTab = 'reviews' | 'posts' | 'following' | 'followers' | 'links';

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
        <button onClick={onClick} className="w-full flex items-center gap-3 bg-zinc-700/50 p-3 rounded-lg hover:bg-zinc-700 transition-colors text-left">
            <img src={profile.imageUrl} alt={profile.name} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};

const EngineerProfile: React.FC<EngineerProfileProps> = (props) => {
    const { engineer, reviews, allArtists, allEngineers, allStoodioz, bookings, onBack, onToggleFollow, isFollowing, userRole, onSelectArtist, onSelectEngineer, onSelectStoodio, onStartConversation, onLikePost, onCommentOnPost, currentUser, onInitiateBooking } = props;
    const [activeTab, setActiveTab] = useState<ProfileTab>('reviews');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string, time: string } | null>(null);

    const handleSelectTimeSlot = (date: string, time: string) => {
        if (selectedTimeSlot?.date === date && selectedTimeSlot?.time === time) {
             setSelectedTimeSlot(null); // Deselect if clicking the same slot
        } else {
            setSelectedTimeSlot({ date, time });
        }
    };

    const TabButton: React.FC<{tab: ProfileTab, label: string}> = ({ tab, label }) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tab 
                ? 'bg-orange-500 text-white' 
                : 'text-slate-300 hover:bg-zinc-700'
            }`}
        >
            {label}
        </button>
    );

    const renderContent = () => {
        const engineerReviews = reviews.filter(r => !r.stoodioId); // Simple way to filter for now
        const collaboratedArtists = Array.from(new Set(bookings.filter(b => b.engineer?.id === engineer.id && b.artist).map(b => b.artist!.id)))
            .map(id => allArtists.find(a => a.id === id))
            .filter((artist): artist is Artist => artist !== undefined)
            .slice(0, 10);

        switch (activeTab) {
            case 'reviews':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold mb-4 text-slate-100">Recent Reviews</h2>
                            {engineerReviews.length > 0 ? (
                                <ul className="space-y-5">
                                    {engineerReviews.map(review => (
                                         <li key={review.id} className="border-b border-zinc-700 pb-4 last:border-b-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="font-semibold text-slate-200">{review.reviewerName}</p>
                                                <div className="flex items-center gap-1 text-sm text-yellow-400">
                                                    <StarIcon className="w-4 h-4" />
                                                    <span className="font-bold">{review.rating.toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-300">"{review.comment}"</p>
                                            <p className="text-xs text-slate-500 mt-2 text-right">{review.date}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400">No reviews yet for this engineer.</p>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-slate-100">Collaborated With</h2>
                            {collaboratedArtists.length > 0 ? (
                                <div className="space-y-3">
                                    {collaboratedArtists.map(artist => (
                                        <button key={artist.id} onClick={() => onSelectArtist(artist)} className="w-full flex items-center gap-3 bg-zinc-700/50 p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                                            <img src={artist.imageUrl} alt={artist.name} className="w-10 h-10 rounded-md object-cover" />
                                            <span className="font-semibold text-sm text-slate-200">{artist.name}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">No recent collaborations.</p>
                            )}
                        </div>
                    </div>
                );
            case 'posts':
                return <PostFeed 
                            posts={engineer.posts || []} 
                            authors={new Map([[engineer.id, engineer]])}
                            onLikePost={onLikePost}
                            onCommentOnPost={onCommentOnPost}
                            currentUser={currentUser}
                        />;
            case 'links':
                return engineer.links && engineer.links.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {engineer.links.map((link, index) => (
                             <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="p-4 bg-zinc-700/50 rounded-lg flex items-center gap-3 hover:bg-zinc-700 transition-colors">
                                <div className="w-8 h-8 bg-orange-500/20 rounded-md flex items-center justify-center">
                                    <SoundWaveIcon className="w-5 h-5 text-orange-400" />
                                </div>
                                <span className="font-semibold text-slate-200">{link.title}</span>
                            </a>
                        ))}
                    </div>
                ) : <div className="text-center text-slate-400 py-8">This engineer hasn't added any links yet.</div>;
            case 'following':
                const followedArtists = allArtists.filter(a => engineer.following.artists.includes(a.id));
                const followedEngineers = allEngineers.filter(e => engineer.following.engineers.includes(e.id));
                const followedStoodioz = allStoodioz.filter(s => engineer.following.stoodioz.includes(s.id));
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => onSelectStoodio(p)} />)}
                        {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => onSelectEngineer(p)} />)}
                        {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => onSelectArtist(p)} />)}
                    </div>
                );
            case 'followers':
                 const followers = allArtists.filter(a => a.following.engineers.includes(engineer.id));
                 return followers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followers.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => onSelectArtist(p)} />)}
                    </div>
                 ) : <div className="text-center text-slate-400 py-8">This engineer doesn't have any followers yet.</div>;
        }
    }
    
    const isBookerRoleAllowed = currentUser && (userRole === UserRole.ARTIST || userRole === UserRole.ENGINEER);
    const isBookingDisabled = !selectedTimeSlot || !isBookerRoleAllowed;
    const buttonText = !currentUser
        ? 'Login to Book'
        : !isBookerRoleAllowed
        ? 'Only Artists & Engineers can book'
        : selectedTimeSlot
        ? `Find a Stoodio for ${selectedTimeSlot.time}`
        : 'Select a Time Slot';


    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Engineers
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                 {/* Left Column: Engineer Info */}
                <div className="lg:col-span-3">
                    <div className="bg-zinc-800 rounded-2xl shadow-xl border border-zinc-700">
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                <img src={engineer.imageUrl} alt={engineer.name} className="w-40 h-40 rounded-xl object-cover shadow-lg border-4 border-zinc-700"/>
                                <div className="flex-grow text-center md:text-left">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-4">
                                        <div>
                                            <h1 className="text-5xl font-extrabold text-orange-500">{engineer.name}</h1>
                                            <div className="flex items-center justify-center md:justify-start flex-wrap gap-x-6 gap-y-2 text-slate-400 mt-2">
                                                <span className="flex items-center gap-1.5"><StarIcon className="w-5 h-5 text-yellow-400" /> {engineer.rating.toFixed(1)} Rating</span>
                                                <span className="flex items-center gap-1.5"><UserGroupIcon className="w-5 h-5" /> {engineer.sessionsCompleted} sessions</span>
                                                <span className="flex items-center gap-1.5"><UsersIcon className="w-5 h-5" /> {engineer.followers.toLocaleString()} followers</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => currentUser && onStartConversation(engineer)}
                                                disabled={!currentUser}
                                                className="w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50"
                                            >
                                                <MessageIcon className="w-5 h-5" />
                                                Message
                                            </button>
                                            {currentUser && userRole !== UserRole.ENGINEER && (
                                                <button
                                                    onClick={() => onToggleFollow('engineer', engineer.id)}
                                                    className={`w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-orange-400 border-2 border-orange-400 hover:bg-zinc-600'}`}
                                                >
                                                    {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                                    {isFollowing ? 'Following' : 'Follow'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed max-w-2xl mb-4">{engineer.bio}</p>
                                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                                        {engineer.specialties.map(spec => (
                                            <span key={spec} className="bg-zinc-700 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">{spec}</span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 max-w-md mx-auto md:mx-0">
                                        <AudioIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                        <audio controls src={engineer.audioSampleUrl} className="w-full h-8"></audio>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-t border-zinc-700 px-8 py-3 flex items-center gap-2">
                            <TabButton tab="reviews" label="Reviews & Collabs" />
                            <TabButton tab="posts" label="Posts" />
                            <TabButton tab="links" label="Links" />
                            <TabButton tab="following" label={`Following (${engineer.following.artists.length + engineer.following.engineers.length + engineer.following.stoodioz.length})`} />
                            <TabButton tab="followers" label={`Followers (${engineer.followerIds.length})`} />
                        </div>
                        
                        {/* Tab Content */}
                        <div className="p-8 border-t border-zinc-700 bg-zinc-800/50 rounded-b-2xl">
                            {renderContent()}
                        </div>
                    </div>
                </div>
                 {/* Right Column: Calendar and Booking */}
                 <div className="lg:col-span-2">
                    <div className="bg-zinc-800 p-6 rounded-2xl shadow-lg border border-zinc-700 sticky top-28">
                        <h2 className="text-2xl font-bold mb-4 text-center text-slate-100">Book a Session</h2>
                        <Calendar 
                            availability={engineer.availability || []}
                            onSelectTimeSlot={handleSelectTimeSlot}
                            selectedTimeSlot={selectedTimeSlot}
                        />
                        <div className="hidden lg:block mt-6">
                            <button 
                                onClick={() => selectedTimeSlot && onInitiateBooking(engineer, selectedTimeSlot.date, selectedTimeSlot.time)}
                                disabled={isBookingDisabled}
                                className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                            >
                                {buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Sticky bottom bar for mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-sm p-4 border-t border-zinc-700 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                 <button 
                    onClick={() => selectedTimeSlot && onInitiateBooking(engineer, selectedTimeSlot.date, selectedTimeSlot.time)}
                    disabled={isBookingDisabled}
                    className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                 >
                    {buttonText}
                </button>
            </div>
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

export default EngineerProfile;
