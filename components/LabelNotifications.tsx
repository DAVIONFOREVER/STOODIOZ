
import React, { useState, useMemo } from 'react';
import { BellIcon, CalendarIcon, UsersIcon, ChartBarIcon, CogIcon, CloseIcon, CheckCircleIcon, ClockIcon, DollarSignIcon, HouseIcon } from './icons';

// --- Types ---
type NotificationType = 'booking' | 'roster' | 'performance' | 'system';
type NotificationPriority = 'low' | 'normal' | 'high';

interface LabelNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    created_at: string; // ISO string
    is_read: boolean;
    priority: NotificationPriority;
    related_artist_name?: string;
    related_booking_id?: string;
}

// --- Mock Data ---
const MOCK_NOTIFICATIONS: LabelNotification[] = [
    {
        id: 'n1',
        type: 'booking',
        title: 'New Booking Request',
        message: 'Luna Vance requested a session at Echo Chamber Studios.',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        is_read: false,
        priority: 'high',
        related_artist_name: 'Luna Vance',
        related_booking_id: 'b-101'
    },
    {
        id: 'n2',
        type: 'performance',
        title: 'Trending Artist',
        message: 'The Midnight Echo is trending on The Stage with +20% engagement.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        is_read: false,
        priority: 'normal',
        related_artist_name: 'The Midnight Echo'
    },
    {
        id: 'n3',
        type: 'roster',
        title: 'Artist Invite Accepted',
        message: 'Jaxson Beats has joined your roster.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        is_read: true,
        priority: 'normal',
        related_artist_name: 'Jaxson Beats'
    },
    {
        id: 'n4',
        type: 'system',
        title: 'Subscription Renewed',
        message: 'Your Label Pro subscription has been successfully renewed.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        is_read: true,
        priority: 'low'
    },
    {
        id: 'n5',
        type: 'booking',
        title: 'Session Completed',
        message: 'Velvet Voices completed a session at SoundLab.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day, 2 hours ago
        is_read: false,
        priority: 'normal',
        related_artist_name: 'Velvet Voices',
        related_booking_id: 'b-102'
    },
    {
        id: 'n6',
        type: 'performance',
        title: 'Milestone Reached',
        message: 'Luna Vance hit 100k total streams this month.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        is_read: true,
        priority: 'high',
        related_artist_name: 'Luna Vance'
    },
    {
        id: 'n7',
        type: 'roster',
        title: 'Artist Removal Request',
        message: 'Neon Drifter has requested to leave the roster.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
        is_read: false,
        priority: 'high',
        related_artist_name: 'Neon Drifter'
    },
    {
        id: 'n8',
        type: 'system',
        title: 'Security Alert',
        message: 'New login detected from a different location.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        is_read: true,
        priority: 'high'
    },
    {
        id: 'n9',
        type: 'booking',
        title: 'Booking Cancelled',
        message: 'Jaxson Beats cancelled their session at The Basement.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
        is_read: true,
        priority: 'normal',
        related_artist_name: 'Jaxson Beats',
        related_booking_id: 'b-103'
    },
    {
        id: 'n10',
        type: 'performance',
        title: 'Weekly Report Ready',
        message: 'Your weekly artist performance report is ready to view.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(), // 1 week ago
        is_read: true,
        priority: 'low'
    }
];

const BookingDetailsModal: React.FC<{ 
    bookingId: string; 
    artistName?: string; 
    onClose: () => void 
}> = ({ bookingId, artistName, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 relative animate-slide-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100">
                    <CloseIcon className="w-6 h-6" />
                </button>
                
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Booking Details (Mock)</h3>
                <p className="text-sm text-zinc-500 mb-6">ID: {bookingId}</p>
                
                <div className="space-y-4">
                    <div className="bg-zinc-800/50 p-4 rounded-lg">
                        <p className="text-xs text-zinc-500 uppercase font-bold">Artist</p>
                        <p className="text-lg font-bold text-zinc-100">{artistName || 'Unknown Artist'}</p>
                    </div>
                    
                    <div className="bg-zinc-800/50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <HouseIcon className="w-4 h-4 text-orange-400" />
                            <p className="text-xs text-zinc-500 uppercase font-bold">Studio</p>
                        </div>
                        <p className="text-base text-zinc-200">Echo Chamber Studios</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-800/50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <ClockIcon className="w-4 h-4 text-zinc-400" />
                                <p className="text-xs text-zinc-500 uppercase font-bold">Time</p>
                            </div>
                            <p className="text-base text-zinc-200">Oct 24, 2:00 PM</p>
                        </div>
                        <div className="bg-zinc-800/50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSignIcon className="w-4 h-4 text-green-400" />
                                <p className="text-xs text-zinc-500 uppercase font-bold">Cost</p>
                            </div>
                            <p className="text-base text-green-400 font-bold">$450.00</p>
                        </div>
                    </div>
                </div>

                <button onClick={onClose} className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-lg transition-colors">
                    Close
                </button>
            </div>
        </div>
    );
};

const LabelNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<LabelNotification[]>(MOCK_NOTIFICATIONS);
    const [typeFilter, setTypeFilter] = useState<'ALL' | NotificationType>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
    const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY'>('NEWEST');
    const [selectedBooking, setSelectedBooking] = useState<{ id: string, artist?: string } | null>(null);

    const filteredNotifications = useMemo(() => {
        let result = [...notifications];

        if (typeFilter !== 'ALL') {
            result = result.filter(n => n.type === typeFilter);
        }

        if (statusFilter === 'UNREAD') {
            result = result.filter(n => !n.is_read);
        } else if (statusFilter === 'READ') {
            result = result.filter(n => n.is_read);
        }

        result.sort((a, b) => {
            if (sortOrder === 'NEWEST') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortOrder === 'OLDEST') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortOrder === 'PRIORITY') {
                const pMap = { high: 3, normal: 2, low: 1 };
                return pMap[b.priority] - pMap[a.priority];
            }
            return 0;
        });

        return result;
    }, [notifications, typeFilter, statusFilter, sortOrder]);

    const handleMarkAsRead = (id: string, readStatus: boolean) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: readStatus } : n));
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const handleDelete = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getTypeIcon = (type: NotificationType) => {
        switch (type) {
            case 'booking': return <CalendarIcon className="w-5 h-5 text-blue-400" />;
            case 'roster': return <UsersIcon className="w-5 h-5 text-green-400" />;
            case 'performance': return <ChartBarIcon className="w-5 h-5 text-purple-400" />;
            case 'system': return <CogIcon className="w-5 h-5 text-zinc-400" />;
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            {/* SECTION A: Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Notifications Center</h1>
                    <p className="text-zinc-400 mt-1">Stay on top of bookings, roster moves, and key label activity.</p>
                </div>
                <button 
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border border-zinc-700"
                >
                    <CheckCircleIcon className="w-4 h-4" />
                    Mark all as read
                </button>
            </div>

            {/* SECTION B: Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Filter by Type</label>
                    <select 
                        value={typeFilter} 
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="ALL">All Types</option>
                        <option value="booking">Bookings</option>
                        <option value="roster">Roster</option>
                        <option value="performance">Performance</option>
                        <option value="system">System</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="ALL">All</option>
                        <option value="UNREAD">Unread</option>
                        <option value="READ">Read</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Sort By</label>
                    <select 
                        value={sortOrder} 
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="NEWEST">Newest First</option>
                        <option value="OLDEST">Oldest First</option>
                        <option value="PRIORITY">Priority</option>
                    </select>
                </div>
            </div>

            {/* SECTION C: Notification List */}
            <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => (
                        <div 
                            key={notif.id} 
                            className={`relative p-5 rounded-xl border transition-all duration-200 ${
                                notif.is_read 
                                ? 'bg-zinc-900 border-zinc-800 opacity-80' 
                                : 'bg-zinc-800 border-orange-500/30 shadow-lg shadow-orange-500/5'
                            }`}
                        >
                            {/* Unread Indicator */}
                            {!notif.is_read && (
                                <div className="absolute top-5 right-5 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                            )}

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full flex-shrink-0 bg-zinc-900 border border-zinc-700`}>
                                    {getTypeIcon(notif.type)}
                                </div>
                                
                                <div className="flex-grow">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                        <h3 className={`text-lg font-bold ${notif.is_read ? 'text-zinc-300' : 'text-zinc-100'}`}>
                                            {notif.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wide ${
                                                notif.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                notif.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-zinc-700 text-zinc-400'
                                            }`}>
                                                {notif.priority}
                                            </span>
                                            <span className="text-xs text-zinc-500 md:hidden">
                                                {formatTime(notif.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-zinc-400 mb-3">{notif.message}</p>
                                    
                                    {notif.related_artist_name && (
                                        <p className="text-sm text-zinc-500 mb-3">
                                            Artist: <span className="text-zinc-300 font-semibold">{notif.related_artist_name}</span>
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-3 mt-2">
                                        {notif.related_booking_id && (
                                            <button 
                                                onClick={() => setSelectedBooking({ id: notif.related_booking_id!, artist: notif.related_artist_name })}
                                                className="px-3 py-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                View Booking
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleMarkAsRead(notif.id, !notif.is_read)}
                                            className="px-3 py-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            {notif.is_read ? 'Mark Unread' : 'Mark Read'}
                                        </button>

                                        <button 
                                            onClick={() => handleDelete(notif.id)}
                                            className="px-3 py-1.5 text-zinc-500 hover:text-red-400 text-sm font-semibold transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="hidden md:block text-xs text-zinc-500 whitespace-nowrap">
                                    {formatTime(notif.created_at)}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <BellIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400 font-semibold">No notifications found</p>
                        <p className="text-zinc-500 text-sm">Adjust filters or check back later.</p>
                    </div>
                )}
            </div>

            {/* SECTION D: Booking Details Modal */}
            {selectedBooking && (
                <BookingDetailsModal 
                    bookingId={selectedBooking.id} 
                    artistName={selectedBooking.artist} 
                    onClose={() => setSelectedBooking(null)} 
                />
            )}
        </div>
    );
};

export default LabelNotifications;
