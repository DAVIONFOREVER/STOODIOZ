import React, { useState, useMemo } from 'react';
import type { Stoodio, Engineer } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon, CloseIcon } from './icons';

interface AvailabilityManagerProps {
    user: Stoodio | Engineer;
    onUpdateUser: (updatedProfile: Partial<Stoodio | Engineer>) => void;
}

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ user, onUpdateUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newTime, setNewTime] = useState('');
    
    const userAvailability = user.availability || [];

    const availabilityMap = useMemo(() => new Map(userAvailability.map(item => [item.date, new Set(item.times)])), [userAvailability]);
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();

    const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handleDateClick = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        setSelectedDate(dateString);
    };

    const handleAddTime = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !/^\d{2}:\d{2}$/.test(newTime)) {
            alert('Please select a date and enter a valid time in HH:MM format.');
            return;
        }

        const newAvailability = [...userAvailability];
        const dayIndex = newAvailability.findIndex(d => d.date === selectedDate);

        if (dayIndex > -1) {
            const times = new Set(newAvailability[dayIndex].times);
            times.add(newTime);
            newAvailability[dayIndex].times = Array.from(times).sort();
        } else {
            newAvailability.push({ date: selectedDate, times: [newTime] });
        }
        
        onUpdateUser({ availability: newAvailability });
        setNewTime('');
    };
    
    const handleRemoveTime = (timeToRemove: string) => {
        if (!selectedDate) return;

        const newAvailability = userAvailability.map(day => {
            if (day.date === selectedDate) {
                return {
                    ...day,
                    times: day.times.filter(time => time !== timeToRemove)
                };
            }
            return day;
        }).filter(day => day.times.length > 0); // Remove day if no times are left

        onUpdateUser({ availability: newAvailability });
    };


    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Manage Availability</h2>
            <div className="flex flex-col md:flex-row gap-6">
                {/* Calendar */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeftIcon className="w-5 h-5 text-slate-600" /></button>
                        <h3 className="font-bold text-lg text-slate-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-slate-100"><ChevronRightIcon className="w-5 h-5 text-slate-600" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-500 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array(startDay).fill(null).map((_, i) => <div key={`e-${i}`}></div>)}
                        {daysInMonth.map(day => {
                            const dateString = day.toISOString().split('T')[0];
                            const isAvailable = availabilityMap.has(dateString);
                            const isSelected = selectedDate === dateString;
                            return (
                                <button key={dateString} onClick={() => handleDateClick(day)} className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors font-semibold ${isSelected ? 'bg-orange-500 text-white' : isAvailable ? 'bg-orange-100 text-orange-500 hover:bg-orange-200' : 'hover:bg-slate-100'}`}>
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Slot Editor */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <h3 className="font-bold text-lg text-center mb-2 text-slate-800">
                        {selectedDate ? `Slots for ${selectedDate}` : 'Select a date'}
                    </h3>
                    {selectedDate && (
                        <div>
                            <form onSubmit={handleAddTime} className="flex gap-2 mb-4">
                                <input
                                    type="time"
                                    value={newTime}
                                    onChange={e => setNewTime(e.target.value)}
                                    className="w-full bg-slate-100 border-slate-300 text-slate-800 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <button type="submit" className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600"><PlusCircleIcon className="w-6 h-6"/></button>
                            </form>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {[...(availabilityMap.get(selectedDate) || [])].map(time => (
                                    <div key={time} className="bg-slate-100 flex justify-between items-center p-2 rounded-lg">
                                        <span className="font-mono text-sm text-slate-700">{time}</span>
                                        <button onClick={() => handleRemoveTime(time)} className="text-slate-500 hover:text-red-500"><CloseIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvailabilityManager;