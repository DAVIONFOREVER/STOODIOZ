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
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
             <h1 className="text-2xl font-bold text-slate-900 mb-2">Manage In-House Engineers</h1>
             <p className="text-sm text-slate-500 mb-6">Add engineers to your studio's roster and set custom pay rates for sessions booked here.</p>
            
            {/* Add Engineer Form */}
            <form onSubmit={handleAddEngineer} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="engineer-select" className="block text-sm font-medium text-slate-700 mb-1">Select Engineer</label>
                    <select
                        id="engineer-select"
                        value={selectedEngineerId}
                        onChange={e => setSelectedEngineerId(e.target.value)}
                        className="w-full p-2 bg-white border-slate-300 rounded-md"
                    >
                        <option value="" disabled>-- Choose an engineer --</option>
                        {availableEngineers.map(eng => (
                            <option key={eng.id} value={eng.id}>{eng.name}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="pay-rate" className="block text-sm font-medium text-slate-700 mb-1">Pay Rate ($/hr)</label>
                    <input
                        type="number"
                        id="pay-rate"
                        value={payRate}
                        onChange={e => setPayRate(Number(e.target.value))}
                        min="0"
                        className="w-full p-2 bg-white border-slate-300 rounded-md"
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
                    <div key={engineer.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-grow flex items-center gap-4">
                            <img src={engineer.imageUrl} alt={engineer.name} className="w-16 h-16 rounded-lg object-cover" />
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><SoundWaveIcon className="w-5 h-5 text-orange-500"/> {engineer.name}</h3>
                                <p className="text-xs text-slate-500">{engineer.specialties.join(', ')}</p>
                                <div className="text-sm font-semibold text-green-600 flex items-center gap-1 mt-1">
                                    <DollarSignIcon className="w-4 h-4" /> ${payRate}/hr
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                             <button onClick={() => handleDeleteEngineer(engineer.id)} className="p-2 text-slate-500 hover:text-red-500 rounded-full bg-slate-200 hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center py-8 text-slate-500">You haven't added any in-house engineers yet.</p>
                )}
            </div>
        </div>
    );
};

export default EngineerManager;