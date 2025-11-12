import React, { useState, useMemo } from 'react';
import type { Stoodio, Artist, Engineer, Post, Room, Producer } from '../types';
import { UserRole, VerificationStatus, SmokingPolicy } from '../types';
import Calendar from './Calendar';
import PostFeed from './PostFeed';
import { ChevronLeftIcon, PhotoIcon, UserPlusIcon, UserCheckIcon, StarIcon, UsersIcon, MessageIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon, VerifiedIcon, MusicNoteIcon, SmokingIcon, NoSmokingIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useBookings } from '../hooks/useBookings';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { AppView } from '../types';

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
        details = (profile as Engineer).specialties?.join(', ');
    } else if (type === 'producer') {
        icon = <MusicNoteIcon className="w-4 h-4" />;
        details = (profile as Producer).genres?.join(', ');
    } else { // artist
        icon = <MicrophoneIcon className="w-4 h-4" />;
        details = (profile as Artist).bio;
    }

    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-left cardSurface">
            <img src={profile.imageUrl} alt={profile.name} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};


const StoodioDetail: React.FC = () => {
    const { selectedStoodio, reviews, bookings, artists, engineers, stoodioz, producers, currentUser, userRole } = useAppState();
    
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, navigate } = useNavigation();
    const { openBookingModal } = useBookings(navigate);
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(navigate);
    
    const stoodio = selectedStoodio;

    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string, time: string } | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(stoodio?.rooms[0] || null);
    
    if (!stoodio) {
         return (
            <div className="text-center text-zinc-400">
                <p>Stoodio not found.</p>
                <button onClick={goBack} className="mt-4 text-orange-400">Go Back</button>
            </div>
        );
    }

    const isFollowing = currentUser && 'following' in currentUser ? (currentUser.following.stoodioz || []).includes(stoodio.id) : false;

    const stoodioReviews = reviews.filter(r => r.stoodioId === stoodio.id);
    
    const hostedArtists = Array.from(new Set(bookings.filter(b => b.stoodio?.id === stoodio.id && b.artist).map(b => b.artist!.id)))
        .map(id => artists.find(a => a.id === id))
        .filter((artist): artist is Artist => artist !== undefined)
        .slice(0, 5);

    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    const followers = useMemo(() => allUsers.filter(u => stoodio.followerIds.includes(u.id)), [allUsers, stoodio.followerIds]);
    const followedArtists = artists.filter(a => stoodio.following.artists.includes(a.id));
    const followedEngineers = engineers.filter(e => stoodio.following.engineers.includes(e.id));
    const followedStoodioz = stoodioz.filter(s => stoodio.following.stoodioz.includes(s.id));
    const followedProducers = producers.filter(p => stoodio.following.producers.includes(p.id));

    const handleSelectTimeSlot = (date: string, time: string) => {
        if (selectedTimeSlot?.date === date && selectedTimeSlot?.time === time) {
             setSelectedTimeSlot(null); // Deselect if clicking the same slot
        } else {
            setSelectedTimeSlot({ date, time });
        }
    };
    
    const handleGuestInteraction = () => navigate(AppView.LOGIN);

    const onBook = (date: string, time: string, room: Room) => {
        if (currentUser) {
            openBookingModal(date, time, room);
        } else {
            handleGuestInteraction();
        }
    }

    const isBookingDisabled = !selectedTimeSlot || !selectedRoom || !currentUser || (userRole === UserRole.STOODIO && currentUser.id === stoodio.id);

    const getButtonText = (mobile: boolean = false) => {
        if (!currentUser) return 'Login to Book';
        if (userRole === UserRole.STOODIO) return 'Cannot Book a Stoodio';
        if (!selectedRoom) return 'Select a Room';
        if (!selectedTimeSlot) return 'Select a Time Slot';
        return mobile ? `Book for ${selectedTimeSlot.time}` : `Book ${selectedRoom.name}: ${selectedTimeSlot.time}`;
    };
    
    return (
        <div>
             <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Stoodioz
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Left Column: Stoodio Info */}
                <div className="lg:col-span-3">
                    <img src={stoodio.imageUrl} alt={stoodio.name} className="w-full h-80 object-cover rounded-2xl mb-6 shadow-lg" />
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-5xl font-extrabold text-orange-500">{stoodio.name}</h1>
                                {stoodio.verificationStatus === VerificationStatus.VERIFIED && (
                                    // FIX: The `title` attribute is not a valid prop for the `VerifiedIcon` component. The fix is to use an SVG `<title>` element for accessibility.
                                    <VerifiedIcon className="w-10 h-10 text-blue-500"><title>Verified Stoodio</title></VerifiedIcon>
                                )}
                            </div>
                            <p className="text-slate-400 mt-2">{stoodio.location} &middot; {stoodio.followers.toLocaleString()} followers</p>
                        </div>
                         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => currentUser ? startConversation(stoodio) : handleGuestInteraction()}
                                disabled={!currentUser || currentUser.id === stoodio.id}
                                className="w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MessageIcon className="w-5 h-5" />
                                Message
                            </button>
                            <button 
                                onClick={() => currentUser ? toggleFollow('stoodio', stoodio.id) : handleGuestInteraction()}
                                disabled={!currentUser || currentUser.id === stoodio.id}
                                className={`flex-shrink-0 w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-orange-400 border-2 border-orange-400 hover:bg-zinc-600'}`}
                            >
                                {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed mb-8">{stoodio.description}</p>
                    
                    <div className="flex gap-10">
                        <div>
                            <h3 className="text-2xl font-bold mb-4 text-orange-400">Amenities</h3>
                            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-slate-200 mb-10">
                                {stoodio.amenities.map(amenity => (
                                    <li key={amenity} className="flex items-center">
                                        <svg className="w-5 h-5 mr-3 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                        {amenity}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* FIX: Use selectedRoom.smokingPolicy instead of stoodio.smokingPolicy and make the block conditional. */}
                        {selectedRoom && (
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-orange-400">Policies for {selectedRoom.name}</h3>
                                <ul className="grid grid-cols-1 gap-y-3 text-slate-200 mb-10">
                                    <li className="flex items-center">
                                        {(selectedRoom.smokingPolicy === SmokingPolicy.SMOKING_ALLOWED)
                                            ? <SmokingIcon className="w-5 h-5 mr-3 text-green-400" />
                                            : <NoSmokingIcon className="w-5 h-5 mr-3 text-red-400" />
                                        }
                                        {(selectedRoom.smokingPolicy === SmokingPolicy.SMOKING_ALLOWED) ? 'Smoking Allowed' : 'Non-Smoking'}
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Posts & Updates */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400">Posts & Updates</h3>
                        <PostFeed posts={stoodio.posts || []} authors={new Map([[stoodio.id, stoodio]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={viewStoodioDetails} />
                    </div>

                     {/* Recently Hosted Artists */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Recently Hosted Artists</h3>
                        {hostedArtists.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {hostedArtists.map(artist => (
                                    <button key={artist.id} onClick={() => viewArtistProfile(artist)} className="flex items-center gap-3 bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                                        <img src={artist.imageUrl} alt={artist.name} className="w-10 h-10 rounded-md object-cover" />
                                        <span className="font-semibold text-sm text-slate-200">{artist.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400">Be the first to record here!</p>
                        )}
                    </div>

                     {/* Followers */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Followers</h3>
                        {followers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {followers.map(user => {
                                    const type = 'amenities' in user ? 'stoodio'
                                        : 'specialties' in user ? 'engineer'
                                        : 'instrumentals' in user ? 'producer'
                                        : 'artist';
                                    const onClick = () => {
                                        if (type === 'stoodio') viewStoodioDetails(user as Stoodio);
                                        else if (type === 'engineer') viewEngineerProfile(user as Engineer);
                                        else if (type === 'producer') viewProducerProfile(user as Producer)
                                        else viewArtistProfile(user as Artist);
                                    };
                                    return <ProfileCard key={user.id} profile={user} type={type} onClick={onClick} />;
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-400">No followers yet.</p>
                        )}
                    </div>

                    {/* Following */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><UserCheckIcon className="w-6 h-6" /> Following</h3>
                        {[...followedArtists, ...followedEngineers, ...followedStoodioz, ...followedProducers].length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => viewArtistProfile(p)} />)}
                                {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => viewEngineerProfile(p)} />)}
                                {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => viewStoodioDetails(p)} />)}
                                {followedProducers.map(p => <ProfileCard key={p.id} profile={p} type="producer" onClick={() => viewProducerProfile(p)} />)}
                            </div>
                        ) : (
                            <p className="text-slate-400">Not following anyone yet.</p>
                        )}
                    </div>

                    {/* Recent Reviews */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400">Recent Reviews</h3>
                        {stoodioReviews.length > 0 ? (
                            <ul className="space-y-5">
                                {stoodioReviews.map(review => {
                                    const artist = review.artistId ? artists.find(a => a.id === review.artistId) : null;
                                    return (
                                    <li key={review.id} className="border-b border-zinc-700 pb-4 last:border-b-0">
                                        <div className="flex justify-between items-center mb-1">
                                            {artist ? (
                                                <button onClick={() => viewArtistProfile(artist)} className="font-semibold text-slate-200 text-left hover:text-orange-400 transition-colors">
                                                    {review.reviewerName}
                                                </button>
                                            ) : (
                                                <p className="font-semibold text-slate-200">{review.reviewerName}</p>
                                            )}
                                            <div className="flex items-center gap-1 text-sm text-yellow-400">
                                                <StarIcon className="w-4 h-4" />
                                                <span className="font-bold">{review.rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-300">"{review.comment}"</p>
                                        <p className="text-xs text-slate-400 mt-2 text-right">{review.date}</p>
                                    </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-slate-400">No reviews yet for this stoodio.</p>
                        )}
                    </div>
                    
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><PhotoIcon className="w-6 h-6" /> Photo Gallery</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {stoodio.photos.map((photo, index) => (
                                <img key={index} src={photo} alt={`${stoodio.name} gallery image ${index + 1}`} className="w-full h-32 object-cover rounded-lg shadow-md transition-transform duration-300" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Calendar and Booking */}
                <div className="lg:col-span-2">
                    <div className="p-6 sticky top-28 cardSurface">
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
                                className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none shadow-lg">
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