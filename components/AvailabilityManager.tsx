import React, { useState, useMemo } from 'react';
import type { Stoodio, Engineer, Producer } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon, TrashIcon } from './icons';

interface AvailabilityManagerProps {
    user: Stoodio | Engineer | Producer;
    onUpdateUser: (updates: Partial<Stoodio | Engineer | Producer>) => void;
}

const Calendar: React.FC<{
    currentDate: Date;
    availabilityMap: Map<string, string[]>;
    onDateClick: (date: Date) => void;
    selectedDate: string | null;
}> = ({ currentDate, availabilityMap, onDateClick, selectedDate }) => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day} className="text-center text-xs text-zinc-400 font-bold">{day}</div>)}
            {Array(startDay).fill(null).map((_, i) => <div key={`empty-${i}`}></div>)}
            {daysInMonth.map(day => {
                const dateString = day.toISOString().split('T')[0];
                const isAvailable = availabilityMap.has(dateString);
                const isPast = day < today;
                const isSelected = selectedDate === dateString;
                
                let dayClass = "w-full h-12 flex items-center justify-center rounded-lg transition-colors text-sm font-semibold";
                if (isPast) dayClass += " text-zinc-600 cursor-not-allowed";
                else {
                    dayClass += " cursor-pointer ";
                    if (isSelected) dayClass += " bg-orange-500 text-white ring-2 ring-orange-400";
                    else if (isAvailable) dayClass += " bg-green-500/20 text-green-300 hover:bg-green-500/30";
                    else dayClass += " bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700";
                }

                return (
                    <div key={dateString} onClick={() => !isPast && onDateClick(day)} className={dayClass}>
                        {day.getDate()}
                    </div>
                );
            })}
        </div>
    );
};

const TimeSlotEditor: React.FC<{
    selectedDate: string;
    availableTimes: string[];
    onSave: (times: string[]) => void;
}> = ({ selectedDate, availableTimes, onSave }) => {
    const [times, setTimes] = useState(availableTimes);
    const [newTime, setNewTime] = useState('10:00');

    const handleAddTime = () => {
        if (newTime && !times.includes(newTime)) {
            const sortedTimes = [...times, newTime].sort((a, b) => a.localeCompare(b));
            setTimes(sortedTimes);
        }
    };

    const handleRemoveTime = (timeToRemove: string) => {
        setTimes(times.filter(t => t !== timeToRemove));
    };

    return (
        <div className="mt-4">
            <h3 className="font-semibold text-zinc-100 mb-2">Editing slots for {selectedDate}</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {times.map(time => (
                    <div key={time} className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-md">
                        <span className="font-mono text-zinc-200">{time}</span>
                        <button onClick={() => handleRemoveTime(time)} className="text-red-400 hover:text-red-300">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
                {times.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">No slots added for this day.</p>}
            </div>
            <div className="flex gap-2 items-center mb-4">
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full p-2 bg-zinc-700 rounded-md" />
                <button onClick={handleAddTime} className="p-2 bg-green-500 text-white rounded-md">
                    <PlusCircleIcon className="w-6 h-6"/>
                </button>
            </div>
            <button onClick={() => onSave(times)} className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors">
                Save Changes for {selectedDate}
            </button>
        </div>
    );
};

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ user, onUpdateUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const availabilityMap = useMemo(() => new Map((user as Stoodio).availability?.map(item => [item.date, item.times])), [(user as Stoodio).availability]);
    
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleDateClick = (date: Date) => setSelectedDate(date.toISOString().split('T')[0]);
    
    const handleSaveTimes = (times: string[]) => {
        if (!selectedDate) return;
        const newAvailability = Array.from(availabilityMap.entries()).filter(([date]) => date !== selectedDate);
        if (times.length > 0) {
            newAvailability.push([selectedDate, times]);
        }
        onUpdateUser({ availability: newAvailability.map(([date, times]) => ({ date, times })) });
    };

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-4">Manage Availability</h1>
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-zinc-700"><ChevronLeftIcon className="w-5 h-5"/></button>
                <h2 className="font-bold text-lg text-zinc-100">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-zinc-700"><ChevronRightIcon className="w-5 h-5"/></button>
            </div>
            <Calendar
                currentDate={currentDate}
                availabilityMap={availabilityMap}
                onDateClick={handleDateClick}
                selectedDate={selectedDate}
            />
            {selectedDate && (
                <TimeSlotEditor
                    selectedDate={selectedDate}
                    availableTimes={availabilityMap.get(selectedDate) || []}
                    onSave={handleSaveTimes}
                />
            )}
        </div>
    );
};

export default AvailabilityManager;
