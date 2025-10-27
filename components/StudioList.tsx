
import React from 'react';
import type { Stoodio } from '../types';
import StudioCard from './StudioCard';
import { useAppState } from '../contexts/AppContext';

interface StudioListProps {
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const StoodioList: React.FC<StudioListProps> = ({ onSelectStoodio }) => {
    const { stoodioz } = useAppState();

    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Stoodioz
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">Explore top-tier recording studios and creative spaces.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stoodioz.map(stoodio => (
                    <StudioCard key={stoodio.id} stoodio={stoodio} onSelectStoodio={onSelectStoodio} />
                ))}
            </div>
        </div>
    );
};

export default StoodioList;
