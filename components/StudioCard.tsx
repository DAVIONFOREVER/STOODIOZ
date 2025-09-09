import React from 'react';
import type { Stoodio } from '../types';
import { VerificationStatus } from '../types';
import { LocationIcon, StarIcon, VerifiedIcon } from './icons';
import { estimateTravelTime } from '../utils/location';
import { use3DTilt } from '../hooks/use3DTilt';

interface StoodioCardProps {
    stoodio: Stoodio;
    onSelectStoodio: (stoodio: Stoodio) => void;
    distance?: number;
}

const StoodioCard: React.FC<StoodioCardProps> = ({ stoodio, onSelectStoodio, distance }) => {
    const tiltProps = use3DTilt();

    return (
        <div
            {...tiltProps}
            className="tilt-card h-full bg-zinc-800/50 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
            onClick={() => onSelectStoodio(stoodio)}
        >
            <div className="relative">
                <img loading="lazy" src={stoodio.imageUrl} alt={stoodio.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-2">
                        {stoodio.name}
                        {stoodio.verificationStatus === VerificationStatus.VERIFIED && (
                            <VerifiedIcon className="w-6 h-6 text-blue-400" title="Verified Stoodio" />
                        )}
                    </h3>
                    <p className="text-zinc-300 font-semibold flex items-center gap-1.5"><LocationIcon className="w-4 h-4" /> {stoodio.location}</p>
                </div>
                <div className="absolute top-4 right-4 bg-zinc-900/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-yellow-400 font-bold text-sm">
                    <StarIcon className="w-4 h-4" />
                    <span>{stoodio.rating.toFixed(1)}</span>
                </div>
                <div className="glare-effect rounded-2xl"></div>
            </div>
        </div>
    );
};

export default StoodioCard;