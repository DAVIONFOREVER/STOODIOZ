
import React, { useState, useMemo } from 'react';
// FIX: Import missing types
import type { Engineer, Review, Artist, Stoodio, Producer } from '../types';
import { UserRole } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, StarIcon, CogIcon, CalendarIcon, LinkIcon, UsersIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon, MusicNoteIcon } from './icons.tsx';
import PostFeed from './PostFeed.tsx';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';
import { useNavigation } from '../hooks/useNavigation.ts';
import { useSocial } from '../hooks/useSocial.ts';
import { useMessaging } from '../hooks/useMessaging.ts';
import { useBookings } from '../hooks/useBookings.ts';
import { useMasterclass } from '../hooks/useMasterclass.ts';
import MixingSamplePlayer from './MixingSamplePlayer.tsx';
import MasterclassCard from './MasterclassCard.tsx';

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
            {/* FIX: Corrected property name from 'imageUrl' to 'image_url' */}
            <img src={profile.image_url} alt={profile.name} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};


const EngineerProfile: React.FC = () => {
    const { selectedEngineer, currentUser, reviews, artists, engineers, stoodioz, producers } = useAppState();
    const dispatch = useAppDispatch();
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile } = useNavigation();
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(useNavigation().navigate);
    const { initiateBookingWithEngineer } = useBookings(useNavigation().navigate);
    const { openPurchaseMasterclassModal, openWatchMasterclassModal } = useMasterclass();

    const engineer = selectedEngineer;

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('12:00');

    if (!engineer) {
        return (
            <div className="text-center text-zinc-400">
                <p>Engineer not found.</p>
                <button onClick={goBack} className="mt-4 text-orange-400">Go Back</button>
            </div>
        );
    }
    
    const isFollowing = currentUser ? ('following' in currentUser && (currentUser.following.engineers || []).includes(engineer.id)) : false;

    // FIX: Corrected property name from 'engineerId' to 'engineer_id'
    const engineerReviews = reviews.filter(r => r.engineer_id === engineer.id);
    
    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    // FIX: Corrected property name from 'followerIds' to 'follower_ids' to match the type definition.
    const followers = useMemo(() => allUsers.filter(u => (engineer.follower_ids || []).includes(u.id)), [allUsers, engineer.follower_ids]);

    const followedArtists = useMemo(() => artists.filter(a => (engineer.following?.artists || []).includes(a.id)), [artists, engineer.following?.artists]);
    const followedEngineers = useMemo(() => engineers.filter(e => (engineer.following?.engineers || []).includes(e.id)), [engineers, engineer.following?.engineers]);
    const followedStoodioz = useMemo(() => stoodioz.filter(s => (engineer.following?.stoodioz || []).includes(s.id)), [stoodioz, engineer.following?.stoodioz]);
    const followedProducers = useMemo(() => producers.filter(p => (engineer.following?.producers || []).includes(p.id)), [producers, engineer.following?.producers]);
    const followingCount = followedArtists.length + followedEngineers.length + followedStoodioz.length + followedProducers.length;

    const sortedPosts = useMemo(() => (engineer.posts || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [engineer.posts]);

    const handleBookClick = () => {
        initiateBookingWithEngineer(engineer, date, time);
    };

    const onOpenMixingModal = () => dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: true } });

    // FIX: Corrected property name from 'mixingServices' to 'mixing_services' and 'isEnabled' to 'is_enabled'
    const canRequestMix = engineer.mixing_services?.is_enabled && currentUser && currentUser.id !== engineer.id;


    return (
        <div>
            <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Engineers
            </button>
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="p-8 cardSurface">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                        {/* FIX: Corrected property name from 'imageUrl' to 'image_url' */}
                        <img src={engineer.image_url} alt={engineer.name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-zinc-700 flex-shrink-0" />
                        <div className="text-center sm:text-left flex-grow">
                            <h1 className="text-4xl font-extrabold text-orange-500">{engineer.name}</h1>
                            <div className="flex items-center justify-center sm:justify-start gap-1 text-yellow-400 mt-2">
                                <StarIcon className="w-5 h-5" />
                                <span className="font-bold text-lg text-slate-200">{(engineer.rating_overall ?? 0).toFixed(1)}</span>
                                <span className="text-slate-400 text-sm">({engineerReviews.length} reviews)</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed mt-4">{engineer.bio}</p>
                            <div className="flex justify-center sm:justify-start flex-wrap gap-2 mt-6">
                                {canRequestMix && (
                                    <button onClick={onOpenMixingModal} className="px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-indigo-500 text-white hover:bg-indigo-600">
                                        <SoundWaveIcon className="w-5 h-5"/> Request Mix
                                    </button>
                                )}
                                <button 
                                    onClick={() => currentUser && startConversation(engineer)}
                                    disabled={!currentUser || currentUser.id === engineer.id}
                                    className="px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MessageIcon className="w-5 h-5" />
                                    Message
                                </button>
                                <button 
                                    onClick={() => currentUser && toggleFollow('engineer', engineer.id)}
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
                            {(engineer.specialties || []).map(spec => (
                                <span key={spec} className="bg-zinc-700 text-slate-200 text-sm font-medium px-3 py-1.5 rounded-full">{spec}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FIX: Corrected property name from 'isEnabled' to 'is_enabled' */}
                {engineer.masterclass?.is_enabled && (
                    <MasterclassCard 
                        masterclass={engineer.masterclass}
                        owner={engineer}
                        onPurchase={openPurchaseMasterclassModal}
                        onWatch={openWatchMasterclassModal}
                    />
                )}
                
                <div>
                    {/* FIX: Corrected property name from 'mixingSamples' to 'mixing_samples' */}
                    <MixingSamplePlayer mixingSamples={engineer.mixing_samples || []} />
                </div>

                 <div className="p-8 cardSurface">
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><CalendarIcon className="w-6 h-6"/>Book an In-Studio Session</h3>
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
                                <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.url} className="p-3 transition-colors flex items-center gap-3 cardSurface">
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
                        authors={new Map([[engineer.id, engineer]])}
                        onLikePost={likePost}
                        onCommentOnPost={commentOnPost}
                        onSelectAuthor={() => viewEngineerProfile(engineer)}
                     />
                </div>
            </div>
        </div>
    );
};

export default EngineerProfile;
