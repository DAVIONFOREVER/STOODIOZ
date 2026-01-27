import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from './icons';
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { getProfileImageUrl } from '../constants';

const MasterCalendar: React.FC = () => {
    const { bookings, artists, userRole, currentUser } = useAppState();
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [labelRoster, setLabelRoster] = useState<any[]>([]);

    useEffect(() => {
        if (userRole === 'LABEL' && currentUser?.id) {
            apiService.fetchLabelRoster(currentUser.id).then((rows) => setLabelRoster(rows || [])).catch(() => setLabelRoster([]));
        } else {
            setLabelRoster([]);
        }
    }, [userRole, currentUser?.id]);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

    // For LABEL: only this label's roster (artists, engineers, producers); for others: artists. Guard against undefined.
    const rosterToDisplay = useMemo(() => {
        if (userRole === 'LABEL' && labelRoster.length > 0) {
            // Include all roster members: artists, engineers, and producers
            return labelRoster.map((r: any) => ({
                id: r.artist_profile_id || r.user_id || r.id,
                name: r.name || r.artist_name || 'Roster Member',
                image_url: r.image_url,
                role: r.role_in_label || r.role || 'artist', // Track role for booking filtering
            })).filter((a: any) => a.id);
        }
        return (artists ?? []).slice(0, userRole === 'LABEL' ? 5 : 1);
    }, [userRole, labelRoster, artists]);

    // For LABEL: only this label's bookings for roster members (artists, engineers, producers)
    const scopeBookings = useMemo(() => {
        const list = bookings ?? [];
        if (userRole === 'LABEL' && currentUser?.id && labelRoster.length > 0) {
            // Get all roster member IDs (artists, engineers, producers)
            const rosterMemberIds = new Set(
                labelRoster.map((r: any) => r.artist_profile_id || r.user_id || r.id).filter(Boolean)
            );
            
            // Filter bookings to only include those for roster members
            return list.filter((b: any) => {
                // Must be a booking for this label
                if (b.label_profile_id !== currentUser.id) return false;
                
                // Check if the booking involves a roster member (artist, engineer, or producer)
                const artistId = b.artist?.id || b.artist_profile_id;
                const engineerId = b.engineer_profile_id || b.requested_engineer_id;
                const producerId = b.producer_profile_id || b.producer_id || b.booked_by_id;
                
                return rosterMemberIds.has(artistId) || 
                       rosterMemberIds.has(engineerId) || 
                       rosterMemberIds.has(producerId);
            });
        }
        if (userRole === 'LABEL' && currentUser?.id) {
            // Fallback: if no roster, show no bookings
            return [];
        }
        return list;
    }, [bookings, userRole, currentUser?.id, labelRoster]);

    const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
    const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-100">Master Schedule</h1>
                    <p className="text-zinc-400 mt-1">Unified view of roster sessions and studio holds.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevWeek} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <span className="font-bold text-zinc-200">{format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart), 'MMM d, yyyy')}</span>
                    <button onClick={handleNextWeek} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"><ChevronRightIcon className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="cardSurface overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                        <tr className="bg-zinc-900 border-b border-zinc-800">
                            <th className="p-4 w-48 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-800">Entity</th>
                            {weekDays.map(day => (
                                <th key={day.toString()} className="p-4 text-center">
                                    <p className="text-xs font-bold text-zinc-500 uppercase">{format(day, 'EEE')}</p>
                                    <p className={`text-lg font-extrabold mt-1 ${isSameDay(day, new Date()) ? 'text-orange-500' : 'text-zinc-200'}`}>{format(day, 'd')}</p>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {rosterToDisplay.map(artist => (
                            <tr key={artist.id} className="hover:bg-zinc-800/20 transition-colors group">
                                <td className="p-4 border-r border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <img src={getProfileImageUrl(artist)} alt={artist.name} className="w-10 h-10 rounded-full object-cover border border-zinc-700"/>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-zinc-300 truncate">{artist.name}</p>
                                            {userRole === 'LABEL' && artist.role && (
                                                <p className="text-[10px] text-zinc-500 uppercase font-semibold mt-0.5">
                                                    {artist.role === 'engineer' || artist.role === 'ENGINEER' ? 'Engineer' :
                                                     artist.role === 'producer' || artist.role === 'PRODUCER' ? 'Producer' :
                                                     'Artist'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                {weekDays.map(day => {
                                    // Filter bookings based on roster member role: artist, engineer, or producer
                                    const dayBookings = scopeBookings.filter((b: any) => {
                                        const bookingDate = new Date(b.date || 0);
                                        if (!isSameDay(bookingDate, day)) return false;
                                        
                                        // Check based on roster member's role
                                        if (artist.role === 'artist' || artist.role === 'ARTIST' || !artist.role) {
                                            // For artists, check artist_profile_id or artist.id
                                            return (b.artist?.id === artist.id || b.artist_profile_id === artist.id);
                                        } else if (artist.role === 'engineer' || artist.role === 'ENGINEER') {
                                            // For engineers, check engineer_profile_id or requested_engineer_id
                                            return (b.engineer_profile_id === artist.id || b.requested_engineer_id === artist.id);
                                        } else if (artist.role === 'producer' || artist.role === 'PRODUCER') {
                                            // For producers, check producer_profile_id (if bookings have this field)
                                            return (b.producer_profile_id === artist.id || b.booked_by_id === artist.id);
                                        }
                                        return false;
                                    });
                                    
                                    return (
                                        <td key={day.toString()} className="p-2 h-24 vertical-top">
                                            <div className="space-y-1">
                                                {dayBookings.map(b => (
                                                    <div key={b.id} className="p-2 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] leading-tight">
                                                        <p className="font-bold text-orange-400">{b.start_time || 'TBD'}</p>
                                                        <p className="text-zinc-300 truncate">{b.stoodio?.name || 'Remote Mix'}</p>
                                                    </div>
                                                ))}
                                                {dayBookings.length === 0 && <div className="h-full w-full opacity-0 group-hover:opacity-10 transition-opacity bg-white/5 rounded min-h-[40px]"/>}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="flex gap-4 p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                <ClockIcon className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                    Aria is monitoring this calendar for conflicts. If two roster members are booked in the same room simultaneously, a priority alert will trigger in your notifications center.
                </p>
            </div>
        </div>
    );
};

export default MasterCalendar;