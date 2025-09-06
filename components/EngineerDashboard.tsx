
import React, { useState, useEffect, useMemo } from 'react';
import type { Engineer, Review, Booking, Artist, Location, Stoodio, LinkAttachment, Comment, Post, Transaction } from '../types';
import { BookingStatus } from '../types';
import { EditIcon, DollarSignIcon, StarIcon, CalendarIcon, UsersIcon, SoundWaveIcon, UserGroupIcon, PhotoIcon, UserCheckIcon, UserPlusIcon, HouseIcon, MicrophoneIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';

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

type DashboardTab = 'dashboard' | 'wallet' | 'following' | 'followers' | 'availability';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800 p-4 rounded-xl shadow-md flex items-center gap-4 border border-zinc-700">
        <div className="bg-orange-500/20 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

const DashboardContent: React.FC<Omit<EngineerDashboardProps, 'onToggleFollow' | 'onStartConversation' | 'allEngineers' | 'allStoodioz' | 'onSelectEngineer'>> = ({ engineer, reviews, bookings, onSelectArtist, allArtists, onPost, onLikePost, onCommentOnPost, currentUser, onStartSession, onUpdateEngineer }) => {
    const confirmedBookings = bookings.filter(b => b.engineer?.id === engineer.id && b.status === BookingStatus.CONFIRMED);
    const engineerReviews = reviews.filter(r => !r.stoodioId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                 <CreatePost currentUser={engineer} onPost={onPost} />
                 
                 <PostFeed 
                    posts={engineer.posts || []} 
                    authors={new Map([[engineer.id, engineer]])}
                    onLikePost={onLikePost}
                    onCommentOnPost={onCommentOnPost}
                    currentUser={currentUser}
                />
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
                     <h3 className="text-xl font-bold text-slate-100 mb-4">Recent Reviews</h3>
                     <ul className="space-y-5">
                        {engineerReviews.slice(0, 3).map(review => {
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
                                    <p className="text-xs text-slate-400 mt-2 text-right">{review.date}</p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const AvailabilityContent: React.FC<Pick<EngineerDashboardProps, 'engineer' | 'onUpdateEngineer'>> = ({ engineer, onUpdateEngineer }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newTime, setNewTime] = useState('');

    const availabilityMap = useMemo(() => 
        new Map((engineer.availability || []).map(item => [item.date, item.times])), 
        [engineer.availability]
    );

    const handleDateClick = (day: Date) => {
        setSelectedDate(day);
    };

    const handleAddTime = (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{2}:\d{2}$/.test(newTime)) {
            alert("Please enter time in 24-hour HH:MM format (e.g., 14:00).");
            return;
        }
        
        const dateString = selectedDate.toISOString().split('T')[0];
        const currentTimes = availabilityMap.get(dateString) || [];

        if (currentTimes.includes(newTime)) {
            alert("This time slot already exists for this date.");
            return;
        }

        const updatedTimes = [...currentTimes, newTime].sort();
        
        const newAvailability = [...(engineer.availability || [])];
        const dayIndex = newAvailability.findIndex(d => d.date === dateString);

        if (dayIndex !== -1) {
            newAvailability[dayIndex].times = updatedTimes;
        } else {
            newAvailability.push({ date: dateString, times: updatedTimes });
        }
        
        onUpdateEngineer({ availability: newAvailability.sort((a,b) => a.date.localeCompare(b.date)) });
        setNewTime('');
    };

    const handleRemoveTime = (timeToRemove: string) => {
        const dateString = selectedDate.toISOString().split('T')[0];
        const currentTimes = availabilityMap.get(dateString) || [];
        const updatedTimes = currentTimes.filter(t => t !== timeToRemove);
        
        let newAvailability = [...(engineer.availability || [])];
        const dayIndex = newAvailability.findIndex(d => d.date === dateString);

        if (dayIndex !== -1) {
            if (updatedTimes.length > 0) {
                newAvailability[dayIndex].times = updatedTimes;
            } else {
                newAvailability = newAvailability.filter(d => d.date !== dateString);
            }
        }
        
        onUpdateEngineer({ availability: newAvailability });
    };

    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startDayOfWeek = startOfMonth.getDay();
    const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1));
    const today = new Date();
    today.setHours(0,0,0,0);
    const selectedDateString = selectedDate.toISOString().split('T')[0];

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <h2 className="text-3xl font-bold mb-6 text-slate-100">Manage Availability</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-zinc-700 transition-colors">
                            <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
                        </button>
                        <h3 className="font-bold text-lg text-slate-100">
                            {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-zinc-700 transition-colors">
                            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-400 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array(startDayOfWeek).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                        {daysInMonth.map(day => {
                            const dateString = day.toISOString().split('T')[0];
                            const isAvailable = availabilityMap.has(dateString);
                            const isPast = day < today;
                            const isSelected = dateString === selectedDateString;
                            
                            let dayClasses = "w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 text-sm";
                            if (isPast) dayClasses += " text-slate-600 cursor-not-allowed";
                            else {
                                dayClasses += " cursor-pointer";
                                if (isSelected) dayClasses += " bg-orange-500 text-white font-bold ring-2 ring-orange-400";
                                else if (isAvailable) dayClasses += " bg-orange-500/20 text-orange-300 hover:bg-orange-500/40";
                                else dayClasses += " text-slate-300 hover:bg-zinc-700";
                            }
                            return (
                                <div key={dateString} onClick={() => !isPast && handleDateClick(day)} className={dayClasses}>
                                    {day.getDate()}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-zinc-900/50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-slate-100 mb-4 text-center">
                        Slots for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                        {(availabilityMap.get(selectedDateString) || []).length > 0 ? (
                            (availabilityMap.get(selectedDateString) || []).sort().map(time => (
                                <div key={time} className="flex items-center justify-between bg-zinc-700 p-2 rounded-md">
                                    <span className="font-semibold text-slate-200">{time}</span>
                                    <button onClick={() => handleRemoveTime(time)} className="text-red-400 hover:text-red-300">
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No time slots for this date.</p>
                        )}
                    </div>
                    <form onSubmit={handleAddTime} className="mt-4 pt-4 border-t border-zinc-700 flex items-center gap-2">
                        <input
                            type="time"
                            value={newTime}
                            onChange={e => setNewTime(e.target.value)}
                            className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500"
                            required
                        />
                        <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all">
                            Add
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const WalletContent: React.FC<{ engineer: Engineer }> = ({ engineer }) => {
    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <h2 className="text-3xl font-bold mb-2 text-slate-100">Wallet</h2>
            <p className="text-slate-400 text-sm mb-6">Manage your earnings and transactions.</p>
            
            <div className="bg-zinc-900/50 p-6 rounded-lg mb-6">
                <p className="text-slate-400 text-sm">Current Balance</p>
                <p className="text-5xl font-bold text-green-400">${engineer.walletBalance.toFixed(2)}</p>
            </div>
            
            <div className="flex gap-4 mb-8">
                 <button className="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 text-sm">Withdraw Funds</button>
                 <button className="w-full bg-zinc-700 text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-600 text-sm">View Statements</button>
            </div>

            <div>
                 <h3 className="font-semibold text-slate-200 mb-3">All Transactions</h3>
                 <ul className="space-y-3">
                    {engineer.walletTransactions.length > 0 ? engineer.walletTransactions.map((tx: Transaction) => (
                        <li key={tx.id} className="flex justify-between items-center bg-zinc-700/50 p-3 rounded-md">
                            <div>
                                <p className="font-medium text-slate-200">{tx.description}</p>
                                <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`font-semibold text-lg ${tx.type === 'debit' ? 'text-red-400' : 'text-green-400'}`}>
                                {tx.type === 'debit' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                            </span>
                        </li>
                    )) : <p className="text-sm text-slate-500 text-center py-4">No transactions yet.</p>}
                 </ul>
            </div>
        </div>
    );
};

const ProfileCard: React.FC<{ profile: Stoodio | Engineer | Artist; type: 'stoodio' | 'engineer' | 'artist'; onClick: () => void; }> = ({ profile, type, onClick }) => {
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

const FollowingContent: React.FC<Pick<EngineerDashboardProps, 'engineer' | 'allArtists' | 'allEngineers' | 'allStoodioz' | 'onToggleFollow' | 'onSelectArtist' | 'onSelectEngineer' | 'onSelectStoodio'>> = ({ engineer, allArtists, allEngineers, allStoodioz, onToggleFollow, onSelectArtist, onSelectEngineer, onSelectStoodio }) => {
    const followedArtists = allArtists.filter(a => engineer.following.artists.includes(a.id));
    const followedEngineers = allEngineers.filter(e => engineer.following.engineers.includes(e.id) && e.id !== engineer.id);
    const followedStoodioz = allStoodioz.filter(s => engineer.following.stoodioz.includes(s.id));
    
    return (
        <div className="space-y-12">
            <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Followed Artists</h2>
                {followedArtists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => onSelectArtist(p)} />)}
                    </div>
                ) : <p className="text-slate-400">Not following any artists.</p>}
            </div>
            <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Followed Engineers</h2>
                {followedEngineers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => onSelectEngineer(p)} />)}
                    </div>
                ) : <p className="text-slate-400">Not following any other engineers.</p>}
            </div>
            <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Followed Stoodioz</h2>
                {followedStoodioz.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => onSelectStoodio(p)} />)}
                    </div>
                ) : <p className="text-slate-400">Not following any stoodioz.</p>}
            </div>
        </div>
    );
};

