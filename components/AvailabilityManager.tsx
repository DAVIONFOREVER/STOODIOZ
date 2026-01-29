import React, { useState, useMemo } from 'react';
import type { Stoodio, Engineer, Producer, Booking } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon, CloseIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import { DEFAULT_TIME_SLOTS } from '../utils/timeSlots';

interface AvailabilityManagerProps {
    user: Stoodio | Engineer | Producer;
    onUpdateUser: (updatedProfile: Partial<Stoodio | Engineer | Producer>) => void;
}

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ user, onUpdateUser }) => {
    const { bookings } = useAppState();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newTime, setNewTime] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    
    const blockedTimes = user.availability || [];
    const blockedTimesMap = useMemo(
        () => new Map<string, Set<string>>(blockedTimes.map(item => [item.date, new Set(item.times)])),
        [blockedTimes]
    );
    
    const bookingsForDay = useMemo(() => {
        if (!selectedDate) return new Set();
        return new Set(
            bookings
                .filter(b => b.date === selectedDate)
                .map(b => b.start_time)
        );
    }, [bookings, selectedDate]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();

    const daysInMonth = [];
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
        daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };
    
    const handleDateClick = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        setSelectedDate(dateString);
    };

    const updateBlockedTimes = (newBlockedTimesMap: Map<string, Set<string>>) => {
        const newAvailability = Array.from(newBlockedTimesMap.entries())
            .map(([date, times]) => ({ date, times: Array.from(times).sort() }))
            .filter(day => day.times.length > 0);
        onUpdateUser({ availability: newAvailability });
    };

    const handleBlockTime = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (selectedDate && newTime) {
            if (bookingsForDay.has(newTime)) {
                setFormError('This time is already booked.');
                return;
            }
            const newBlockedTimesMap = new Map<string, Set<string>>(blockedTimesMap);
            const times = newBlockedTimesMap.get(selectedDate) || new Set<string>();
            if (times.has(newTime)) {
                setFormError('This time is already blocked.');
                return;
            }
            times.add(newTime);
            newBlockedTimesMap.set(selectedDate, times);
            updateBlockedTimes(newBlockedTimesMap);
            setNewTime('');
        }
    };

    const handleUnblockTime = (timeToRemove: string) => {
        if (selectedDate) {
            const newBlockedTimesMap = new Map<string, Set<string>>(blockedTimesMap);
            const times = newBlockedTimesMap.get(selectedDate);
            if (times) {
                times.delete(timeToRemove);
                if (times.size === 0) {
                    newBlockedTimesMap.delete(selectedDate);
                } else {
                    newBlockedTimesMap.set(selectedDate, times);
                }
                updateBlockedTimes(newBlockedTimesMap);
            }
        }
    };

    const blockedTimesForSelectedDate = selectedDate ? [...(blockedTimesMap.get(selectedDate) || [])].sort() : [];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 p-5 shadow-[0_0_40px_rgba(249,115,22,0.12)]">
            <div className="pointer-events-none absolute -top-28 right-2 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full bg-zinc-900/70 border border-zinc-700/60 hover:border-orange-400/60 hover:bg-zinc-800 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5 text-slate-300" />
                </button>
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Block Time</p>
                    <h3 className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-amber-200">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                </div>
                <button onClick={handleNextMonth} className="p-2 rounded-full bg-zinc-900/70 border border-zinc-700/60 hover:border-orange-400/60 hover:bg-zinc-800 transition-colors">
                    <ChevronRightIcon className="w-5 h-5 text-slate-300" />
                </button>
            </div>
            <p className="text-xs text-center text-slate-400 mb-3">
                All time slots are open by default. Add times below to block them.
            </p>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-slate-400 mb-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="uppercase tracking-[0.2em] text-zinc-500">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array(startDay).fill(null).map((_, index) => <div key={`empty-${index}`}></div>)}
                {daysInMonth.map(day => {
                    const dateString = day.toISOString().split('T')[0];
                    const blockedForDay = blockedTimesMap.get(dateString) || new Set<string>();
                    const hasOpenSlots = DEFAULT_TIME_SLOTS.some((time) => !blockedForDay.has(time));
                    const isPast = day < today;
                    const isSelected = selectedDate === dateString;

                    let dayClass = "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-200";
                    if (isPast) {
                        dayClass += " text-slate-600 cursor-not-allowed bg-zinc-900/40";
                    } else if (isSelected) {
                        dayClass += " bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.45)] ring-1 ring-orange-300/60";
                    } else if (hasOpenSlots) {
                        dayClass += " bg-zinc-900/70 text-orange-300 hover:bg-orange-500/20 hover:text-orange-200 cursor-pointer border border-orange-500/30";
                    } else {
                         dayClass += " text-slate-600 cursor-not-allowed bg-zinc-900/40";
                    }

                    return (
                        <div key={dateString} onClick={() => !isPast && hasOpenSlots && handleDateClick(day)} className={dayClass}>
                            {day.getDate()}
                        </div>
                    );
                })}
            </div>
            
            {/* Time Slots Management */}
            {selectedDate && (
                <div className="mt-5 pt-5 border-t border-zinc-800/80">
                    <h4 className="font-semibold text-center text-slate-200 mb-3">Unavailable Slots for {selectedDate}</h4>
                    <div className="space-y-2">
                        {blockedTimesForSelectedDate.map(time => {
                            const isBooked = bookingsForDay.has(time);
                            return (
                                <div 
                                    key={time}
                                    className={`flex items-center justify-between p-2 text-sm rounded-lg font-semibold border ${
                                        isBooked ? 'bg-zinc-900/60 text-slate-500 border-zinc-800' : 'bg-zinc-900/70 text-slate-200 border-zinc-800/80'
                                    }`}
                                >
                                    <span>{time}</span>
                                    {isBooked ? (
                                        <span className="text-xs font-bold text-orange-400">BOOKED</span>
                                    ) : (
                                        <button onClick={() => handleUnblockTime(time)} className="text-green-400 hover:text-green-300">
                                            <PlusCircleIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {blockedTimesForSelectedDate.length === 0 && (
                        <p className="text-sm text-center text-slate-400">No unavailable slots for this day. All default times are open.</p>
                    )}
                    <form onSubmit={handleBlockTime} className="flex items-center gap-2 mt-4">
                        <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full bg-zinc-900/70 border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            required
                        />
                        <button type="submit" className="p-2 rounded-md bg-orange-500 text-white hover:bg-orange-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </form>
                    {formError && (
                        <p className="text-xs text-orange-400 mt-2 text-center">{formError}</p>
                    )}
                </div>
            )}
            </div>
        </div>
    );
};

export default AvailabilityManager;