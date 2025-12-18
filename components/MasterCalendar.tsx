import React, { useState, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from './icons';
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

const MasterCalendar: React.FC = () => {
    const { bookings, artists, userRole } = useAppState();
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

    const rosterToDisplay = userRole === 'LABEL' ? artists.slice(0, 5) : (artists.slice(0, 1) || []);

    const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
    const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-100">Master Schedule</h1>
                    <p className="text-zinc-400 mt-1">Unified view of roster sessions and studio holds.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevWeek} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <span className="font-bold text-zinc-200 whitespace-nowrap">{format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart), 'MMM d, yyyy')}</span>
                    <button onClick={handleNextWeek} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"><ChevronRightIcon className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="cardSurface overflow-x-auto scrollbar-hide">
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
                                        <img src={artist.image_url} alt={artist.name} className="w-10 h-10 rounded-full object-cover border border-zinc-700"/>
                                        <p className="font-bold text-zinc-300 truncate">{artist.name}</p>
                                    </div>
                                </td>
                                {weekDays.map(day => {
                                    const dayBookings = bookings.filter(b => (b.artist?.id === artist.id || (b as any).artist_id === artist.id) && isSameDay(new Date(b.date), day));
                                    return (
                                        <td key={day.toString()} className="p-2 h-24 vertical-top">
                                            <div className="space-y-1">
                                                {dayBookings.map(b => (
                                                    <div key={b.id} className="p-2 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] leading-tight">
                                                        <p className="font-bold text-orange-400">{b.start_time}</p>
                                                        <p className="text-zinc-300 truncate">{b.stoodio?.name || 'Remote Mix'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MasterCalendar;