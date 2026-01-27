
import React, { useState, useMemo, useEffect } from 'react';
import { BellIcon, CalendarIcon, UsersIcon, ChartBarIcon, CogIcon, CloseIcon, CheckCircleIcon, ClockIcon, DollarSignIcon, HouseIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import appIcon from '../assets/stoodioz-app-icon.png';

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


const BookingDetailsModal: React.FC<{ 
    bookingId: string; 
    artistName?: string; 
    onClose: () => void 
}> = ({ bookingId, artistName, onClose }) => {
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        apiService.fetchBookingById(bookingId).then(b => {
            setBooking(b);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [bookingId]);
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 relative animate-slide-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100">
                    <CloseIcon className="w-6 h-6" />
                </button>
                
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Booking Details</h3>
                
                {loading ? (
                    <div className="py-8 text-center text-zinc-400">Loading booking details...</div>
                ) : !booking ? (
                    <div className="py-8 text-center text-zinc-400">Booking not found</div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-zinc-800/50 p-4 rounded-lg">
                            <p className="text-xs text-zinc-500 uppercase font-bold">Artist</p>
                            <p className="text-lg font-bold text-zinc-100">{artistName || booking.artist?.name || 'Unknown Artist'}</p>
                        </div>
                        
                        {booking.stoodio && (
                            <div className="bg-zinc-800/50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <HouseIcon className="w-4 h-4 text-orange-400" />
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Studio</p>
                                </div>
                                <p className="text-base text-zinc-200">{booking.stoodio.name || 'Unknown Studio'}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {booking.date && (
                                <div className="bg-zinc-800/50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ClockIcon className="w-4 h-4 text-zinc-400" />
                                        <p className="text-xs text-zinc-500 uppercase font-bold">Date</p>
                                    </div>
                                    <p className="text-base text-zinc-200">{new Date(booking.date).toLocaleDateString()}</p>
                                </div>
                            )}
                            {booking.total_cost && (
                                <div className="bg-zinc-800/50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSignIcon className="w-4 h-4 text-green-400" />
                                        <p className="text-xs text-zinc-500 uppercase font-bold">Cost</p>
                                    </div>
                                    <p className="text-base text-green-400 font-bold">${Number(booking.total_cost).toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                        
                        {booking.status && (
                            <div className="bg-zinc-800/50 p-4 rounded-lg">
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Status</p>
                                <p className="text-base text-zinc-200 capitalize">{booking.status}</p>
                            </div>
                        )}
                    </div>
                )}

                <button onClick={onClose} className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-lg transition-colors">
                    Close
                </button>
            </div>
        </div>
    );
};

const LabelNotifications: React.FC = () => {
    const { currentUser } = useAppState();
    const [notifications, setNotifications] = useState<LabelNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState<'ALL' | NotificationType>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
    const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY'>('NEWEST');
    const [selectedBooking, setSelectedBooking] = useState<{ id: string, artist?: string } | null>(null);

    useEffect(() => {
        if (!currentUser?.id) return;
        const loadNotifications = async () => {
            setLoading(true);
            try {
                const data = await apiService.fetchLabelNotifications(currentUser.id);
                setNotifications(data || []);
            } catch (error) {
                console.error('Failed to load notifications:', error);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };
        loadNotifications();
    }, [currentUser?.id]);

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

    const handleMarkAsRead = async (id: string, readStatus: boolean) => {
        try {
            await apiService.markLabelNotificationAsRead(id, readStatus);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: readStatus } : n));
        } catch (error) {
            console.error('Failed to update notification:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            await Promise.all(unreadIds.map(id => apiService.markLabelNotificationAsRead(id, true)));
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await apiService.deleteLabelNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
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
                {loading ? (
                    <div className="text-center py-20">
                        <img src={appIcon} alt="Loading" className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
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
