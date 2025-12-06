import React, { useState, useMemo } from 'react';

// --- Types ---
interface MockArtist {
    id: string;
    name: string;
    image_url: string;
}

interface MockBooking {
    id: string;
    artist_id: string;
    stoodio_name: string;
    date: string;
    time: string;
    duration: number;
    price: number;
    status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
}

// --- Mock Data ---
const MOCK_ARTISTS: MockArtist[] = [
    { id: 'a1', name: 'Luna Vance', image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=200&auto=format&fit=crop' },
    { id: 'a2', name: 'The Midnight Echo', image_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&auto=format&fit=crop' },
    { id: 'a3', name: 'Jaxson Beats', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
    { id: 'a4', name: 'Velvet Voices', image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' },
];

const MOCK_BOOKINGS: MockBooking[] = [
    { id: 'b1', artist_id: 'a1', stoodio_name: 'Echo Chamber Studios', date: '2023-11-15', time: '14:00', duration: 4, price: 300, status: 'COMPLETED' },
    { id: 'b2', artist_id: 'a2', stoodio_name: 'SoundLab', date: '2023-12-01', time: '10:00', duration: 8, price: 800, status: 'COMPLETED' },
    { id: 'b3', artist_id: 'a1', stoodio_name: 'Vibe Central', date: '2024-01-20', time: '18:00', duration: 3, price: 250, status: 'CANCELLED' },
    { id: 'b4', artist_id: 'a3', stoodio_name: 'The Basement', date: '2024-05-10', time: '12:00', duration: 2, price: 100, status: 'UPCOMING' },
    { id: 'b5', artist_id: 'a4', stoodio_name: 'Skyline Recording', date: '2024-05-15', time: '15:00', duration: 5, price: 600, status: 'UPCOMING' },
    { id: 'b6', artist_id: 'a2', stoodio_name: 'Echo Chamber Studios', date: '2024-06-01', time: '09:00', duration: 10, price: 1200, status: 'UPCOMING' },
];

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
    let classes = "px-2 py-1 rounded-full text-xs font-bold uppercase";
    switch (status) {
        case 'UPCOMING': classes += " bg-blue-500/20 text-blue-400"; break;
        case 'COMPLETED': classes += " bg-green-500/20 text-green-400"; break;
        case 'CANCELLED': classes += " bg-red-500/20 text-red-400"; break;
        default: classes += " bg-zinc-700 text-zinc-400";
    }
    return <span className={classes}>{status}</span>;
};

const BookingDetailsModal = ({ booking, artist, onClose }: { booking: MockBooking, artist: MockArtist, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 relative animate-slide-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <h3 className="text-xl font-bold text-zinc-100 mb-6">Booking Details</h3>
                
                <div className="flex items-center gap-4 mb-6">
                    <img src={artist.image_url} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-orange-500" />
                    <div>
                        <p className="text-sm text-zinc-400">Artist</p>
                        <p className="text-lg font-bold text-zinc-100">{artist.name}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Location</p>
                        <p className="font-semibold text-zinc-200">{booking.stoodio_name}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Date</p>
                            <p className="font-semibold text-zinc-200">{new Date(booking.date).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Time</p>
                            <p className="font-semibold text-zinc-200">{booking.time} ({booking.duration}h)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Price</p>
                            <p className="font-bold text-green-400 text-lg">${booking.price}</p>
                        </div>
                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 flex items-center justify-center">
                            <StatusBadge status={booking.status} />
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
    const [selectedArtistId, setSelectedArtistId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedBooking, setSelectedBooking] = useState<MockBooking | null>(null);

    const filteredBookings = useMemo(() => {
        return MOCK_BOOKINGS.filter(booking => {
            const matchesArtist = selectedArtistId === 'all' || booking.artist_id === selectedArtistId;
            const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
            
            let matchesDate = true;
            if (startDate && booking.date < startDate) matchesDate = false;
            if (endDate && booking.date > endDate) matchesDate = false;

            return matchesArtist && matchesStatus && matchesDate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedArtistId, statusFilter, startDate, endDate]);

    const getArtist = (id: string) => MOCK_ARTISTS.find(a => a.id === id) || { id: 'unknown', name: 'Unknown', image_url: '' };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Label Bookings</h1>
                <p className="text-zinc-400 mt-2">Track all sessions across your roster.</p>
            </div>

            {/* Filters */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* Artist Filter */}
                    <select 
                        value={selectedArtistId} 
                        onChange={(e) => setSelectedArtistId(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="all">All Artists</option>
                        {MOCK_ARTISTS.map(artist => (
                            <option key={artist.id} value={artist.id}>{artist.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="UPCOMING">Upcoming</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
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

            {/* Bookings Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Artist</th>
                                <th className="p-4">Stoodio</th>
                                <th className="p-4">Date & Time</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredBookings.length > 0 ? filteredBookings.map(booking => {
                                const artist = getArtist(booking.artist_id);
                                return (
                                    <tr 
                                        key={booking.id} 
                                        onClick={() => setSelectedBooking(booking)}
                                        className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={artist.image_url} alt={artist.name} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                                                <span className="font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors">{artist.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-zinc-300">{booking.stoodio_name}</td>
                                        <td className="p-4 text-zinc-400 text-sm">
                                            <div>{new Date(booking.date).toLocaleDateString()}</div>
                                            <div className="text-xs opacity-70">{booking.time} ({booking.duration}h)</div>
                                        </td>
                                        <td className="p-4 font-mono text-zinc-300">${booking.price}</td>
                                        <td className="p-4">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-zinc-500">
                                        No bookings found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {selectedBooking && (
                <BookingDetailsModal 
                    booking={selectedBooking} 
                    artist={getArtist(selectedBooking.artist_id)} 
                    onClose={() => setSelectedBooking(null)} 
                />
            )}
        </div>
    );
};

export default LabelBookings;