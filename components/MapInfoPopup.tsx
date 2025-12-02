
import React from 'react';
import type { Artist, Engineer, Producer, Stoodio, Label } from '../types';
import { CloseIcon, StarIcon, RoadIcon } from './icons';

type MapUser = Artist | Engineer | Producer | Stoodio | Label;

interface MapInfoPopupProps {
    user: MapUser;
    onClose: () => void;
    onSelect: (user: MapUser) => void;
    onNavigate: (location: { lat: number, lon: number }) => void;
}

const MapInfoPopup: React.FC<MapInfoPopupProps> = ({ user, onClose, onSelect, onNavigate }) => {
    const hasRating = 'rating_overall' in user;

    return (
        <div className="w-64 text-left cardSurface">
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <img src={user.image_url} alt={user.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                            <h3 className="font-bold text-slate-100">{user.name}</h3>
                            {hasRating && (
                                <div className="flex items-center text-yellow-400 text-sm">
                                    <StarIcon className="w-4 h-4" />
                                    <span className="font-bold ml-1">{user.rating_overall.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-4 flex gap-2">
                    <button onClick={() => onSelect(user)} className="flex-grow bg-orange-500 text-white font-semibold text-sm py-2 rounded-md hover:bg-orange-600 transition-colors">
                        View Profile
                    </button>
                    {user.coordinates && (
                         <button onClick={() => onNavigate(user.coordinates!)} className="p-2 bg-zinc-700 text-slate-200 rounded-md hover:bg-zinc-600 transition-colors">
                            <RoadIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapInfoPopup;
