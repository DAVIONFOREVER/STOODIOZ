import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Booking, RosterMember } from '../types';
import { UsersIcon } from './icons';
import { getProfileImageUrl } from '../constants';

const StatusBadge = ({ status }: { status: string }) => {
    let classes = "px-2 py-1 rounded-full text-xs font-bold uppercase";
    switch (status) {
        case 'PENDING':
        case 'PENDING_APPROVAL':
        case 'PENDING_LABEL_APPROVAL':
            classes += " bg-yellow-500/20 text-yellow-400";
            break;
        case 'CONFIRMED':
            classes += " bg-blue-500/20 text-blue-400";
            break;
        case 'COMPLETED':
            classes += " bg-green-500/20 text-green-400";
            break;
        case 'CANCELLED':
        case 'DENIED':
            classes += " bg-red-500/20 text-red-400";
            break;
        default:
            classes += " bg-zinc-700 text-zinc-400";
    }
    return <span className={classes}>{status || 'UNKNOWN'}</span>;
};

const BookingDetailsModal = ({
    booking,
    artist,
    onClose
}: {
    booking: Booking;
    artist: { name: string; image_url?: string | null };
    onClose: () => void;
}) => {
    const stoodioName = booking.stoodio?.name || (booking as any).stoodio_name || 'Remote';
    const bookingTime = (booking as any).start_time || (booking as any).time || '';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 relative animate-slide-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <h3 className="text-xl font-bold text-zinc-100 mb-6">Booking Details</h3>
                
                <div className="flex items-center gap-4 mb-6">
                    {artist.image_url ? (
                        <img src={artist.image_url} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-orange-500" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                            <UsersIcon className="w-8 h-8 text-zinc-500" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-zinc-400">Artist</p>
                        <p className="text-lg font-bold text-zinc-100">{artist.name}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Studio / Facility</p>
                        <p className="font-semibold text-zinc-200">{stoodioName}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Date</p>
                            <p className="font-semibold text-zinc-200">{booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Time</p>
                            <p className="font-semibold text-zinc-200">{bookingTime || 'N/A'} ({booking.duration}h)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Cost</p>
                            <p className="font-bold text-green-400 text-lg">${Number(booking.total_cost || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 flex items-center justify-center">
                            <StatusBadge status={(booking.status || '').toString().toUpperCase()} />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button onClick={onClose} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const LabelBookings: React.FC = () => {
    const { currentUser, userRole } = useAppState();
    const [selectedArtistId, setSelectedArtistId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!currentUser || userRole !== 'LABEL') return;
            setLoading(true);
            try {
                const [bookingsData, rosterData] = await Promise.all([
                    apiService.fetchLabelBookings(currentUser.id),
                    apiService.fetchLabelRoster(currentUser.id),
                ]);
                setBookings(bookingsData || []);
                setRoster(rosterData || []);
            } catch (e) {
                console.error('Failed to load label bookings', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentUser, userRole]);

    const resolveArtist = (booking: any) => {
        if (booking.artist?.name) {
            return { id: booking.artist.id, name: booking.artist.name, image_url: booking.artist.image_url };
        }
        const id =
            booking.artist_profile_id ||
            booking.artist_id ||
            booking.artist?.id ||
            booking.artist_profile?.id;
        const rosterMatch = roster.find((r: any) =>
            r.user_id === id ||
            r.profile_id === id ||
            r.artist_profile_id === id ||
            r.id === id
        );
        if (rosterMatch) {
            return { id: rosterMatch.user_id || rosterMatch.id, name: rosterMatch.name, image_url: rosterMatch.image_url };
        }
        return { id: id || 'unknown', name: 'Unknown Artist', image_url: '' };
    };

    const filteredBookings = useMemo(() => {
        return bookings
            .filter((booking: any) => {
                const artist = resolveArtist(booking);
                const matchesArtist = selectedArtistId === 'all' || artist.id === selectedArtistId;
                const status = (booking.status || '').toString().toUpperCase();
                const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
                
                let matchesDate = true;
                if (startDate && booking.date < startDate) matchesDate = false;
                if (endDate && booking.date > endDate) matchesDate = false;

                return matchesArtist && matchesStatus && matchesDate;
            })
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [bookings, selectedArtistId, statusFilter, startDate, endDate, roster]);

    const rosterOptions = useMemo(() => {
        const unique = new Map<string, { id: string; name: string }>();
        roster.forEach((r: any) => {
            if (r?.name) {
                const id = r.user_id || r.profile_id || r.artist_profile_id || r.id;
                if (id) unique.set(id, { id, name: r.name });
            }
        });
        return Array.from(unique.values());
    }, [roster]);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Session Schedule</h1>
                <p className="text-zinc-400 mt-2">Manage tracking, mixing, and writing sessions for your roster.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <select 
                        value={selectedArtistId} 
                        onChange={(e) => setSelectedArtistId(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="all">All Artists</option>
                        {rosterOptions.map((artist) => (
                            <option key={artist.id} value={artist.id}>{artist.name}</option>
                        ))}
                    </select>

                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="PENDING_APPROVAL">Pending Approval</option>
                        <option value="PENDING_LABEL_APPROVAL">Pending Label Approval</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="DENIED">Denied</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500 w-full md:w-auto"
                    />
                    <span className="text-zinc-600">-</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500 w-full md:w-auto"
                    />
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Artist</th>
                                <th className="p-4">Facility</th>
                                <th className="p-4">Date & Time</th>
                                <th className="p-4">Budget</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-500">Loading bookings...</td>
                                </tr>
                            ) : filteredBookings.length > 0 ? filteredBookings.map((booking: any) => {
                                const artist = resolveArtist(booking);
                                const stoodioName = booking.stoodio?.name || booking.stoodio_name || 'Remote';
                                const bookingTime = booking.start_time || booking.time || '';
                                return (
                                    <tr 
                                        key={booking.id} 
                                        onClick={() => setSelectedBooking(booking)}
                                        className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={getProfileImageUrl(artist)} alt={artist.name} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                                                <span className="font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors">{artist.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-zinc-300">{stoodioName}</td>
                                        <td className="p-4 text-zinc-400 text-sm">
                                            <div>{booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}</div>
                                            <div className="text-xs opacity-70">{bookingTime || 'N/A'} ({booking.duration}h)</div>
                                        </td>
                                        <td className="p-4 font-mono text-zinc-300">${Number(booking.total_cost || 0).toLocaleString()}</td>
                                        <td className="p-4">
                                            <StatusBadge status={(booking.status || '').toString().toUpperCase()} />
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                                        No bookings match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedBooking && (
                <BookingDetailsModal 
                    booking={selectedBooking} 
                    artist={resolveArtist(selectedBooking)} 
                    onClose={() => setSelectedBooking(null)} 
                />
            )}
        </div>
    );
};

export default LabelBookings;
