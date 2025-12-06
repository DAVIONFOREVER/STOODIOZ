import React, { useState } from 'react';
import { CheckCircleIcon, ClockIcon, CalendarIcon, UserGroupIcon } from '../icons';

const ToggleCard: React.FC<{ label: string; description: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div>
            <h3 className="text-zinc-200 font-bold text-sm">{label}</h3>
            <p className="text-zinc-500 text-xs">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-500 transition-colors ${checked ? 'bg-orange-500' : 'bg-zinc-700'}`}></div>
            <div className={`absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform ${checked ? 'translate-x-full border-white' : ''}`}></div>
        </label>
    </div>
);

const LabelPolicies: React.FC = () => {
    const [allowRemote, setAllowRemote] = useState(true);
    const [allowInPerson, setAllowInPerson] = useState(true);
    const [allowWeekends, setAllowWeekends] = useState(false);
    const [minDuration, setMinDuration] = useState(2);
    const [maxDuration, setMaxDuration] = useState(8);

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-zinc-100 mb-6">Session Policies</h1>
            <div className="cardSurface p-6 space-y-4">
                <ToggleCard 
                    label="Allow Remote Sessions" 
                    description="Permit artists to book remote-only services like mixing." 
                    checked={allowRemote} 
                    onChange={setAllowRemote} 
                />
                <ToggleCard 
                    label="Allow In-Person Sessions" 
                    description="Permit bookings for physical studio time." 
                    checked={allowInPerson} 
                    onChange={setAllowInPerson} 
                />
                <ToggleCard 
                    label="Allow Weekend Bookings" 
                    description="Permit sessions to be scheduled on Saturdays and Sundays." 
                    checked={allowWeekends} 
                    onChange={setAllowWeekends} 
                />

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                     <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Min Session Duration (hours)</label>
                        <input type="number" value={minDuration} onChange={e => setMinDuration(Number(e.target.value))} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Max Session Duration (hours)</label>
                        <input type="number" value={maxDuration} onChange={e => setMaxDuration(Number(e.target.value))} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelPolicies;
