import React, { useState } from 'react';
import type { Stoodio, Booking, Artist, Engineer, LinkAttachment, Post, BookingRequest, Transaction } from '../types';
import { BookingStatus, UserRole } from '../types';
import { BriefcaseIcon, CalendarIcon, UsersIcon, DollarSignIcon, PhotoIcon, HouseIcon, SoundWaveIcon, VerifiedIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import AvailabilityManager from './AvailabilityManager';
import Following from './Following';
import FollowersList from './FollowersList';
import RoomManager from './RoomManager';
import EngineerManager from './EngineerManager';
import VerificationManager from './VerificationManager';

type JobPostData = Pick<BookingRequest, 'date' | 'startTime' | 'duration' | 'requiredSkills' | 'engineerPayRate'>;

const JobPostForm: React.FC<{ onPostJob: (data: JobPostData) => void }> = ({ onPostJob }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [startTime, setStartTime] = useState('14:00');
    const [duration, setDuration] = useState(4);
    const [engineerPayRate, setEngineerPayRate] = useState(50);
    const [requiredSkills, setRequiredSkills] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onPostJob({
            date,
            startTime,
            duration,
            engineerPayRate,
            requiredSkills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Post a New Job</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} min={today} className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600">Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600">Duration (hrs)</label>
                    <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min="1" className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600">Pay Rate ($/hr)</label>
                    <input type="number" value={engineerPayRate} onChange={e => setEngineerPayRate(Number(e.target.value))} min="20" className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                </div>
                <div className="md:col-span-2 lg:col-span-5">
                    <label className="block text-sm font-medium text-slate-600">Required Skills (optional, comma-separated)</label>
                    <input type="text" value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder="e.g. Pro Tools, Vocal Tuning, Mixing" className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                </div>
                 <div className="lg:col-start-5">
                     <button type="submit" className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors">Post Job</button>
                </div>
            </div>
        </form>
    );
};

const StoodioJobManagement: React.FC<{ stoodio: Stoodio; bookings: Booking[]; onPostJob: (data: JobPostData) => void; }> = ({ stoodio, bookings, onPostJob }) => {
    const postedJobs = bookings
        .filter(b => b.postedBy === UserRole.STOODIO && b.stoodio.id === stoodio.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getStatusInfo = (job: Booking) => {
        switch(job.status) {
            case BookingStatus.PENDING:
                return { text: "Pending", color: "bg-yellow-100 text-yellow-800" };
            case BookingStatus.CONFIRMED:
                return { text: `Filled by ${job.engineer?.name}`, color: "bg-green-100 text-green-800" };
            case BookingStatus.COMPLETED:
                return { text: "Completed", color: "bg-blue-100 text-blue-800" };
            case BookingStatus.CANCELLED:
                 return { text: "Cancelled", color: "bg-red-100 text-red-800" };
            default:
                return { text: job.status, color: "bg-slate-100 text-slate-800" };
        }
    }

    return (
        <div>
            <JobPostForm onPostJob={onPostJob} />
             <h3 className="text-xl font-bold text-slate-900 mb-4">Your Posted Jobs</h3>
             <div className="space-y-4">
                {postedJobs.length > 0 ? postedJobs.map(job => {
                    const status = getStatusInfo(job);
                    return (
                        <div key={job.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                            <div>
                                <p className="text-xs text-slate-500">Date</p>
                                <p className="font-semibold">{new Date(job.date + 'T00:00:00').toLocaleDateString()}</p>
                            </div>
                             <div>
                                <p className="text-xs text-slate-500">Payout</p>
                                <p className="font-semibold text-green-600">${(job.engineerPayRate * job.duration).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Status</p>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                            </div>
                            <div className="text-right">
                                {/* Future actions like "Cancel Job" could go here */}
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-center py-8 text-slate-500">You haven't posted any jobs yet.</p>
                )}
             </div>
        </div>
    );
};


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
    onVerificationSubmit: (stoodioId: string, data: { googleBusinessProfileUrl: string; websiteUrl: string }) => void;
}

type DashboardTab = 'dashboard' | 'verification' | 'jobManagement' | 'availability' | 'rooms' | 'engineers' | 'wallet' | 'photos' | 'followers' | 'following';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 border border-slate-200">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-slate-500 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 font-semibold text-sm transition-colors ${isActive ? 'border-b-2 border-orange-500 text-orange-500' : 'text-slate-500 hover:text-slate-800'}`}
    >
        {label}
    </button>
);

const StoodioDashboard: React.FC<StoodioDashboardProps> = (props) => {
    const { stoodio, bookings, onUpdateStoodio, onPost, onLikePost, onCommentOnPost, currentUser, onPostJob, allArtists, allEngineers, allStoodioz, onToggleFollow, onSelectStoodio, onSelectArtist, onSelectEngineer, onVerificationSubmit } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

    const upcomingBookingsCount = bookings
        .filter(b => b.status === BookingStatus.CONFIRMED && new Date(`${b.date}T${b.startTime}`) >= new Date())
        .length;
    
    const followers = [...allArtists, ...allEngineers, ...allStoodioz].filter(u => u.followerIds.includes(stoodio.id));
    const followedArtists = allArtists.filter(a => stoodio.following.artists.includes(a.id));
    const followedEngineers = allEngineers.filter(e => stoodio.following.engineers.includes(e.id));
    const followedStoodioz = allStoodioz.filter(s => stoodio.following.stoodioz.includes(s.id));

    const renderContent = () => {
        switch (activeTab) {
            case 'verification':
                return <VerificationManager stoodio={stoodio} onVerificationSubmit={onVerificationSubmit} />;
            case 'jobManagement':
                return <StoodioJobManagement stoodio={stoodio} bookings={bookings} onPostJob={onPostJob} />;
            case 'availability':
                return <AvailabilityManager user={stoodio} onUpdateUser={onUpdateStoodio} />;
            case 'rooms':
                return <RoomManager stoodio={stoodio} onUpdateStoodio={onUpdateStoodio} />;
            case 'engineers':
                return <EngineerManager stoodio={stoodio} allEngineers={allEngineers} onUpdateStoodio={onUpdateStoodio} />;
            case 'wallet':
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                        <h3 className="text-xl font-bold mb-4">Wallet</h3>
                        <p className="text-4xl font-bold text-green-500 mb-6">${stoodio.walletBalance.toFixed(2)}</p>
                        <h4 className="font-semibold mb-2">Transaction History</h4>
                        <div className="space-y-2">
                            {stoodio.walletTransactions.map((tx: Transaction) => (
                                <div key={tx.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
                                    <div>
                                        <p className="font-medium text-slate-700">{tx.description}</p>
                                        <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleString()}</p>
                                    </div>
                                    <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                        {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'photos':
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                        <h3 className="text-xl font-bold mb-4">Photo Management</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {stoodio.photos.map((photo, index) => (
                                <img key={index} src={photo} alt={`${stoodio.name} ${index + 1}`} className="w-full h-32 object-cover rounded-lg"/>
                            ))}
                        </div>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                            <PhotoIcon className="mx-auto h-12 w-12 text-slate-400" />
                            <p className="mt-2 text-sm text-slate-600">Drag & drop photos here or click to upload</p>
                            <button className="mt-4 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg text-sm">Upload Photos</button>
                        </div>
                    </div>
                );
            case 'followers':
                 return <FollowersList followers={followers} onSelectArtist={onSelectArtist} onSelectEngineer={onSelectEngineer} onSelectStoodio={onSelectStoodio} />;
            case 'following':
                return <Following studios={followedStoodioz} engineers={followedEngineers} artists={followedArtists} onToggleFollow={onToggleFollow} onSelectStudio={onSelectStoodio} onSelectArtist={onSelectArtist} onSelectEngineer={onSelectEngineer} />;
            case 'dashboard':
            default:
                 return (
                    <div className="space-y-8">
                        <CreatePost currentUser={currentUser!} onPost={onPost} />
                        <PostFeed posts={stoodio.posts || []} authors={new Map([[stoodio.id, stoodio]])} onLikePost={onLikePost} onCommentOnPost={onCommentOnPost} currentUser={currentUser} />
                    </div>
                );
        }
    }

    return (
        <div className="space-y-8">
            {/* Profile Header */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <img src={stoodio.imageUrl} alt={stoodio.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-slate-200 flex-shrink-0" />
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">{stoodio.name}</h1>
                            <p className="text-slate-500 mt-2">Stoodio Dashboard</p>
                        </div>
                    </div>
                     <div className="flex-shrink-0 pt-2">
                        <label className="flex items-center cursor-pointer">
                            <span className="text-sm font-medium text-slate-700 mr-3">Show on Map</span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={stoodio.showOnMap ?? false} 
                                    onChange={(e) => onUpdateStoodio({ showOnMap: e.target.checked })} 
                                />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${stoodio.showOnMap ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${stoodio.showOnMap ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                     <StatCard label="Wallet Balance" value={`$${stoodio.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-500" />} />
                    <StatCard label="Upcoming Bookings" value={upcomingBookingsCount} icon={<CalendarIcon className="w-6 h-6 text-orange-500" />} />
                    <StatCard label="Followers" value={stoodio.followers} icon={<UsersIcon className="w-6 h-6 text-blue-500" />} />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-lg">
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Verification" isActive={activeTab === 'verification'} onClick={() => setActiveTab('verification')} />
                    <TabButton label="Job Management" isActive={activeTab === 'jobManagement'} onClick={() => setActiveTab('jobManagement')} />
                    <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
                    <TabButton label="Rooms" isActive={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
                    <TabButton label="Engineers" isActive={activeTab === 'engineers'} onClick={() => setActiveTab('engineers')} />
                    <TabButton label="Wallet" isActive={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
                    <TabButton label="Photos" isActive={activeTab === 'photos'} onClick={() => setActiveTab('photos')} />
                    <TabButton label="Followers" isActive={activeTab === 'followers'} onClick={() => setActiveTab('followers')} />
                    <TabButton label="Following" isActive={activeTab === 'following'} onClick={() => setActiveTab('following')} />
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default StoodioDashboard;