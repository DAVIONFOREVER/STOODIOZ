
import React, { useState, useMemo } from 'react';
import type { Stoodio, Booking, Artist, Engineer, LinkAttachment, Comment, Post, BookingRequest, Transaction } from '../types';
import { BookingStatus } from '../types';
import { EditIcon, PhotoIcon, EquipmentIcon, CalendarIcon, LocationIcon, UsersIcon, DollarSignIcon, SoundWaveIcon, UserCheckIcon, UserPlusIcon, UserGroupIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';

interface StoodioDashboardProps {
    stoodio: Stoodio;
    bookings: Booking[];
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onUpdateStoodio: (updatedProfile: Partial<Stoodio>) => void;
    onToggleFollow: (type: 'artist' | 'engineer' | 'stoodio', id: string) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onPost: (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
    onPostJob: (jobRequest: Omit<BookingRequest, 'totalCost' | 'engineerPayRate' | 'requestType'>) => void;
}

type DashboardTab = 'dashboard' | 'availability' | 'wallet' | 'following' | 'followers' | 'photos';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800 p-4 rounded-xl shadow-md flex items-center gap-4 border border-zinc-700">
        <div className="bg-orange-500/20 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

const PostJobCard: React.FC<{ onPostJob: StoodioDashboardProps['onPostJob'] }> = ({ onPostJob }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [startTime, setStartTime] = useState('12:00');
    const [duration, setDuration] = useState(4);
    const [skills, setSkills] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onPostJob({
            date,
            startTime,
            duration,
            requiredSkills: skills ? skills.split(',').map(s => s.trim()) : [],
        });
        // Reset form
        setDate(today);
        setStartTime('12:00');
        setDuration(4);
        setSkills('');
    };

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Post a Job for Engineers</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="job-date" className="text-sm font-semibold text-slate-400 mb-1 block">Date</label>
                        <input type="date" id="job-date" value={date} min={today} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                     <div>
                        <label htmlFor="job-start-time" className="text-sm font-semibold text-slate-400 mb-1 block">Start Time</label>
                        <input type="time" id="job-start-time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="job-duration" className="text-sm font-semibold text-slate-400 mb-1 block">Duration (hours)</label>
                    <input type="number" id="job-duration" value={duration} min="1" max="12" onChange={e => setDuration(parseInt(e.target.value))} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                 <div>
                    <label htmlFor="job-skills" className="text-sm font-semibold text-slate-400 mb-1 block">Required Skills (comma-separated)</label>
                    <input type="text" id="job-skills" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g., Pro Tools, Vocal Tuning" className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <button type="submit" className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all shadow-md">
                    Post Job to Board
                </button>
            </form>
        </div>
    );
};

