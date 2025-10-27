
import React from 'react';
import type { Stoodio } from '../types';
import { LocationIcon, StarIcon, VerifiedIcon } from './icons';
import { VerificationStatus } from '../types';

interface StudioCardProps {
    stoodio: Stoodio;
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const StudioCard: React.FC<StudioCardProps> = ({ stoodio, onSelectStoodio }) => {
    return (
        <div 
            onClick={() => onSelectStoodio(stoodio)} 
            className="bg-black/50 backdrop-blur-md rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.1)] border border-orange-500/20 overflow-hidden cursor-pointer group transition-all duration-300 hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] hover:-translate-y-1"
        >
            <div className="relative">
                <img loading="lazy" src={stoodio.imageUrl} alt={stoodio.name} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-slate-100">{stoodio.name}</h3>
                    <p className="text-slate-300 text-sm flex items-center gap-1.5"><LocationIcon className="w-4 h-4" />{stoodio.location}</p>
                </div>
                {stoodio.verificationStatus === VerificationStatus.VERIFIED && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white p-1 rounded-full">
                        <VerifiedIcon className="w-5 h-5" />
                    </div>
                )}
            </div>
            <div className="p-4">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1 text-yellow-400">
                        <StarIcon className="w-5 h-5 fill-current" />
                        <span className="font-bold text-slate-200">{stoodio.rating_overall.toFixed(1)}</span>
                    </div>
                    <div>
                        <span className="font-bold text-xl text-orange-400">${stoodio.hourlyRate}</span>
                        <span className="text-slate-400">/hr</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudioCard;
