
import React, { useState, useMemo } from 'react';
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

const ToggleSwitch: React.FC<{
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    id: string;
}> = ({ label, description, checked, onChange, id }) => (
    <label htmlFor={id} className="flex items-center justify-between cursor-pointer py-3">
        <div>
            <span className="font-semibold text-slate-300">{label}</span>
            {description && <p className="text-xs text-slate-500 max-w-xs">{description}</p>}
        </div>
        <div className="relative flex-shrink-0 ml-4">
            <input 
                type="checkbox" 
                id={id} 
                className="sr-only peer" 
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className="block bg-zinc-600 w-12 h-6 rounded-full peer-checked:bg-green-500 transition"></div>
            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
        </div>
    </label>
);

const ProfileSettingsCard: React.FC<{ engineer: Engineer; onUpdateEngineer: (updates: Partial<Engineer>) => void }> = ({ engineer, onUpdateEngineer }) => {
    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Profile Settings</h3>
            <div className="divide-y divide-zinc-700">
                <ToggleSwitch
                    id="availability-toggle"
                    label="Available for Hire"
                    description="Let artists and stoodioz know you're open to new sessions."
                    checked={engineer.isAvailable ?? true}
                    onChange={(checked) => onUpdateEngineer({ isAvailable: checked })}
                />
                <ToggleSwitch
                    id="map-toggle"
                    label="Show on Map"
                    description="Allow your profile to appear on the public map view."
                    checked={engineer.showOnMap ?? true}
                    onChange={(checked) => onUpdateEngineer({ showOnMap: checked })}
                />
                <ToggleSwitch
                    id="location-toggle"
                    label="Display Exact Location"
                    description="Show your precise location on the map instead of a general area."
                    checked={engineer.displayExactLocation ?? false}
                    onChange={(checked) => onUpdateEngineer({ displayExactLocation: checked })}
                />
                 <ToggleSwitch
                    id="notif-toggle"
                    label="Enable Notifications"
                    description="Receive push notifications for job requests and messages."
                    checked={engineer.notificationsEnabled ?? true}
                    onChange={(checked) => onUpdateEngineer({ notificationsEnabled: checked })}
                />
            </div>
        </div>
    );
};


