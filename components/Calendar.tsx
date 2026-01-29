import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import type { Booking } from '../types';
import { DEFAULT_TIME_SLOTS } from '../utils/timeSlots';

interface CalendarProps {
    blockedTimes: { date: string; times: string[] }[];
    bookings: Booking[];
    onSelectTimeSlot: (date: string, time: string) => void;
    selectedTimeSlot: { date: string, time: string } | null;
}

const Calendar: React.FC<CalendarProps> = ({ blockedTimes, bookings, onSelectTimeSlot, selectedTimeSlot }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const blockedTimesMap = useMemo(
        () => new Map(blockedTimes.map(item => [item.date, new Set(item.times)])),
        [blockedTimes]
    );
    const bookingsByDate = useMemo(() => {
        const map = new Map<string, Set<string>>();
        bookings.forEach((booking) => {
            if (!booking.date || !booking.start_time) return;
            const set = map.get(booking.date) || new Set<string>();
            set.add(booking.start_time);
            map.set(booking.date, set);
        });
        return map;
    }, [bookings]);
    
    const bookingsForDay = useMemo(() => {
        if (!selectedDate) return new Set();
        return bookingsByDate.get(selectedDate) || new Set();
    }, [bookingsByDate, selectedDate]);

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

    const getAvailableTimesForDate = (dateString: string) => {
        const blockedForDay = blockedTimesMap.get(dateString) || new Set<string>();
        return DEFAULT_TIME_SLOTS.filter((time) => !blockedForDay.has(time));
    };

    const availableTimesForSelectedDate = selectedDate ? getAvailableTimesForDate(selectedDate) : [];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 p-5 shadow-[0_0_40px_rgba(249,115,22,0.12)]">
            <div className="pointer-events-none absolute -top-32 right-0 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full bg-zinc-900/70 border border-zinc-700/60 hover:border-orange-400/60 hover:bg-zinc-800 transition-colors">
                        <ChevronLeftIcon className="w-5 h-5 text-slate-300" />
                    </button>
                    <div className="text-center">
                        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Stoodio Availability</p>
                        <h3 className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-amber-200">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                    </div>
                    <button onClick={handleNextMonth} className="p-2 rounded-full bg-zinc-900/70 border border-zinc-700/60 hover:border-orange-400/60 hover:bg-zinc-800 transition-colors">
                        <ChevronRightIcon className="w-5 h-5 text-slate-300" />
                    </button>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-slate-400 mb-3">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={`weekday-${i}`} className="uppercase tracking-[0.2em] text-zinc-500">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array(startDay).fill(null).map((_, index) => <div key={`empty-${index}`} />)}
                    {daysInMonth.map(day => {
                        const dateString = day.toISOString().split('T')[0];
                        const availableTimes = getAvailableTimesForDate(dateString);
                        const bookedSet = bookingsByDate.get(dateString) || new Set<string>();
                        const hasOpenSlots = availableTimes.some((time) => !bookedSet.has(time));
                        const isPast = day < today;
                        const isSelected = selectedDate === dateString;

                        let dayClass = "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-200";
                        if (isPast) {
                            dayClass += " text-slate-600 cursor-not-allowed bg-zinc-900/40";
                        } else if (hasOpenSlots) {
                            dayClass += isSelected
                                ? " bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.45)] ring-1 ring-orange-300/60"
                                : " bg-zinc-900/70 text-orange-300 hover:bg-orange-500/20 hover:text-orange-200 cursor-pointer border border-orange-500/30";
                        } else {
                            dayClass += " text-slate-500 cursor-not-allowed bg-zinc-900/40";
                        }

                        return (
                            <div key={dateString} onClick={() => !isPast && hasOpenSlots && handleDateClick(day)} className={dayClass}>
                                {day.getDate()}
                            </div>
                        );
                    })}
                </div>
            
                {/* Time Slots */}
                {selectedDate && (
                    <div className="mt-5 pt-5 border-t border-zinc-800/80">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-200">Available Slots</h4>
                            <span className="text-xs text-zinc-400">{selectedDate}</span>
                        </div>
                        {availableTimesForSelectedDate.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                {availableTimesForSelectedDate.map(time => {
                                    const isSelected = selectedTimeSlot?.date === selectedDate && selectedTimeSlot?.time === time;
                                    const isBooked = bookingsForDay.has(time);
                                    return (
                                    <button 
                                        key={time}
                                        onClick={() => onSelectTimeSlot(selectedDate, time)}
                                        disabled={isBooked}
                                        className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 font-semibold border ${
                                            isBooked
                                            ? 'bg-zinc-900/60 text-slate-500 line-through cursor-not-allowed border-zinc-800'
                                            : isSelected 
                                            ? 'bg-orange-500 text-white border-orange-300 shadow-[0_0_14px_rgba(249,115,22,0.45)]' 
                                            : 'bg-zinc-900/70 hover:bg-orange-500/10 text-slate-200 border-zinc-700 hover:border-orange-500/40'
                                        }`}
                                    >
                                        {time}
                                    </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-center text-slate-400">No slots available for this day.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calendar;