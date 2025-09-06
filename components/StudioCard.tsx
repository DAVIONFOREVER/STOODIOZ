import React from 'react';
import type { Stoodio } from '../types';
import { LocationIcon, StarIcon, RoadIcon } from './icons';

interface StoodioCardProps {
    stoodio: Stoodio;
    onSelectStoodio: (stoodio: Stoodio) => void;
    distance?: number;
    travelTime?: string;
}

const StoodioCard: React.FC<StoodioCardProps> = ({ stoodio, onSelectStoodio, distance, travelTime }) => {
    
    const priceRange = () => {
        if (!stoodio.rooms || stoodio.rooms.length === 0) {
            return `$${stoodio.hourlyRate.toFixed(2)}`;
        }
        if (stoodio.rooms.length === 1) {
            return `$${stoodio.rooms[0].hourlyRate.toFixed(2)}`;
        }
        const rates = stoodio.rooms.map(r => r.hourlyRate);
        const min = Math.min(...rates);
        const max = Math.max(...rates);
        return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
    };

    return (
        <div className="bg-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-orange-500/20 transition-all duration-300 flex flex-col group border border-zinc-700 hover:border-orange-500/50">
            <div className="relative">
                <img className="w-full h-48 object-cover" src={stoodio.imageUrl} alt={stoodio.name} />
                <div className="absolute top-3 right-3 bg-zinc-900/50 backdrop-blur-sm text-slate-100 px-3 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span>{stoodio.rating.toFixed(1)}</span>
                </div>
                 {distance !== undefined && (
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                        <span>{distance.toFixed(1)} miles away</span>
                    </div>
                )}
            </div>
            <div className="p-6 flex-grow flex flex-col">
                <h2 className="text-2xl font-bold mb-2 text-slate-100">{stoodio.name}</h2>
                <div className="flex items-center text-slate-400 mb-4 text-sm">
                    <LocationIcon className="w-4 h-4 mr-2" />
                    <span>{stoodio.location}</span>
                </div>
                 {travelTime && (
                    <div className="flex items-center text-slate-400 mb-4 text-sm">
                        <RoadIcon className="w-4 h-4 mr-2" />
                        <span>{travelTime}</span>
                    </div>
                )}

                <div className="flex-grow mb-4">
                     <p className="text-slate-300 text-sm leading-relaxed">{stoodio.description.substring(0, 100)}...</p>
                </div>
                <div className="flex justify-between items-center mt-auto">
                    <div>
                        <span className="text-2xl font-bold text-orange-400">{priceRange()}</span>
                        <span className="text-slate-400">/hr</span>
                    </div>
                    <button 
                        onClick={() => onSelectStoodio(stoodio)}
                        className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-md hover:shadow-lg">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoodioCard;