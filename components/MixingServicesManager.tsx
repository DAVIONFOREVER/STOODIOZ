import React from 'react';
import type { Engineer } from '../types';
import { SoundWaveIcon } from './icons';

interface MixingServicesManagerProps {
    engineer: Engineer;
    onUpdateEngineer: (updates: Partial<Engineer>) => void;
}

const MixingServicesManager: React.FC<MixingServicesManagerProps> = ({ engineer, onUpdateEngineer }) => {
    const services = engineer.mixingServices || { isEnabled: false, pricePerTrack: 50, description: '', turnaroundTime: '3-5 days' };

    const handleUpdate = (updates: Partial<typeof services>) => {
        onUpdateEngineer({ mixingServices: { ...services, ...updates } });
    };

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <SoundWaveIcon className="w-6 h-6 text-orange-400" />
                Mixing Services
            </h1>
            <p className="text-zinc-400 mb-6">Offer remote mixing services to artists on the platform.</p>

            <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-lg border border-zinc-700 mb-6">
                <div>
                    <h3 className="font-semibold text-zinc-200">Enable Mixing Services</h3>
                    <p className="text-sm text-zinc-400">Allow artists to request remote mixing from you.</p>
                </div>
                <label className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={services.isEnabled} onChange={(e) => handleUpdate({ isEnabled: e.target.checked })} />
                        <div className={`block w-12 h-6 rounded-full transition-colors ${services.isEnabled ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${services.isEnabled ? 'translate-x-6' : ''}`}></div>
                    </div>
                </label>
            </div>

            <div className={`space-y-4 transition-opacity ${services.isEnabled ? 'opacity-100' : 'opacity-50'}`}>
                <div className="grid grid-cols-2 gap-4">
                    <div><label>Price per Track ($)</label><input type="number" value={services.pricePerTrack} onChange={e => handleUpdate({ pricePerTrack: Number(e.target.value)})} className="w-full p-2 bg-zinc-700 rounded-md" disabled={!services.isEnabled} /></div>
                    <div><label>Turnaround Time</label><input type="text" value={services.turnaroundTime} onChange={e => handleUpdate({ turnaroundTime: e.target.value})} className="w-full p-2 bg-zinc-700 rounded-md" disabled={!services.isEnabled} /></div>
                </div>
                 <div>
                    <label>Service Description</label>
                    <textarea value={services.description} onChange={e => handleUpdate({ description: e.target.value})} rows={3} className="w-full p-2 bg-zinc-700 rounded-md" disabled={!services.isEnabled}></textarea>
                </div>
            </div>
        </div>
    );
};

export default MixingServicesManager;
