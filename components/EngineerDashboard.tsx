import React, { useState, useEffect } from 'react';
import type { Engineer, Review, Booking, Artist, Location, Stoodio, LinkAttachment, Comment, Post } from '../types';
import { BookingStatus } from '../types';
import { EditIcon, DollarSignIcon, StarIcon, CalendarIcon, ClockIcon, UsersIcon, SoundWaveIcon, UserCheckIcon, UserPlusIcon, UserGroupIcon, PhotoIcon, CloseCircleIcon, CheckCircleIcon, MessageIcon, LocationIcon, HouseIcon } from './icons';
import { calculateDistance } from '../utils/location';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import TheStage from './TheStage';

interface EngineerDashboardProps {
    engineer: Engineer;
    reviews: Review[];
    bookings: Booking[];
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onUpdateEngineer: (updatedProfile: Partial<Engineer>) => void;
    onAcceptBooking: (bookingId: string) => void;
    onDenyBooking: (bookingId: string) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onToggleFollow: (type: 'artist' | 'engineer' | 'stoodio', id: string) => void;
    onNavigateToStudio: (location: Location) => void;
    onStartConversation: (participant: Stoodio | Artist | Engineer) => void;
    onPost: (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
    onStartSession: (booking: Booking) => void;
}

type DashboardTab = 'dashboard' | 'find_artists' | 'following' | 'followers';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800 p-4 rounded-xl shadow-md flex items-center gap-4 border border-zinc-700">
        <div className="bg-orange-500/20 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

const JobCard: React.FC<{
    booking: Booking & { distance?: number };
    onAccept?: (id: string) => void;
    onDeny?: (id: string) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    isDirectRequest: boolean;
}> = ({ booking, onAccept, onDeny, onSelectArtist, onSelectStoodio, isDirectRequest }) => {
    const engineerPayout = booking.engineerPayRate * booking.duration;
    const distance = booking.distance || 0;

    const RequesterInfo: React.FC = () => {
        if (booking.artist) {
            return (
                <div className="flex items-center gap-3 mb-2 cursor-pointer group" onClick={() => onSelectArtist(booking.artist!)}>
                    <img src={booking.artist.imageUrl} alt={booking.artist.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                        <p className="font-bold text-slate-100 group-hover:text-orange-400 transition-colors">{booking.artist.name}</p>
                        <p className="text-sm text-slate-400">{booking.stoodio.location} ({distance.toFixed(1)} miles)</p>
                    </div>
                </div>
            );
        }
        // Studio posted job
        return (
             <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center">
                    <HouseIcon className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                    <p className="font-bold text-slate-100">Job Posted by Stoodio</p>
                    <p className="text-sm text-slate-400">{booking.stoodio.location} ({distance.toFixed(1)} miles)</p>
                </div>
            </div>
        );
    };

    return (
        <div className={`bg-zinc-800 rounded-2xl shadow-lg p-5 border-2 ${isDirectRequest ? 'border-orange-500/50' : 'border-zinc-700'}`}>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                     <RequesterInfo />
                    <button onClick={() => onSelectStoodio(booking.stoodio)} className="font-bold text-lg text-slate-100 hover:text-orange-400 transition-colors">{booking.stoodio.name}</button>
                    <div className="flex items-center gap-4 text-sm text-slate-300 mt-1">
                        <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4"/> {new Date(booking.date + 'T00:00:00').toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4"/> {booking.startTime} ({booking.duration} hrs)</span>
                    </div>
                     {booking.requiredSkills && booking.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                           {booking.requiredSkills.map(skill => <span key={skill} className="bg-zinc-700 text-slate-300 text-xs font-medium px-2 py-1 rounded-full">{skill}</span>)}
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                    <div>
                        <p className="text-slate-400 text-sm text-right">Payout</p>
                        <p className="text-2xl font-bold text-green-400">${engineerPayout.toFixed(2)}</p>
                        <p className="text-xs text-slate-400 text-right">(${booking.engineerPayRate}/hr)</p>
                    </div>
                    {isDirectRequest ? (
                        <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => onDeny?.(booking.id)} className="bg-red-500 text-white font-bold p-2 rounded-full hover:bg-red-600 transition-all shadow-md"><CloseCircleIcon className="w-6 h-6"/></button>
                            <button onClick={() => onAccept?.(booking.id)} className="bg-green-500 text-white font-bold p-2 rounded-full hover:bg-green-600 transition-all shadow-md"><CheckCircleIcon className="w-6 h-6"/></button>
                        </div>
                    ) : (
                        <button onClick={() => onAccept?.(booking.id)} className="mt-2 bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md">
                            Accept Job
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardContent: React.FC<Omit<EngineerDashboardProps, 'onToggleFollow' | 'onStartConversation' | 'allEngineers' | 'allStoodioz' | 'onSelectEngineer'>> = ({ engineer, reviews, bookings, onAcceptBooking, onDenyBooking, onSelectArtist, onSelectStoodio, allArtists, onNavigateToStudio, onPost, onLikePost, onCommentOnPost, currentUser, onStartSession, onUpdateEngineer }) => {
    const confirmedBookings = bookings.filter(b => b.engineer?.id === engineer.id && b.status === BookingStatus.CONFIRMED);
    const engineerReviews = reviews.filter(r => !r.stoodioId);

    const travelableDistance = 50;
    const directRequests = bookings
        .filter(b => b.status === BookingStatus.PENDING_APPROVAL && b.requestedEngineerId === engineer.id)
        .map(job => ({...job, distance: calculateDistance(engineer.coordinates, job.stoodio.coordinates)}));

    const openJobs = bookings.filter(b => b.status === BookingStatus.PENDING).map(job => ({
        ...job,
        distance: calculateDistance(engineer.coordinates, job.stoodio.coordinates)
    })).filter(job => job.distance <= travelableDistance);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                 {/* Create Post */}
                 <CreatePost currentUser={engineer} onPost={onPost} />
                 
                 {/* Post Feed */}
                 <PostFeed 
                    posts={engineer.posts || []} 
                    authors={new Map([[engineer.id, engineer]])}
                    onLikePost={onLikePost}
                    onCommentOnPost={onCommentOnPost}
                    currentUser={currentUser}
                />
                 
                 {/* Direct Requests */}
                 {directRequests.length > 0 && (
                    <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                        <h2 className="text-xl font-bold mb-4 text-slate-100">Direct Requests</h2>
                         <div className="space-y-4">
                            {directRequests.map(job => (
                                <JobCard key={job.id} booking={job} onAccept={onAcceptBooking} onDeny={onDenyBooking} onSelectArtist={onSelectArtist} onSelectStoodio={onSelectStoodio} isDirectRequest={true} />
                            ))}
                        </div>
                    </div>
                 )}

                 {/* Job Board */}
                {engineer.isAvailable && (
                    <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                        <h2 className="text-xl font-bold mb-4 text-slate-100">Job Board (Nearby)</h2>
                        {openJobs.length > 0 ? (
                            <div className="space-y-4">
                                {openJobs.map(job => (
                                    <JobCard key={job.id} booking={job} onAccept={onAcceptBooking} onSelectArtist={onSelectArtist} onSelectStoodio={onSelectStoodio} isDirectRequest={false} />
                                ))}
                            </div>
                        ) : (
                             <p className="text-slate-400 text-sm text-center py-4">No open session requests in your area. Check back soon!</p>
                        )}
                    </div>
                )}
                 <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                     <h3 className="text-xl font-bold text-slate-100 mb-4">Upcoming Confirmed Sessions</h3>
                     {confirmedBookings.length > 0 ? (
                        <ul className="space-y-4">
                            {confirmedBookings.map(booking => (
                                <li key={booking.id} className="p-3 bg-zinc-700/50 rounded-lg flex items-center justify-between gap-2">
                                    <div>
                                        <p className="font-semibold">{booking.stoodio.name}</p>
                                        <p className="text-sm text-slate-400">{new Date(booking.date + 'T00:00:00').toLocaleDateString()} at {booking.startTime}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-orange-400">+${(booking.engineerPayRate * booking.duration).toFixed(2)}</p>
                                        <p className="text-xs text-slate-500">Est. Payout</p>
                                    </div>
                                    <button onClick={() => onStartSession(booking)} className="bg-orange-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-orange-600 transition-all text-xs shadow-md flex-shrink-0">
                                        Start Session
                                     </button>
                                </li>
                            ))}
                        </ul>
                     ) : <p className="text-slate-400 text-sm text-center py-4">No upcoming sessions booked.</p>}
                 </div>
            </div>
            <div className="space-y-8">
                {/* Notification Settings */}
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4">Settings</h3>
                    <label htmlFor="notif-toggle" className="flex items-center justify-between cursor-pointer">
                        <span className="font-semibold text-slate-300">Enable Notifications</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                id="notif-toggle" 
                                className="sr-only peer" 
                                checked={engineer.notificationsEnabled ?? true}
                                onChange={(e) => onUpdateEngineer({ notificationsEnabled: e.target.checked })}
                            />
                            <div className="block bg-zinc-600 w-12 h-6 rounded-full peer-checked:bg-green-500 transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </div>
                    </label>
                </div>
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4">Wallet</h3>
                    <p className="text-slate-400 text-sm">Current Balance</p>
                    <p className="text-4xl font-bold text-green-400 mb-4">${engineer.walletBalance.toFixed(2)}</p>
                    <button className="w-full bg-zinc-700 text-slate-200 font-semibold py-2 px-3 rounded-lg hover:bg-zinc-600 text-sm mb-6">Withdraw Funds</button>
                     <h4 className="font-semibold text-slate-300 mb-2 text-sm">Recent Transactions</h4>
                     <ul className="space-y-2">
                        {engineer.walletTransactions.slice(0, 4).map(tx => (
                            <li key={tx.id} className="flex justify-between text-sm">
                                <span className="text-slate-300">{tx.description}</span>
                                <span className={`font-semibold ${tx.type === 'debit' ? 'text-red-400' : 'text-green-400'}`}>
                                    {tx.type === 'debit' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                                </span>
                            </li>
                        ))}
                     </ul>
                </div>
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                     <h3 className="text-xl font-bold text-slate-100 mb-4">Recent Reviews</h3>
                     <ul className="space-y-5">
                        {engineerReviews.map(review => {
                            const artist = review.artistId ? allArtists.find(a => a.id === review.artistId) : null;
                            return (
                                <li key={review.id} className="border-b border-zinc-700 pb-4 last:border-b-0">
                                    <div className="flex justify-between items-center mb-1">
                                        {artist ? (
                                            <button onClick={() => onSelectArtist(artist)} className="font-semibold text-slate-200 text-left hover:text-orange-400 transition-colors">
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
                                    <p className="text-xs text-slate-500 mt-2 text-right">{review.date}</p>
                                </li>
                            );
                        })}
                     </ul>
                </div>
            </div>
        </div>
    );
}

const FindArtistsContent: React.FC<Pick<EngineerDashboardProps, 'allArtists' | 'onSelectArtist' | 'onStartConversation'>> = ({ allArtists, onSelectArtist, onStartConversation }) => {
    const seekingArtists = allArtists.filter(a => a.isSeekingSession);
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-100">Artists Seeking Sessions</h2>
            {seekingArtists.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seekingArtists.map(artist => (
                        <div key={artist.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex flex-col gap-4 border border-zinc-700">
                             <div className="flex items-center gap-4">
                                <img src={artist.imageUrl} alt={artist.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectArtist(artist)} className="font-bold text-lg hover:text-orange-400 transition-colors text-left text-slate-100">{artist.name}</button>
                                    <p className="text-sm text-slate-400 truncate">{artist.bio.substring(0,50)}...</p>
                                </div>
                             </div>
                             <button onClick={() => onStartConversation(artist)} className="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all text-sm flex items-center justify-center gap-2">
                                <MessageIcon className="w-4 h-4" />
                                Message
                             </button>
                        </div>
                    ))}
                 </div>
            ) : (
                <p className="text-slate-400 text-center py-8">No artists are actively seeking sessions right now.</p>
            )}
        </div>
    );
};

const FollowersContent: React.FC<Pick<EngineerDashboardProps, 'engineer' | 'allArtists' | 'onToggleFollow' | 'onSelectArtist'>> = ({ engineer, allArtists, onToggleFollow, onSelectArtist }) => {
    const followers = allArtists.filter(a => a.following.engineers.includes(engineer.id));

    return (
         <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-100">Artist Followers</h2>
            {followers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map(follower => {
                        const isFollowingBack = engineer.following.artists.includes(follower.id);
                        return (
                            <div key={follower.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                <img src={follower.imageUrl} alt={follower.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectArtist(follower)} className="font-bold text-lg hover:text-orange-400 transition-colors text-left text-slate-100">{follower.name}</button>
                                    <p className="text-sm text-slate-400 truncate">{follower.bio.substring(0,50)}...</p>
                                </div>
                                <button 
                                    onClick={() => onToggleFollow('artist', follower.id)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 ${isFollowingBack ? 'bg-orange-500 text-white' : 'bg-zinc-600 text-slate-200 hover:bg-zinc-500'}`}
                                >
                                    {isFollowingBack ? <UserCheckIcon className="w-4 h-4" /> : <UserPlusIcon className="w-4 h-4" />}
                                    {isFollowingBack ? 'Following' : 'Follow Back'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-slate-400">No artists are following you yet.</p>
            )}
        </div>
    );
};

const FollowingContent: React.FC<Pick<EngineerDashboardProps, 'engineer' | 'allArtists' | 'allEngineers' | 'allStoodioz' | 'onToggleFollow' | 'onSelectArtist' | 'onSelectEngineer' | 'onSelectStoodio'>> = ({ engineer, allArtists, allEngineers, allStoodioz, onToggleFollow, onSelectArtist, onSelectEngineer, onSelectStoodio }) => {
    const followedArtists = allArtists.filter(a => engineer.following.artists.includes(a.id));
    const followedEngineers = allEngineers.filter(e => engineer.following.engineers.includes(e.id) && e.id !== engineer.id);
    const followedStoodioz = allStoodioz.filter(s => engineer.following.stoodioz.includes(s.id));
    
    return (
        <div className="space-y-12">
            <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Followed Stoodioz</h2>
                {followedStoodioz.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedStoodioz.map(s => (
                            <div key={s.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                <img src={s.imageUrl} alt={s.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectStoodio(s)} className="font-bold text-lg text-slate-100 hover:text-orange-400 transition-colors text-left">{s.name}</button>
                                    <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1"><LocationIcon className="w-4 h-4"/>{s.location}</p>
                                </div>
                                <button onClick={() => onToggleFollow('stoodio', s.id)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"><UserCheckIcon className="w-4 h-4" />Following</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400">You're not following any stoodioz yet.</p>
                )}
            </div>
             <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Followed Engineers</h2>
                {followedEngineers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedEngineers.map(e => (
                            <div key={e.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                <img src={e.imageUrl} alt={e.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectEngineer(e)} className="font-bold text-lg text-slate-100 hover:text-orange-400 transition-colors text-left">{e.name}</button>
                                    <p className="text-sm text-slate-400 truncate">{e.specialties.join(', ')}</p>
                                </div>
                                <button onClick={() => onToggleFollow('engineer', e.id)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"><UserCheckIcon className="w-4 h-4" />Following</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400">You're not following any other engineers yet.</p>
                )}
            </div>
            <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Followed Artists</h2>
                {followedArtists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedArtists.map(artist => (
                             <div key={artist.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                <img src={artist.imageUrl} alt={artist.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectArtist(artist)} className="font-bold text-lg text-slate-100 hover:text-orange-400 transition-colors text-left">{artist.name}</button>
                                    <p className="text-sm text-slate-400 truncate">{artist.bio.substring(0,50)}...</p>
                                </div>
                                <button onClick={() => onToggleFollow('artist', artist.id)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"><UserCheckIcon className="w-4 h-4" />Following</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400">You're not following any artists yet.</p>
                )}
            </div>
        </div>
    );
};

const EngineerDashboard: React.FC<EngineerDashboardProps> = (props) => {
    const { engineer, bookings, allArtists, onUpdateEngineer } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editedBio, setEditedBio] = useState(engineer.bio);

    useEffect(() => {
        setEditedBio(engineer.bio);
    }, [engineer.bio]);

    const handleSaveBio = () => {
        onUpdateEngineer({ bio: editedBio });
        setIsEditingBio(false);
    };

    const handleUpdatePhoto = () => {
        const newSeed = `${engineer.id}-updated-${Date.now()}`;
        onUpdateEngineer({ imageUrl: `https://picsum.photos/seed/${newSeed}/200` });
    };

    const handleToggle = (key: keyof Engineer, value: boolean) => {
        onUpdateEngineer({ [key]: value });
    };
    
    const totalEarnings = bookings.reduce((acc, b) => {
        if (b.engineer?.id === engineer.id && b.status === BookingStatus.COMPLETED) {
            return acc + (b.engineerPayRate * b.duration) + (b.tip || 0);
        }
        return acc;
    }, 0);
    const followersCount = allArtists.filter(a => a.following.engineers.includes(engineer.id)).length;
    const followingCount = engineer.following.artists.length + engineer.following.engineers.length + engineer.following.stoodioz.length;
    
    const TabButton: React.FC<{tab: DashboardTab, label: string, icon: React.ReactNode}> = ({ tab, label, icon }) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-3 w-full p-3 rounded-lg text-left font-semibold transition-colors ${
                activeTab === tab 
                ? 'bg-orange-500 text-white' 
                : 'text-slate-300 hover:bg-zinc-700'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 md:items-start mb-8">
                <div className="relative group flex-shrink-0">
                    <img src={engineer.imageUrl} alt={engineer.name} className="w-32 h-32 object-cover rounded-xl shadow-md border-4 border-zinc-700" />
                     <button onClick={handleUpdatePhoto} className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <PhotoIcon className="w-8 h-8"/>
                    </button>
                </div>
                <div className="flex-grow">
                    <h1 className="text-5xl font-extrabold tracking-tight text-orange-500">{engineer.name}</h1>
                     {isEditingBio ? (
                        <div className="mt-2">
                            <textarea
                                value={editedBio}
                                onChange={(e) => setEditedBio(e.target.value)}
                                className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500"
                                rows={4}
                            />
                            <div className="flex justify-start gap-2 mt-2">
                                <button onClick={() => { setIsEditingBio(false); setEditedBio(engineer.bio); }} className="text-sm font-semibold px-4 py-2 rounded-lg text-slate-300 hover:bg-zinc-600">Cancel</button>
                                <button onClick={handleSaveBio} className="text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 text-white">Save Bio</button>
                            </div>
                        </div>
                     ) : (
                        <p className="text-slate-500 mt-2 max-w-xl">{engineer.bio}</p>
                     )}
                </div>
                 <div className="flex flex-col gap-4 items-start md:items-end w-full md:w-auto">
                     {!isEditingBio && (
                         <button 
                            onClick={() => setIsEditingBio(true)}
                            className="w-full md:w-auto flex-shrink-0 flex items-center justify-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <EditIcon className="w-4 h-4" /> Edit Bio
                        </button>
                     )}
                    <label htmlFor="availability-toggle" className="w-full md:w-auto flex items-center justify-between cursor-pointer bg-zinc-800 border border-zinc-600 px-4 py-2 rounded-lg">
                        <span className="mr-3 font-semibold text-slate-300 text-sm">Available for Sessions</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                id="availability-toggle" 
                                className="sr-only peer" 
                                checked={engineer.isAvailable}
                                onChange={(e) => handleToggle('isAvailable', e.target.checked)}
                            />
                            <div className="block bg-zinc-600 w-12 h-6 rounded-full peer-checked:bg-green-500 transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </div>
                    </label>
                     <label htmlFor="location-toggle" className="w-full md:w-auto flex items-center justify-between cursor-pointer bg-zinc-800 border border-zinc-600 px-4 py-2 rounded-lg">
                        <span className="mr-3 font-semibold text-slate-300 text-sm">Show Exact Location on Map</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                id="location-toggle" 
                                className="sr-only peer" 
                                checked={engineer.displayExactLocation}
                                onChange={(e) => handleToggle('displayExactLocation', e.target.checked)}
                            />
                            <div className="block bg-zinc-600 w-12 h-6 rounded-full peer-checked:bg-green-500 transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </div>
                    </label>
                 </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Wallet Balance" value={`$${engineer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-orange-400"/>} />
                <StatCard label="Followers" value={followersCount.toLocaleString()} icon={<UsersIcon className="w-6 h-6 text-orange-400"/>} />
                <StatCard label="Following" value={followingCount.toLocaleString()} icon={<UserGroupIcon className="w-6 h-6 text-orange-400"/>} />
                <StatCard label="Total Bookings" value={bookings.filter(b=>b.engineer?.id === engineer.id).length} icon={<CalendarIcon className="w-6 h-6 text-orange-400"/>} />
            </div>

            {/* Content Grid */}
            <div className="flex flex-col md:flex-row gap-8 mt-10">
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="flex flex-col space-y-2">
                        <TabButton tab="dashboard" label="Dashboard" icon={<SoundWaveIcon className="w-5 h-5"/>} />
                        <TabButton tab="find_artists" label="Find Artists" icon={<UsersIcon className="w-5 h-5"/>} />
                        <TabButton tab="following" label="Following" icon={<UserCheckIcon className="w-5 h-5"/>} />
                        <TabButton tab="followers" label="Followers" icon={<UsersIcon className="w-5 h-5"/>} />
                    </nav>
                </aside>
                <main className="flex-1">
                    {activeTab === 'dashboard' && <DashboardContent {...props} />}
                    {activeTab === 'find_artists' && <FindArtistsContent {...props} />}
                    {activeTab === 'following' && <FollowingContent {...props} />}
                    {activeTab === 'followers' && <FollowersContent {...props} />}
                </main>
            </div>
        </div>
    );
};

export default EngineerDashboard;