const FollowersContent: React.FC<Pick<EngineerDashboardProps, 'engineer' | 'allArtists' | 'onSelectArtist'>> = ({ engineer, allArtists, onSelectArtist }) => {
    const followers = allArtists.filter(a => a.following.engineers.includes(engineer.id));

    return (
         <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-100">Artist Followers</h2>
            {followers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => onSelectArtist(p)} />)}
                </div>
            ) : <p className="text-slate-400">No artists are following you yet.</p>}
        </div>
    );
};


const EngineerDashboard: React.FC<EngineerDashboardProps> = (props) => {
    const { engineer, onUpdateEngineer, reviews } = props;
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
        const newSeed = `eng-updated-${Date.now()}`;
        onUpdateEngineer({ imageUrl: `https://picsum.photos/seed/${newSeed}/200` });
    };
    
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
            {/* Header section */}
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
                        <p className="text-slate-400 mt-2 max-w-xl">{engineer.bio}</p>
                     )}
                </div>
                <div className="flex flex-col gap-4 items-end">
                    {!isEditingBio && (
                        <button 
                            onClick={() => setIsEditingBio(true)}
                            className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <EditIcon className="w-4 h-4" /> Edit Bio
                        </button>
                     )}
                     <label htmlFor="available-toggle" className="flex items-center cursor-pointer bg-zinc-800 border border-zinc-600 px-4 py-2 rounded-lg">
                        <span className="mr-3 font-semibold text-slate-300 text-sm">Available for Sessions</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="available-toggle"
                                className="sr-only peer"
                                checked={engineer.isAvailable}
                                onChange={(e) => onUpdateEngineer({ isAvailable: e.target.checked })}
                            />
                            <div className="block bg-zinc-600 w-12 h-6 rounded-full peer-checked:bg-green-500 transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Stats section */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Overall Rating" value={engineer.rating.toFixed(1)} icon={<StarIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Sessions Completed" value={engineer.sessionsCompleted} icon={<UserGroupIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Followers" value={engineer.followers.toLocaleString()} icon={<UsersIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Wallet Balance" value={`$${engineer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-orange-400" />} />
            </div>

            {/* Main content grid with sidebar */}
            <div className="flex flex-col md:flex-row gap-8 mt-10">
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="flex flex-col space-y-2">
                        <TabButton tab="dashboard" label="Dashboard" icon={<SoundWaveIcon className="w-5 h-5"/>} />
                        <TabButton tab="wallet" label="Wallet" icon={<DollarSignIcon className="w-5 h-5"/>} />
                        <TabButton tab="following" label="Following" icon={<UserCheckIcon className="w-5 h-5"/>} />
                        <TabButton tab="followers" label="Followers" icon={<UsersIcon className="w-5 h-5"/>} />
                        <TabButton tab="availability" label="Availability" icon={<CalendarIcon className="w-5 h-5"/>} />
                    </nav>
                </aside>
                <main className="flex-1">
                    {activeTab === 'dashboard' && <DashboardContent {...props} />}
                    {activeTab === 'wallet' && <WalletContent engineer={engineer} />}
                    {activeTab === 'following' && <FollowingContent {...props} />}
                    {activeTab === 'followers' && <FollowersContent {...props} />}
                    {activeTab === 'availability' && <AvailabilityContent engineer={engineer} onUpdateEngineer={onUpdateEngineer} />}
                </main>
            </div>
        </div>
    );
};

export default EngineerDashboard;