const DashboardContent: React.FC<Omit<StoodioDashboardProps, 'allArtists'|'allEngineers'|'allStoodioz'|'onToggleFollow'|'onSelectArtist'|'onSelectEngineer'|'onSelectStoodio'>> = ({ stoodio, bookings, onUpdateStoodio, onPost, onLikePost, onCommentOnPost, currentUser, onPostJob }) => {
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editedBio, setEditedBio] = useState(stoodio.description);

    const handleEdit = (section: string) => {
        alert(`Editing the "${section}" section is not yet implemented. This would open a form to update the stoodio details.`);
    };

    const handleSaveBio = () => {
        onUpdateStoodio({ description: editedBio });
        setIsEditingBio(false);
    };

    const recentBookings = bookings
        .filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
        .slice(0, 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Create Post */}
                <CreatePost currentUser={stoodio} onPost={onPost} />
                
                {/* Post Feed */}
                <PostFeed 
                    posts={stoodio.posts || []} 
                    authors={new Map([[stoodio.id, stoodio]])}
                    onLikePost={onLikePost}
                    onCommentOnPost={onCommentOnPost}
                    currentUser={currentUser}
                />

                 {/* Recent Bookings */}
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4">Recent Bookings</h3>
                    {recentBookings.length > 0 ? (
                        <ul className="space-y-4">
                            {recentBookings.map(booking => (
                                <li key={booking.id} className="p-3 bg-zinc-700/50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{booking.artist?.name || 'Stoodio Job'}</p>
                                        <p className="text-sm text-slate-400">
                                            {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-us', {month: 'short', day: 'numeric'})} at {booking.startTime}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold text-sm ${booking.status === BookingStatus.COMPLETED ? 'text-green-400' : 'text-yellow-400'}`}>{booking.status}</p>
                                        <p className="text-xs text-slate-500">with {booking.engineer?.name || 'N/A'}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 text-sm text-center py-4">No recent bookings found.</p>
                    )}
                </div>
                 {/* Details Card */}
                 <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-100">Stoodio Details</h3>
                        {!isEditingBio && (
                            <button onClick={() => setIsEditingBio(true)} className="flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                                <EditIcon className="w-4 h-4" /> Edit Bio
                            </button>
                        )}
                     </div>
                     {isEditingBio ? (
                        <div>
                            <textarea
                                value={editedBio}
                                onChange={(e) => setEditedBio(e.target.value)}
                                className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500"
                                rows={5}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditingBio(false)} className="text-sm font-semibold px-4 py-2 rounded-lg text-slate-300 hover:bg-zinc-600">Cancel</button>
                                <button onClick={handleSaveBio} className="text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 text-white">Save</button>
                            </div>
                        </div>
                     ) : (
                        <p className="text-sm text-slate-300">{stoodio.description}</p>
                     )}
                 </div>
            </div>
            <div className="space-y-8">
                 <PostJobCard onPostJob={onPostJob} />
                 {/* Amenities Card */}
                 <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-100">Amenities</h3>
                         <button onClick={() => handleEdit('Amenities')} className="flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                            <EditIcon className="w-4 h-4" /> Edit
                        </button>
                     </div>
                    <ul className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm text-slate-300">
                        {stoodio.amenities.slice(0, 6).map(item => <li key={item} className="truncate">- {item}</li>)}
                    </ul>
                 </div>
            </div>
        </div>
    );
};

const AvailabilityContent: React.FC<Pick<StoodioDashboardProps, 'stoodio' | 'onUpdateStoodio'>> = ({ stoodio, onUpdateStoodio }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newTime, setNewTime] = useState('');

    const availabilityMap = useMemo(() => 
        new Map(stoodio.availability.map(item => [item.date, item.times])), 
        [stoodio.availability]
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
        
        const newAvailability = [...stoodio.availability];
        const dayIndex = newAvailability.findIndex(d => d.date === dateString);

        if (dayIndex !== -1) {
            newAvailability[dayIndex].times = updatedTimes;
        } else {
            newAvailability.push({ date: dateString, times: updatedTimes });
        }
        
        onUpdateStoodio({ availability: newAvailability.sort((a,b) => a.date.localeCompare(b.date)) });
        setNewTime('');
    };

    const handleRemoveTime = (timeToRemove: string) => {
        const dateString = selectedDate.toISOString().split('T')[0];
        const currentTimes = availabilityMap.get(dateString) || [];
        const updatedTimes = currentTimes.filter(t => t !== timeToRemove);
        
        let newAvailability = [...stoodio.availability];
        const dayIndex = newAvailability.findIndex(d => d.date === dateString);

        if (dayIndex !== -1) {
            if (updatedTimes.length > 0) {
                newAvailability[dayIndex].times = updatedTimes;
            } else {
                newAvailability = newAvailability.filter(d => d.date !== dateString);
            }
        }
        
        onUpdateStoodio({ availability: newAvailability });
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

const WalletContent: React.FC<{ stoodio: Stoodio }> = ({ stoodio }) => {
    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <h2 className="text-3xl font-bold mb-2 text-slate-100">Wallet</h2>
            <p className="text-slate-400 text-sm mb-6">Manage your earnings and transactions.</p>
            
            <div className="bg-zinc-900/50 p-6 rounded-lg mb-6">
                <p className="text-slate-400 text-sm">Current Balance</p>
                <p className="text-5xl font-bold text-green-400">${stoodio.walletBalance.toFixed(2)}</p>
            </div>
            
            <div className="flex gap-4 mb-8">
                 <button className="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 text-sm">Withdraw Funds</button>
                 <button className="w-full bg-zinc-700 text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-600 text-sm">View Statements</button>
            </div>

            <div>
                 <h3 className="font-semibold text-slate-200 mb-3">Recent Transactions</h3>
                 <ul className="space-y-3">
                    {stoodio.walletTransactions.length > 0 ? stoodio.walletTransactions.map((tx: Transaction) => (
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

const FollowersContent: React.FC<Pick<StoodioDashboardProps, 'stoodio' | 'allArtists' | 'onToggleFollow' | 'onSelectArtist'>> = ({ stoodio, allArtists, onToggleFollow, onSelectArtist }) => {
    const followers = allArtists.filter(a => a.following.stoodioz.includes(stoodio.id));

    return (
         <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-100">Artist Followers</h2>
            {followers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map(follower => {
                        const isFollowingBack = stoodio.following.artists.includes(follower.id);
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
                <p className="text-slate-400">No artists are following this stoodio yet.</p>
            )}
        </div>
    );
};

const FollowingContent: React.FC<Pick<StoodioDashboardProps, 'stoodio' | 'allArtists' | 'allEngineers' | 'allStoodioz' | 'onToggleFollow' | 'onSelectArtist' | 'onSelectEngineer' | 'onSelectStoodio'>> = ({ stoodio, allArtists, allEngineers, allStoodioz, onToggleFollow, onSelectArtist, onSelectEngineer, onSelectStoodio }) => {
    const followedArtists = allArtists.filter(a => stoodio.following.artists.includes(a.id));
    const followedEngineers = allEngineers.filter(e => stoodio.following.engineers.includes(e.id));
    const followedStoodioz = allStoodioz.filter(s => stoodio.following.stoodioz.includes(s.id) && s.id !== stoodio.id);
    
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
                    <p className="text-slate-400">You're not following any other stoodioz yet.</p>
                )}
            </div>
             <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Followed Engineers</h2>
                {followedEngineers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedEngineers.map(engineer => (
                            <div key={engineer.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                <img src={engineer.imageUrl} alt={engineer.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectEngineer(engineer)} className="font-bold text-lg text-slate-100 hover:text-orange-400 transition-colors text-left">{engineer.name}</button>
                                    <p className="text-sm text-slate-400 truncate">{engineer.specialties.join(', ')}</p>
                                </div>
                                <button onClick={() => onToggleFollow('engineer', engineer.id)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"><UserCheckIcon className="w-4 h-4" />Following</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400">You're not following any engineers yet.</p>
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

const PhotosContent: React.FC<Pick<StoodioDashboardProps, 'stoodio' | 'onUpdateStoodio'>> = ({ stoodio, onUpdateStoodio }) => {
    const handleAddPhoto = () => {
        const newPhotoUrl = `https://picsum.photos/seed/${stoodio.id}-${Date.now()}/600/400`;
        onUpdateStoodio({ photos: [...stoodio.photos, newPhotoUrl] });
    };

    const handleDeletePhoto = (photoUrl: string) => {
        if (window.confirm("Are you sure you want to delete this photo?")) {
            onUpdateStoodio({ photos: stoodio.photos.filter(p => p !== photoUrl) });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-100">Photo Gallery</h2>
                <button onClick={handleAddPhoto} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md">
                    Add Photo
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stoodio.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                        <img src={photo} alt={`${stoodio.name} gallery image ${index + 1}`} className="w-full h-40 object-cover rounded-lg shadow-md" />
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDeletePhoto(photo)} className="text-red-500 hover:text-red-400 p-2 rounded-full bg-zinc-800/50">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const StoodioDashboard: React.FC<StoodioDashboardProps> = (props) => {
    const { stoodio, bookings, onUpdateStoodio, allArtists } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

    const totalEarnings = bookings
        .filter(b => b.status === BookingStatus.COMPLETED)
        .reduce((acc, b) => acc + (b.stoodio.hourlyRate * b.duration), 0);
    
    const followersCount = allArtists.filter(a => a.following.stoodioz.includes(stoodio.id)).length;
    const followingCount = stoodio.following.artists.length + stoodio.following.engineers.length + stoodio.following.stoodioz.length;

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

    const handleUpdatePhoto = () => {
        const newSeed = `${stoodio.id}-updated-${Date.now()}`;
        onUpdateStoodio({ imageUrl: `https://picsum.photos/seed/${newSeed}/600/400` });
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 md:items-center mb-8">
                <div className="relative group flex-shrink-0">
                    <img src={stoodio.imageUrl} alt={stoodio.name} className="w-32 h-32 object-cover rounded-2xl shadow-md" />
                     <button onClick={handleUpdatePhoto} className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <PhotoIcon className="w-8 h-8"/>
                    </button>
                </div>
                <div>
                    <h1 className="text-5xl font-extrabold tracking-tight">{stoodio.name}</h1>
                    <div className="flex items-center text-slate-400 mt-2">
                         <LocationIcon className="w-5 h-5 mr-2" />
                         <span>{stoodio.location}</span>
                    </div>
                </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Earnings" value={`$${totalEarnings.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Followers" value={followersCount.toLocaleString()} icon={<UsersIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Following" value={followingCount.toLocaleString()} icon={<UserGroupIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Total Bookings" value={bookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
            </div>

             {/* Content Grid */}
            <div className="flex flex-col md:flex-row gap-8 mt-10">
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="flex flex-col space-y-2">
                        <TabButton tab="dashboard" label="Dashboard" icon={<SoundWaveIcon className="w-5 h-5"/>} />
                        <TabButton tab="availability" label="Availability" icon={<CalendarIcon className="w-5 h-5"/>} />
                        <TabButton tab="wallet" label="Wallet" icon={<DollarSignIcon className="w-5 h-5"/>} />
                        <TabButton tab="photos" label="Photos" icon={<PhotoIcon className="w-5 h-5"/>} />
                        <TabButton tab="following" label="Following" icon={<UserCheckIcon className="w-5 h-5"/>} />
                        <TabButton tab="followers" label="Followers" icon={<UsersIcon className="w-5 h-5"/>} />
                    </nav>
                </aside>
                <main className="flex-1">
                    {activeTab === 'dashboard' && <DashboardContent {...props} />}
                    {activeTab === 'availability' && <AvailabilityContent {...props} />}
                    {activeTab === 'wallet' && <WalletContent {...props} />}
                    {activeTab === 'photos' && <PhotosContent {...props} />}
                    {activeTab === 'following' && <FollowingContent {...props} />}
                    {activeTab === 'followers' && <FollowersContent {...props} />}
                </main>
            </div>
        </div>
    );
};

export default StoodioDashboard;
