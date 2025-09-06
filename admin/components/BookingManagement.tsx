


import React, { useState, useMemo } from 'react';
import type { Booking } from '../../types';
import { BookingStatus } from '../../types';
import type { PlatformUser } from '../types';
import { SearchIcon, ViewIcon, CancelIcon } from './icons';

interface BookingManagementProps {
    bookings: Booking[];
    users: PlatformUser[];
}

const BookingManagement: React.FC<BookingManagementProps> = ({ bookings, users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
    
    const findUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
            
            if (!matchesStatus) return false;

            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                booking.id.toLowerCase().includes(searchLower) ||
                (booking.artist?.name || '').toLowerCase().includes(searchLower) ||
                booking.stoodio.name.toLowerCase().includes(searchLower) ||
                (booking.engineer?.name || '').toLowerCase().includes(searchLower);
            
            return matchesSearch;
        });
    }, [bookings, searchTerm, statusFilter]);

    const statusStyles: Record<BookingStatus, string> = {
        [BookingStatus.PENDING]: 'bg-yellow-500/20 text-yellow-300',
        [BookingStatus.PENDING_APPROVAL]: 'bg-yellow-500/20 text-yellow-300',
        [BookingStatus.CONFIRMED]: 'bg-orange-500/20 text-orange-300',
        [BookingStatus.IN_PROGRESS]: 'bg-indigo-500/20 text-indigo-300',
        [BookingStatus.COMPLETED]: 'bg-green-500/20 text-green-300',
        [BookingStatus.CANCELLED]: 'bg-red-500/20 text-red-300',
    };
    
    const handleAction = (action: string, bookingId: string) => {
        alert(`${action} action for booking ${bookingId} is not implemented.`);
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">Booking Management</h1>
            <p className="text-slate-400 mb-8">Oversee all bookings and intervene when necessary.</p>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by ID, artist, stoodio..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                 <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value as BookingStatus | 'ALL')}
                    className="w-full md:w-48 bg-zinc-800 border border-zinc-700 rounded-lg py-3 px-4 focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="ALL">All Statuses</option>
                    {Object.values(BookingStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>


             <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm text-left text-slate-300">
                    <thead className="bg-zinc-700/50 text-xs text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="px-6 py-3">Booking ID</th>
                            <th scope="col" className="px-6 py-3">Artist</th>
                            <th scope="col" className="px-6 py-3">Stoodio</th>
                            <th scope="col" className="px-6 py-3">Engineer</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Cost</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                       {filteredBookings.map(booking => (
                            <tr key={booking.id} className="border-b border-zinc-700 hover:bg-zinc-800/50">
                                <td className="px-6 py-4 font-mono text-xs">{booking.id}</td>
                                <td className="px-6 py-4 font-semibold text-slate-100">{booking.artist?.name || 'N/A'}</td>
                                <td className="px-6 py-4">{booking.stoodio.name}</td>
                                <td className="px-6 py-4">{booking.engineer?.name || 'N/A'}</td>
                                <td className="px-6 py-4">{new Date(booking.date + 'T00:00').toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                     <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyles[booking.status]}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-green-400">${booking.totalCost.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleAction('View', booking.id)} className="p-2 text-slate-400 hover:text-orange-400" title="View Details">
                                        <ViewIcon className="w-5 h-5" />
                                    </button>
                                     <button onClick={() => handleAction('Cancel', booking.id)} className="p-2 text-slate-400 hover:text-red-400" title="Cancel Booking">
                                        <CancelIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                       ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingManagement;