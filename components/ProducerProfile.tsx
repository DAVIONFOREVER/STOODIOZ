
import React, { useMemo, useState } from 'react';
// FIX: Import missing types
import type { Producer, Artist, Stoodio, Engineer, Instrumental } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, UsersIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon, DollarSignIcon, CalendarIcon, MusicNoteIcon } from './icons';
import PostFeed from './PostFeed';
import InstrumentalPlayer from './InstrumentalPlayer';
import PurchaseBeatModal from './PurchaseBeatModal';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { useBookings } from '../hooks/useBookings';
import { AppView } from '../types';
import * as apiService from '../services/apiService';

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
        <button onClick={onClick} className="w-full flex items-center gap-3 p-2 text-left cardSurface">
            <img src={profile.image_url} alt={profile.name} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};

const ProducerProfile: React.FC = () => {
    const { selectedProducer, currentUser, artists, engineers, stoodioz, producers, userRole } = useAppState();
    const dispatch = useAppDispatch();
    
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, navigate } = useNavigation();
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(navigate);
    const { initiateBookingWithProducer } = useBookings(navigate);

    const [selectedBeat, setSelectedBeat] = useState<Instrumental | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const producer = selectedProducer;

    if (!producer) {
        return (
            <div className="text-center text-zinc-400">
                <p>Producer not found.</p>
                <button onClick={goBack} className="mt-4 text-orange-400">Go Back</button>
            </div>
        );
    }
    
    const isFollowing = currentUser ? ('following' in currentUser && (currentUser.following.producers || []).includes(producer.id)) : false;
    
    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    // FIX: Corrected property name from 'followerIds' to 'follower_ids' to match the type definition.
    const followers = useMemo(() => allUsers.filter(u => (producer.follower_ids || []).includes(u.id)), [allUsers, producer.follower_ids]);

    const followedArtists = useMemo(() => artists.filter(a => (producer.following?.artists || []).includes(a.id)), [artists, producer.following?.artists]);
    const followedEngineers = useMemo(() => engineers.filter(e => (producer.following?.engineers || []).includes(e.id)), [engineers, producer.following?.engineers]);
    const followedStoodioz = useMemo(() => stoodioz.filter(s => (producer.following?.stoodioz || []).includes(s.id)), [stoodioz, producer.following?.stoodioz]);
    const followedProducers = useMemo(() => producers.filter(p => (producer.following?.producers || []).includes(p.id)), [producers, producer.following?.producers]);
    const followingCount = followedArtists.length + followedEngineers.length + followedStoodioz.length + followedProducers.length;

    const sortedPosts = useMemo(() => (producer.posts || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [producer.posts]);

    const handlePurchaseClick = (instrumental: Instrumental) => {
        if (!currentUser) {
            navigate(AppView.LOGIN);
            return;
        }
        if (currentUser.id === producer.id) {
            alert("You cannot purchase your own beat.");
            return; 
        }
        setSelectedBeat(instrumental);
    };

    const confirmPurchase = async (type: 'lease' | 'exclusive') => {
        if (!currentUser || !selectedBeat || !userRole) return;

        setIsPurchasing(true);
        try {
            const { updatedBooking } = await apiService.purchaseBeat(selectedBeat, type, currentUser, producer, userRole);
            dispatch({ type: ActionTypes.ADD_BOOKING, payload: { booking: updatedBooking } });
            alert(`Purchase successful! "${selectedBeat.title}" has been added to 'My Bookings' where you can download the file.`);
            setSelectedBeat(null);
        } catch (error) {
            console.error("Purchase failed:", error);
            alert("Purchase failed. Please try again.");
        } finally {
            setIsPurchasing(false);
        }
    };
    
    const isSelf = currentUser?.id === producer.id;

    return (
        <div>
            <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Producers
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Left Column: Info & Beats */}
                <div className="lg:col-span-3 space-y-12">
                    <div className="cardSurface p-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                            <img src={producer.image_url} alt={producer.name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-zinc-700 flex-shrink-0" />
                            <div className="text-center sm:text-left flex-grow">
                                <h1 className="text-4xl font-extrabold text-purple-400">{producer.name}</h1>
                                <p className="text-slate-300 leading-relaxed mt-4">{producer.bio}</p>
                                 {/* FIX: Corrected property name from 'pullUpPrice' to 'pull_up_price' */}
                                 {producer.pull_up_price && (
                                    <div className="mt-4 inline-block bg-green-500/10 text-green-300 font-bold py-2 px-4 rounded-lg">
                                        <span className="flex items-center gap-2">
                                            <DollarSignIcon className="w-5 h-5"/>
                                            {/* FIX: Corrected property name from 'pullUpPrice' to 'pull_up_price' */}
                                            <span>"Pull Up" Session Fee: ${producer.pull_up_price}</span>
                                        </span>
                                    </div>
                                )}
                                {!isSelf && (
                                    <div className="flex justify-center sm:justify-start flex-wrap gap-2 mt-6">
                                        {/* FIX: Corrected property name from 'pullUpPrice' to 'pull_up_price' */}
                                        {producer.pull_up_price && currentUser && (
                                             <button 
                                                onClick={() => initiateBookingWithProducer(producer)}
                                                className="px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                             >
                                                <CalendarIcon className="w-5 h-5" />
                                                Book Pull Up Session
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => currentUser && startConversation(producer)}
                                            disabled={!currentUser}
                                            className="px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <MessageIcon className="w-5 h-5" />
                                            Message
                                        </button>
                                        <button 
                                            onClick={() => currentUser && toggleFollow('producer', producer.id)}
                                            disabled={!currentUser}
                                            className={`flex-shrink-0 px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-purple-500 text-white' : 'bg-zinc-700 text-purple-400 border-2 border-purple-400 hover:bg-zinc-600'}`}
                                        >
                                            {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <InstrumentalPlayer instrumentals={producer.instrumentals || []} onPurchase={handlePurchaseClick} />
                    
                     <div>
                         <h3 className="text-2xl font-bold mb-4 text-slate-100">Posts & Updates</h3>
                         <PostFeed 
                            posts={sortedPosts}
                            authors={new Map([[producer.id, producer]])}
                            onLikePost={likePost}
                            onCommentOnPost={commentOnPost}
                            onSelectAuthor={() => viewProducerProfile(producer)}
                         />
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <div className="lg:col-span-2 space-y-8">
                     {producer.links && producer.links.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2"><LinkIcon className="w-5 h-5" /> Links</h3>
                            <div className="space-y-3">
                                {producer.links.map(link => (
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
                            <div className="space-y-3">
                                {followers.slice(0, 5).map(f => {
                                    const type = 'amenities' in f ? 'stoodio' : 'specialties' in f ? 'engineer' : 'instrumentals' in f ? 'producer' : 'artist';
                                    const onClick = () => {
                                        if (type === 'artist') viewArtistProfile(f as Artist);
                                        else if (type === 'engineer') viewEngineerProfile(f as Engineer);
                                        else if (type === 'stoodio') viewStoodioDetails(f as Stoodio);
                                        else if (type === 'producer') viewProducerProfile(f as Producer);
                                    }
                                    return <ProfileCard key={f.id} profile={f} type={type} onClick={onClick} />;
                                })}
                            </div>
                        ) : <p className="text-slate-400">No followers yet.</p>}
                    </div>
                </div>
            </div>

            {selectedBeat && (
                <PurchaseBeatModal 
                    instrumental={selectedBeat}
                    producer={producer}
                    onClose={() => setSelectedBeat(null)}
                    onConfirm={confirmPurchase}
                    isLoading={isPurchasing}
                />
            )}
        </div>
    );
};

export default ProducerProfile;
