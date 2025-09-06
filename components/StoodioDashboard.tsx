
import React, { useState, useMemo } from 'react';
import type { Stoodio, Booking, Artist, Engineer, LinkAttachment, Post, BookingRequest, Transaction } from '../types';
import { BookingStatus } from '../types';
import { EditIcon, PhotoIcon, CalendarIcon, LocationIcon, UsersIcon, DollarSignIcon, SoundWaveIcon, UserCheckIcon, UserPlusIcon, UserGroupIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';

type JobPostData = Pick<BookingRequest, 'date' | 'startTime' | 'duration' | 'requiredSkills' | 'engineerPayRate'>;

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
    onPostJob: (jobRequest: JobPostData) => void;
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

const RatesCard: React.FC<{ stoodio: Stoodio; onUpdateStoodio: (updates: Partial<Stoodio>) => void }> = ({ stoodio, onUpdateStoodio }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [rates, setRates] = useState({
        hourlyRate: stoodio.hourlyRate.toString(),
        engineerPayRate: stoodio.engineerPayRate.toString(),
    });

    const handleSave = () => {
        onUpdateStoodio({
            hourlyRate: parseFloat(rates.hourlyRate) || 0,
            engineerPayRate: parseFloat(rates.engineerPayRate) || 0,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setRates({
            hourlyRate: stoodio.hourlyRate.toString(),
            engineerPayRate: stoodio.engineerPayRate.toString(),
        });
        setIsEditing(false);
    };

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-100">Rates & Info</h3>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                        <EditIcon className="w-4 h-4" /> Edit
                    </button>
                )}
            </div>
            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="hourlyRate" className="text-sm font-semibold text-slate-400 mb-1 block">Your Hourly Rate ($)</label>
                        <input type="number" id="hourlyRate" value={rates.hourlyRate} onChange={e => setRates({...rates, hourlyRate: e.target.value})} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    <div>
                        <label htmlFor="engineerPayRate" className="text-sm font-semibold text-slate-400 mb-1 block">Default Engineer Payout ($/hr)</label>
                        <input type="number" id="engineerPayRate" value={rates.engineerPayRate} onChange={e => setRates({...rates, engineerPayRate: e.target.value})} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={handleCancel} className="text-sm font-semibold px-4 py-2 rounded-lg text-slate-300 hover:bg-zinc-600">Cancel</button>
                        <button onClick={handleSave} className="text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 text-white">Save Rates</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-300">Stoodio Hourly Rate:</span>
                        <span className="font-bold text-lg text-green-400">${stoodio.hourlyRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-300">Default Engineer Payout:</span>
                        <span className="font-bold text-lg text-orange-400">${stoodio.engineerPayRate.toFixed(2)}/hr</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const PostJobCard: React.FC<{ stoodio: Stoodio; onPostJob: StoodioDashboardProps['onPostJob'] }> = ({ stoodio, onPostJob }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [startTime, setStartTime] = useState('12:00');
    const [duration, setDuration] = useState(4);
    const [skills, setSkills] = useState('');
    const [engineerPayRate, setEngineerPayRate] = useState(stoodio.engineerPayRate.toString());
    
    React.useEffect(() => {
        setEngineerPayRate(stoodio.engineerPayRate.toString());
    }, [stoodio.engineerPayRate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onPostJob({
            date,
            startTime,
            duration,
            requiredSkills: skills ? skills.split(',').map(s => s.trim()) : [],
            engineerPayRate: parseFloat(engineerPayRate) || 0,
        });
        // Reset form to defaults
        setDate(today);
        setStartTime('12:00');
        setDuration(4);
        setSkills('');
        setEngineerPayRate(stoodio.engineerPayRate.toString());
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
                    <label htmlFor="job-pay-rate" className="text-sm font-semibold text-slate-400 mb-1 block">Engineer Payout ($/hr)</label>
                    <input type="number" id="job-pay-rate" value={engineerPayRate} min="0" step="1" onChange={e => setEngineerPayRate(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                 <div>
                    <label htmlFor="job-skills" className="text-sm font-semibold text-slate-400 mb-1 block">Required Skills (optional, comma-separated)</label>
                    <input type="text" id="job-skills" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g., Pro Tools, Vocal Tuning" className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <button type="submit" className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all shadow-md">
                    Post Job to Board
                </button>
            </form>
        </div>
    );
};

const DashboardContent: React.FC<Omit<StoodioDashboardProps, 'allArtists'|'allEngineers'|'allStoodioz'|'onToggleFollow'|'onSelectArtist'|'onSelectEngineer'|'onSelectStoodio'>> = (props) => {
    const { stoodio, bookings, onPost, onLikePost, onCommentOnPost, currentUser, onPostJob, onUpdateStoodio } = props;
    
    const recentBookings = bookings
        .filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
        .slice(0, 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <CreatePost currentUser={stoodio} onPost={onPost} />
                <PostFeed 
                    posts={stoodio.posts || []} 
                    authors={new Map([[stoodio.id, stoodio]])}
                    onLikePost={onLikePost}
                    onCommentOnPost={onCommentOnPost}
                    currentUser={currentUser}
                />
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
                                checked={stoodio.notificationsEnabled ?? true}
                                onChange={(e) => onUpdateStoodio({ notificationsEnabled: e.target.checked })}
                            />
                            <div className="block bg-zinc-600 w-12 h-6 rounded-full peer-checked:bg-green-500 transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </div>
                    </label>
                </div>
                <RatesCard stoodio={stoodio} onUpdateStoodio={onUpdateStoodio} />
                <PostJobCard stoodio={stoodio} onPostJob={onPostJob} />
            </div>
        </div>
    );
};

// ... (Other tab content components like Availability, Wallet, Followers, etc., remain the same) ...

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
                    <h1 className="text-5xl font-extrabold tracking-tight text-orange-500">{stoodio.name}</h1>
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
                    {activeTab === 'availability' && <div>Availability content would go here.</div>}
                    {activeTab === 'wallet' && <div>Wallet content would go here.</div>}
                    {activeTab === 'photos' && <div>Photos content would go here.</div>}
                    {activeTab === 'following' && <div>Following content would go here.</div>}
                    {activeTab === 'followers' && <div>Followers content would go here.</div>}
                </main>
            </div>
        </div>
    );
};

export default StoodioDashboard;
