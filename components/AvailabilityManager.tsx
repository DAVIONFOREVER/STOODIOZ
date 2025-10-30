import React, { useState, useMemo } from 'react';
// FIX: Import Booking type and useAppState hook to get booking data.
import type { Stoodio, Engineer, Producer, Booking } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon, CloseIcon } from './icons';
import { useAppState } from '../contexts/AppContext';

interface AvailabilityManagerProps {
    user: Stoodio | Engineer | Producer;
    onUpdateUser: (updatedProfile: Partial<Stoodio | Engineer | Producer>) => void;
}

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ user, onUpdateUser }) => {
    // FIX: Get bookings from app context to determine which slots are already booked.
    const { bookings } = useAppState();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newTime, setNewTime] = useState('');
    
    const userAvailability = user.availability || [];

    // FIX: Explicitly type the Map to ensure type safety for `get`, `add`, and `delete` operations.
    // FIX: Add explicit Map type to resolve type inference issues.
    const availabilityMap = useMemo(() => new Map<string, Set<string>>(userAvailability.map(item => [item.date, new Set(item.times)])), [userAvailability]);
    
    // FIX: This now works as `bookings` is available from the app state.
    const bookingsForDay = useMemo(() => {
        if (!selectedDate) return new Set();
        return new Set(
            bookings
                .filter(b => b.date === selectedDate)
                .map(b => b.startTime)
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

    // FIX: Implement logic to update the user's availability.
    const updateAvailability = (newAvailabilityMap: Map<string, Set<string>>) => {
        const newAvailability = Array.from(newAvailabilityMap.entries())
            .map(([date, times]) => ({ date, times: Array.from(times).sort() }))
            .filter(day => day.times.length > 0);
        onUpdateUser({ availability: newAvailability });
    };

    // FIX: Implement handler to add a new time slot.
    const handleAddTime = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDate && newTime) {
            // FIX: Add explicit Map type to resolve type inference issues.
            const newAvailabilityMap = new Map<string, Set<string>>(availabilityMap);
            // FIX: Explicitly type new Set to ensure type safety.
            const times = newAvailabilityMap.get(selectedDate) || new Set<string>();
            times.add(newTime);
            newAvailabilityMap.set(selectedDate, times);
            updateAvailability(newAvailabilityMap);
            setNewTime('');
        }
    };

    // FIX: Implement handler to remove a time slot.
    const handleRemoveTime = (timeToRemove: string) => {
        if (selectedDate) {
            // FIX: Add explicit Map type to resolve type inference issues.
            const newAvailabilityMap = new Map<string, Set<string>>(availabilityMap);
            const times = newAvailabilityMap.get(selectedDate);
            if (times) {
                times.delete(timeToRemove);
                if (times.size === 0) {
                    newAvailabilityMap.delete(selectedDate);
                } else {
                    newAvailabilityMap.set(selectedDate, times);
                }
                updateAvailability(newAvailabilityMap);
            }
        }
    };

    // FIX: Replaced `Array.from` with spread syntax `[...]` to ensure correct type inference.
    const availableTimesForSelectedDate = selectedDate ? [...(availabilityMap.get(selectedDate) || [])].sort() : [];

    return (
        <div className="p-4 cardSurface">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-zinc-700 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
                </button>
                <h3 className="font-bold text-lg text-slate-100">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-zinc-700 transition-colors">
                    <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-400 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array(startDay).fill(null).map((_, index) => <div key={`empty-${index}`}></div>)}
                {daysInMonth.map(day => {
                    const dateString = day.toISOString().split('T')[0];
                    const timesForDay = availabilityMap.get(dateString);
                    const isAvailable = timesForDay && timesForDay.size > 0;
                    const isPast = day < today;
                    const isSelected = selectedDate === dateString;

                    let dayClass = "w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-200 cursor-pointer";
                    if (isPast) {
                        dayClass += " text-slate-600 cursor-not-allowed";
                    } else if (isSelected) {
                        dayClass += " bg-orange-500 text-white font-bold ring-2 ring-orange-300";
                    } else if (isAvailable) {
                        dayClass += " bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 font-bold";
                    } else {
                         dayClass += " text-slate-400 hover:bg-zinc-700";
                    }

                    return (
                        <div key={dateString} onClick={() => !isPast && handleDateClick(day)} className={dayClass}>
                            {day.getDate()}
                        </div>
                    );
                })}
            </div>
            
            {/* Time Slots Management */}
            {selectedDate && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                    <h4 className="font-semibold text-center text-slate-200 mb-3">Manage Slots for {selectedDate}</h4>
                    <div className="space-y-2">
                        {availableTimesForSelectedDate.map(time => {
                            const isBooked = bookingsForDay.has(time);
                            return (
                                <div 
                                    key={time}
                                    className={`flex items-center justify-between p-2 text-sm rounded-lg font-semibold ${
                                        isBooked ? 'bg-zinc-700 text-slate-500' : 'bg-zinc-700 text-slate-200'
                                    }`}
                                >
                                    <span>{time}</span>
                                    {isBooked ? (
                                        <span className="text-xs font-bold text-orange-400">BOOKED</span>
                                    ) : (
                                        <button onClick={() => handleRemoveTime(time)} className="text-red-400 hover:text-red-300">
                                            <CloseIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {availableTimesForSelectedDate.length === 0 && (
                        <p className="text-sm text-center text-slate-400">No slots defined for this day.</p>
                    )}
                    <form onSubmit={handleAddTime} className="flex items-center gap-2 mt-4">
                        <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full bg-zinc-900/50 border-zinc-700 rounded-md p-2 text-sm"
                            required
                        />
                        <button type="submit" className="p-2 rounded-md bg-orange-500 text-white hover:bg-orange-600">
                            <PlusCircleIcon className="w-6 h-6" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

// FIX: Correctly export the AvailabilityManager component.
export default AvailabilityManager;