const DashboardContent: React.FC<Omit<EngineerDashboardProps, 'allArtists'|'allEngineers'|'allStoodioz'|'onToggleFollow'|'onSelectArtist'|'onSelectEngineer'|'onSelectStoodio'>> = ({ engineer, bookings, onAcceptBooking, onDenyBooking, onPost, onLikePost, onCommentOnPost, currentUser, onStartSession, onUpdateEngineer }) => {
    const pendingBookings = useMemo(() =>
        bookings.filter(b => 
            (b.status === BookingStatus.PENDING_APPROVAL && b.requestedEngineerId === engineer.id) || 
            (b.status === BookingStatus.PENDING && !b.requestedEngineerId)
        ).slice(0, 5), [bookings, engineer.id]);

    const upcomingConfirmedBookings = useMemo(() => 
        bookings.filter(b => b.status === BookingStatus.CONFIRMED && b.engineer?.id === engineer.id)
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5),
        [bookings, engineer.id]
    );

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
            </div>
            <div className="space-y-8">
                <ProfileSettingsCard engineer={engineer} onUpdateEngineer={onUpdateEngineer} />
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4">Job Opportunities &amp; Requests</h3>
                    {pendingBookings.length > 0 ? (
                        <ul className="space-y-4">
                            {pendingBookings.map(booking => (
                                <li key={booking.id} className="p-3 bg-zinc-700/50 rounded-lg">
                                    <p className="font-semibold">{booking.stoodio.name}</p>
                                    <p className="text-sm text-slate-400">
                                        For {booking.artist?.name || 'Studio Job'} on {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-us', {month: 'short', day: 'numeric'})}
                                    </p>
                                    <div className="flex justify-end gap-2 mt-2">
                                        {booking.status === BookingStatus.PENDING_APPROVAL && <button onClick={() => onDenyBooking(booking.id)} className="bg-red-500/20 text-red-300 font-bold py-1 px-3 rounded-lg hover:bg-red-500/40 text-sm">Deny</button>}
                                        <button onClick={() => onAcceptBooking(booking.id)} className="bg-green-500/20 text-green-300 font-bold py-1 px-3 rounded-lg hover:bg-green-500/40 text-sm">Accept</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 text-sm text-center py-4">No new job opportunities or requests.</p>
                    )}
                </div>
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4">Upcoming Confirmed Sessions</h3>
                    {upcomingConfirmedBookings.length > 0 ? (
                        <ul className="space-y-4">
                            {upcomingConfirmedBookings.map(booking => (
                                <li key={booking.id} className="p-3 bg-zinc-700/50 rounded-lg">
                                    <p className="font-semibold">{booking.stoodio.name}</p>
                                    <p className="text-sm text-slate-400">
                                        With {booking.artist?.name || 'Studio Job'} on {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-us', {month: 'short', day: 'numeric'})}
                                    </p>
                                    <button onClick={() => onStartSession(booking)} className="w-full mt-2 bg-orange-500 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-orange-600 text-sm">Start Session</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 text-sm text-center py-4">No upcoming confirmed sessions.</p>
                    )}
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
                 <h3 className="font-semibold text-slate-200 mb-3">Recent Transactions</h3>
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

const FollowingContent: React.FC<Pick<EngineerDashboardProps, 'engineer' | 'allStoodioz' | 'allEngineers' | 'allArtists' | 'onToggleFollow' | 'onSelectStoodio' | 'onSelectArtist' | 'onSelectEngineer'>> = ({ engineer, allStoodioz, allEngineers, allArtists, onToggleFollow, onSelectStoodio, onSelectArtist, onSelectEngineer }) => {
    const followedStoodioz = allStoodioz.filter(s => engineer.following.stoodioz.includes(s.id));
    const followedEngineers = allEngineers.filter(e => engineer.following.engineers.includes(e.id));
    const followedArtists = allArtists.filter(a => engineer.following.artists.includes(a.id));
    return (
        <div className="space-y-12">
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

const FollowersContent: React.FC<Pick<EngineerDashboardProps, 'engineer' | 'allArtists' | 'onToggleFollow' | 'onSelectArtist'>> = ({ engineer, allArtists, onToggleFollow, onSelectArtist }) => {
    const followers = allArtists.filter(a => a.following.engineers.includes(engineer.id));
    return (
         <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-100">Artist Followers</h2>
            {followers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map(follower => (
                        <div key={follower.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                            <img src={follower.imageUrl} alt={follower.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                            <div className="flex-grow">
                                <button onClick={() => onSelectArtist(follower)} className="font-bold text-lg hover:text-orange-400 transition-colors text-left text-slate-100">{follower.name}</button>
                                <p className="text-sm text-slate-400 truncate">{follower.bio.substring(0,50)}...</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-400">No artists are following you yet.</p>
            )}
        </div>
    );
};

const AvailabilityContent: React.FC<{ engineer: Engineer; onUpdateEngineer: (updates: Partial<Engineer>) => void; }> = ({ engineer, onUpdateEngineer }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [editedAvailability, setEditedAvailability] = useState(engineer.availability || []);

    const availabilityMap = useMemo(() => new Map(editedAvailability.map(item => [item.date, new Set(item.times)])), [editedAvailability]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    const handleDateClick = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        setSelectedDate(dateString);
    };

    const handleTimeSlotToggle = (time: string) => {
        if (!selectedDate) return;

        const newAvailability = [...editedAvailability];
        const dayIndex = newAvailability.findIndex(d => d.date === selectedDate);

        if (dayIndex > -1) {
            const times = new Set(newAvailability[dayIndex].times);
            if (times.has(time)) {
                times.delete(time);
            } else {
                times.add(time);
            }
            if (times.size === 0) {
                newAvailability.splice(dayIndex, 1);
            } else {
                newAvailability[dayIndex] = { date: selectedDate, times: Array.from(times).sort() };
            }
        } else {
            newAvailability.push({ date: selectedDate, times: [time] });
        }
        setEditedAvailability(newAvailability);
    };

    const handleSaveChanges = () => {
        onUpdateEngineer({ availability: editedAvailability });
        alert('Availability updated!');
    };
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDayOfWeek = startOfMonth.getDay();
    const daysInMonth: Date[] = [];
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
        daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ALL_TIME_SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const availableTimesForSelectedDate = availabilityMap.get(selectedDate || '') || new Set();

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-slate-100">Manage Availability</h2>
                 <button onClick={handleSaveChanges} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md">
                    Save Changes
                </button>
            </div>
            <p className="text-slate-400 text-sm mb-6">Click a date to edit your available time slots. Your changes will be saved when you click the button above.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-zinc-900/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-zinc-700 transition-colors">
                            <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
                        </button>
                        <h3 className="font-bold text-lg text-slate-100">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-zinc-700 transition-colors">
                            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-400 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array(startDayOfWeek).fill(null).map((_, index) => <div key={`empty-${index}`}></div>)}
                        {daysInMonth.map(day => {
                            const dateString = day.toISOString().split('T')[0];
                            const isAvailable = (availabilityMap.get(dateString)?.size || 0) > 0;
                            const isPast = day < today;
                            const isSelected = selectedDate === dateString;
                            let dayClass = "w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 text-sm";
                            if (isPast) {
                                dayClass += " text-slate-600 cursor-not-allowed";
                            } else {
                                dayClass += " cursor-pointer ";
                                if (isSelected) {
                                    dayClass += " bg-orange-500 text-white font-bold ring-2 ring-offset-2 ring-offset-zinc-900 ring-orange-500";
                                } else if (isAvailable) {
                                    dayClass += " bg-green-500/20 text-green-300 hover:bg-green-500/40";
                                } else {
                                    dayClass += " text-slate-300 hover:bg-zinc-700";
                                }
                            }
                            return <div key={dateString} onClick={() => !isPast && handleDateClick(day)} className={dayClass}>{day.getDate()}</div>;
                        })}
                    </div>
                </div>
                <div>
                    {selectedDate ? (
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-3">Available Slots for <span className="text-orange-400">{selectedDate}</span></h4>
                            <div className="grid grid-cols-2 gap-2">
                                {ALL_TIME_SLOTS.map(time => {
                                    const isChecked = availableTimesForSelectedDate.has(time);
                                    return (
                                        <label key={time} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isChecked ? 'bg-green-500/20' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleTimeSlotToggle(time)}
                                                className="w-4 h-4 rounded text-orange-500 bg-zinc-600 border-zinc-500 focus:ring-orange-500 focus:ring-offset-zinc-800"
                                            />
                                            <span className={`font-semibold ${isChecked ? 'text-green-300' : 'text-slate-300'}`}>{time}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-zinc-900/50 rounded-lg">
                            <p className="text-slate-400">Select a date to edit times.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const EngineerDashboard: React.FC<EngineerDashboardProps> = (props) => {
    const { engineer, onUpdateEngineer } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editedBio, setEditedBio] = useState(engineer.bio);

    const handleSaveBio = () => {
        onUpdateEngineer({ bio: editedBio });
        setIsEditingBio(false);
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
            <div className="flex flex-col md:flex-row gap-6 md:items-start mb-8">
                <img src={engineer.imageUrl} alt={engineer.name} className="w-32 h-32 object-cover rounded-xl shadow-md border-4 border-zinc-700" />
                <div className="flex-grow">
                    <h1 className="text-5xl font-extrabold tracking-tight text-orange-500">{engineer.name}</h1>
                     {isEditingBio ? (
                        <div className="mt-2">
                            <textarea value={editedBio} onChange={(e) => setEditedBio(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500" rows={4} />
                            <div className="flex justify-start gap-2 mt-2">
                                <button onClick={() => { setIsEditingBio(false); setEditedBio(engineer.bio); }} className="text-sm font-semibold px-4 py-2 rounded-lg text-slate-300 hover:bg-zinc-600">Cancel</button>
                                <button onClick={handleSaveBio} className="text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 text-white">Save Bio</button>
                            </div>
                        </div>
                     ) : (
                        <p className="text-slate-400 mt-2 max-w-xl">{engineer.bio}</p>
                     )}
                </div>
                 {!isEditingBio && (
                    <button onClick={() => setIsEditingBio(true)} className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors">
                        <EditIcon className="w-4 h-4" /> Edit Bio
                    </button>
                 )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Followers" value={engineer.followers.toLocaleString()} icon={<UsersIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Rating" value={engineer.rating.toFixed(1)} icon={<StarIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Sessions Completed" value={engineer.sessionsCompleted} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Wallet Balance" value={`$${engineer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-orange-400" />} />
            </div>
            <div className="flex flex-col md:flex-row gap-8 mt-10">
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="flex flex-col space-y-2">
                        <TabButton tab="dashboard" label="Dashboard" icon={<SoundWaveIcon className="w-5 h-5"/>} />
                        <TabButton tab="availability" label="Availability" icon={<CalendarIcon className="w-5 h-5"/>} />
                        <TabButton tab="wallet" label="Wallet" icon={<DollarSignIcon className="w-5 h-5"/>} />
                        <TabButton tab="following" label="Following" icon={<UserCheckIcon className="w-5 h-5"/>} />
                        <TabButton tab="followers" label="Followers" icon={<UsersIcon className="w-5 h-5"/>} />
                    </nav>
                </aside>
                <main className="flex-1">
                    {activeTab === 'dashboard' && <DashboardContent {...props} />}
                    {activeTab === 'wallet' && <WalletContent {...props} />}
                    {activeTab === 'following' && <FollowingContent {...props} />}
                    {activeTab === 'followers' && <FollowersContent {...props} />}
                    {activeTab === 'availability' && <AvailabilityContent engineer={engineer} onUpdateEngineer={onUpdateEngineer} />}
                </main>
            </div>
        </div>
    );
};

export default EngineerDashboard;