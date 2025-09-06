import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CalendarProps {
    availability: { date: string; times: string[] }[];
    onSelectTimeSlot: (date: string, time: string) => void;
    selectedTimeSlot: { date: string, time: string } | null;
}

const Calendar: React.FC<CalendarProps> = ({ availability, onSelectTimeSlot, selectedTimeSlot }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const availabilityMap = new Map(availability.map(item => [item.date, item.times]));

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
        if (availabilityMap.has(dateString)) {
             setSelectedDate(dateString);
        }
    }

    const availableTimesForSelectedDate = selectedDate ? availabilityMap.get(selectedDate) || [] : [];

    return (
        <div className="bg-zinc-800 p-4 rounded-lg">
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
                    const isAvailable = availabilityMap.has(dateString);
                    const isPast = day < today;
                    const isSelected = selectedDate === dateString;

                    let dayClass = "w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-200";
                    if (isPast) {
                        dayClass += " text-slate-600 cursor-not-allowed";
                    } else if (isAvailable) {
                        dayClass += isSelected 
                            ? " bg-orange-500 text-white font-bold" 
                            : " bg-orange-500/20 hover:bg-orange-500 hover:text-white cursor-pointer text-orange-400 font-bold";
                    } else {
                         dayClass += " text-slate-500 cursor-not-allowed";
                    }

                    return (
                        <div key={dateString} onClick={() => !isPast && handleDateClick(day)} className={dayClass}>
                            {day.getDate()}
                        </div>
                    );
                })}
            </div>
            
            {/* Time Slots */}
            {selectedDate && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                    <h4 className="font-semibold text-center text-slate-200 mb-3">Available Slots for {selectedDate}</h4>
                    {availableTimesForSelectedDate.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {availableTimesForSelectedDate.map(time => {
                                const isSelected = selectedTimeSlot?.date === selectedDate && selectedTimeSlot?.time === time;
                                return (
                                <button 
                                    key={time}
                                    onClick={() => onSelectTimeSlot(selectedDate, time)}
                                    className={`p-2 text-sm rounded-lg transition-colors duration-200 font-semibold ${
                                        isSelected 
                                        ? 'bg-orange-500 text-white' 
                                        : 'bg-zinc-700 hover:bg-zinc-600 text-slate-200'
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
    );
};

export default Calendar;