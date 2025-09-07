import React from 'react';
import type { Stoodio } from '../types';
import { VerificationStatus } from '../types';
import { LocationIcon, StarIcon, VerifiedIcon } from './icons';
import { estimateTravelTime } from '../utils/location';

interface StoodioCardProps {
    stoodio: Stoodio;
    onSelectStoodio: (stoodio: Stoodio) => void;
    distance?: number;
}

const StoodioCard: React.FC<StoodioCardProps> = ({ stoodio, onSelectStoodio, distance }) => {
    return (
        <div
            className="bg-zinc-800 rounded-2xl shadow-lg overflow-hidden cursor-pointer group transform hover:-translate-y-1 transition-transform duration-300 border border-zinc-700 hover:border-orange-500/50"
            onClick={() => onSelectStoodio(stoodio)}
        >
            <div className="relative">
                <img src={stoodio.imageUrl} alt={stoodio.name} className="w-full h-48 object-cover" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-2">
                        {stoodio.name}
                        {stoodio.verificationStatus === VerificationStatus.VERIFIED && (
                            <VerifiedIcon className="w-6 h-6 text-blue-400" title="Verified Stoodio" />
                        )}
                    </h3>
                    <p className="text-slate-300 font-semibold flex items-center gap-1.5"><LocationIcon className="w-4 h-4" /> {stoodio.location}</p>
                </div>
                <div className="absolute top-4 right-4 bg-zinc-900/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-yellow-400 font-bold text-sm">
                    <StarIcon className="w-4 h-4" />
                    <span>{stoodio.rating.toFixed(1)}</span>
                </div>
            </div>
            <div className="p-4">
                <p className="text-slate-400 text-sm mb-3 h-10 overflow-hidden">{stoodio.description}</p>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-slate-400 text-xs">From</p>
                        <p className="text-xl font-bold text-slate-100">${stoodio.hourlyRate}<span className="text-sm font-normal text-slate-400">/hr</span></p>
                    </div>
                    {distance !== undefined && (
                        <div className="text-right">
                             <p className="text-slate-400 text-xs">Distance</p>
                             <p className="text-lg font-bold text-slate-100">{distance.toFixed(1)} mi</p>
                             <p className="text-xs text-slate-400">{estimateTravelTime(distance)}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoodioCard;