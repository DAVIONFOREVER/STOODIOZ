
import React, { useState, useMemo } from 'react';
import type { Stoodio, Engineer, InHouseEngineerInfo } from '../types';
import { SoundWaveIcon, DollarSignIcon, TrashIcon, PlusCircleIcon } from './icons';

interface EngineerManagerProps {
    stoodio: Stoodio;
    allEngineers: Engineer[];
    onUpdateStoodio: (updatedProfile: Partial<Stoodio>) => void;
}

const EngineerManager: React.FC<EngineerManagerProps> = ({ stoodio, allEngineers, onUpdateStoodio }) => {
    const [selectedEngineerId, setSelectedEngineerId] = useState('');
    const [payRate, setPayRate] = useState<number>(stoodio.engineerPayRate || 40);

    const inHouseEngineers = useMemo(() => {
        return (stoodio.inHouseEngineers || [])
            .map(info => {
                const engineer = allEngineers.find(e => e.id === info.engineerId);
                return engineer ? { ...info, engineer } : null;
            })
            .filter(Boolean as any as (x: any) => x is { engineer: Engineer } & InHouseEngineerInfo);
    }, [stoodio.inHouseEngineers, allEngineers]);

    const availableEngineers = useMemo(() => {
        const inHouseIds = new Set(inHouseEngineers.map(e => e.engineer.id));
        return allEngineers.filter(e => !inHouseIds.has(e.id));
    }, [allEngineers, inHouseEngineers]);
    
    const handleAddEngineer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEngineerId || payRate <= 0) {
            alert('Please select an engineer and set a valid pay rate.');
            return;
        }
        
        const newInHouseInfo: InHouseEngineerInfo = {
            engineerId: selectedEngineerId,
            payRate,
        };

        const updatedEngineers = [...(stoodio.inHouseEngineers || []), newInHouseInfo];
        onUpdateStoodio({ inHouseEngineers: updatedEngineers });

        setSelectedEngineerId('');
        setPayRate(stoodio.engineerPayRate || 40);
    };

    const handleDeleteEngineer = (engineerId: string) => {
        if (window.confirm('Are you sure you want to remove this engineer from your in-house roster?')) {
            const updatedEngineers = (stoodio.inHouseEngineers || []).filter(e => e.engineerId !== engineerId);
            onUpdateStoodio({ inHouseEngineers: updatedEngineers });
        }
    };
    

    return (
        <div className="p-6 cardSurface">
             <h1 className="text-2xl font-bold text-zinc-100 mb-2">Manage In-House Engineers</h1>
             <p className="text-sm text-zinc-400 mb-6">Add engineers to your studio's roster and set custom pay rates for sessions booked here.</p>
            
            {/* Add Engineer Form */}
            <form onSubmit={handleAddEngineer} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="engineer-select" className="block text-sm font-medium text-zinc-300 mb-1">Select Engineer</label>
                    <select
                        id="engineer-select"
                        value={selectedEngineerId}
                        onChange={e => setSelectedEngineerId(e.target.value)}
                        className="w-full p-2 bg-zinc-800 border-zinc-700 text-zinc-200 rounded-md"
                    >
                        <option value="" disabled>-- Choose an engineer --</option>
                        {availableEngineers.map(eng => (
                            <option key={eng.id} value={eng.id}>{eng.name}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="pay-rate" className="block text-sm font-medium text-zinc-300 mb-1">Pay Rate ($/hr)</label>
                    <input
                        type="number"
                        id="pay-rate"
                        value={payRate}
                        onChange={e => setPayRate(Number(e.target.value))}
                        min="0"
                        className="w-full p-2 bg-zinc-800 border-zinc-700 text-zinc-200 rounded-md"
                    />
                </div>
                <button type="submit" className="flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm w-full">
                    <PlusCircleIcon className="w-5 h-5"/>
                    Add Engineer
                </button>
            </form>


            {/* Current Roster */}
            <div className="space-y-4">
                {inHouseEngineers.length > 0 ? inHouseEngineers.map(({ engineer, payRate }) => (
                    <div key={engineer.id} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 flex-grow">
                            <img src={engineer.imageUrl} alt={engineer.name} className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                                <h3 className="font-bold text-zinc-200">{engineer.name}</h3>
                                <div className="text-sm text-green-400 font-semibold flex items-center gap-1 mt-1">
                                    <DollarSignIcon className="w-4 h-4"/> ${payRate}/hr
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteEngineer(engineer.id)} className="flex-shrink-0 flex items-center gap-1.5 bg-red-500/10 text-red-400 font-semibold text-xs py-1.5 px-3 rounded-full hover:bg-red-500/20">
                            <TrashIcon className="w-4 h-4"/> Remove
                        </button>
                    </div>
                )) : (
                     <p className="text-center py-8 text-zinc-500">You haven't added any in-house engineers yet.</p>
                )}
            </div>
        </div>
    );
};

export default EngineerManager;
      