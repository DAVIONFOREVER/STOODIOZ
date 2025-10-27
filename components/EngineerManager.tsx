import React, { useState } from 'react';
import type { Stoodio, Engineer, InHouseEngineerInfo } from '../types';
import { PlusCircleIcon, TrashIcon } from './icons';

interface EngineerManagerProps {
    stoodio: Stoodio;
    allEngineers: Engineer[];
    onUpdateStoodio: (updates: Partial<Stoodio>) => void;
}

const EngineerManager: React.FC<EngineerManagerProps> = ({ stoodio, allEngineers, onUpdateStoodio }) => {
    const [selectedEngineerId, setSelectedEngineerId] = useState('');
    const inHouseEngineers = stoodio.inHouseEngineers || [];

    const handleAddEngineer = () => {
        if (selectedEngineerId && !inHouseEngineers.some(e => e.engineerId === selectedEngineerId)) {
            const newEngineerInfo: InHouseEngineerInfo = {
                engineerId: selectedEngineerId,
                payRate: stoodio.engineerPayRate, // Default to studio's base rate
            };
            onUpdateStoodio({ inHouseEngineers: [...inHouseEngineers, newEngineerInfo] });
            setSelectedEngineerId('');
        }
    };

    const handleRemoveEngineer = (engineerId: string) => {
        const updatedEngineers = inHouseEngineers.filter(e => e.engineerId !== engineerId);
        onUpdateStoodio({ inHouseEngineers: updatedEngineers });
    };

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-4">Manage In-House Engineers</h1>
            <div className="flex gap-2 items-center mb-4">
                <select value={selectedEngineerId} onChange={e => setSelectedEngineerId(e.target.value)} className="w-full p-2 bg-zinc-700 rounded-md">
                    <option value="">Select an engineer to add...</option>
                    {allEngineers
                        .filter(eng => !inHouseEngineers.some(ihe => ihe.engineerId === eng.id))
                        .map(eng => <option key={eng.id} value={eng.id}>{eng.name}</option>)
                    }
                </select>
                <button onClick={handleAddEngineer} disabled={!selectedEngineerId} className="p-2 bg-green-500 text-white rounded-md disabled:bg-zinc-600">
                    <PlusCircleIcon className="w-6 h-6"/>
                </button>
            </div>
            <div className="space-y-2">
                {inHouseEngineers.map(info => {
                    const engineer = allEngineers.find(e => e.id === info.engineerId);
                    if (!engineer) return null;
                    return (
                        <div key={info.engineerId} className="flex items-center justify-between bg-zinc-800 p-3 rounded-md">
                            <div className="flex items-center gap-3">
                                <img src={engineer.imageUrl} alt={engineer.name} className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <p className="font-semibold">{engineer.name}</p>
                                    <p className="text-sm text-zinc-400">{engineer.specialties.join(', ')}</p>
                                </div>
                            </div>
                            <button onClick={() => handleRemoveEngineer(info.engineerId)} className="text-red-400 hover:text-red-300">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    );
                })}
                 {inHouseEngineers.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">No in-house engineers added yet.</p>}
            </div>
        </div>
    );
};

export default EngineerManager;
