import React, { useState, useEffect, useMemo } from 'react';
import type { Stoodio } from '../types';
import { EditIcon, PlusCircleIcon } from './icons';

const ALL_AMENITIES = [
    "Vocal Booth", "Lounge Area", "Free WiFi", "Vintage Mics", "Parking", 
    "Kitchenette", "ISO Booth", "Natural Light", "Drum Kit", "Grand Piano", 
    "Soundproof", "Wheelchair Accessible"
];

// A simple checkmark SVG for our custom checkbox
const CheckmarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

interface AmenitiesManagerProps {
    stoodio: Stoodio;
    onUpdateStoodio: (updatedProfile: Partial<Stoodio>) => void;
}

const AmenitiesManager: React.FC<AmenitiesManagerProps> = ({ stoodio, onUpdateStoodio }) => {
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(stoodio.amenities || []);
    const [customAmenity, setCustomAmenity] = useState('');

    // This useMemo ensures that newly added custom amenities appear in the list instantly for selection.
    const availableAmenities = useMemo(() => {
        const amenitySet = new Set([...ALL_AMENITIES, ...(stoodio.amenities || []), ...selectedAmenities]);
        return Array.from(amenitySet).sort();
    }, [stoodio.amenities, selectedAmenities]);

    useEffect(() => {
        setSelectedAmenities(stoodio.amenities || []);
    }, [stoodio.amenities]);

    const handleToggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev => 
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        );
    };

    const handleAddCustomAmenity = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedAmenity = customAmenity.trim();
        if (trimmedAmenity && !selectedAmenities.includes(trimmedAmenity)) {
            setSelectedAmenities(prev => [...prev, trimmedAmenity]);
            setCustomAmenity('');
        }
    };

    const handleSave = () => {
        // Sort amenities for consistent data structure
        onUpdateStoodio({ amenities: selectedAmenities.sort() });
    };

    const hasChanges = useMemo(() => {
        const sortedSelected = [...selectedAmenities].sort();
        const sortedCurrent = [...(stoodio.amenities || [])].sort();
        return JSON.stringify(sortedSelected) !== JSON.stringify(sortedCurrent);
    }, [selectedAmenities, stoodio.amenities]);

    return (
        <div className="p-6 cardSurface">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <EditIcon className="w-6 h-6 text-orange-400" />
                Manage Amenities
            </h1>
            <p className="text-zinc-400 mb-6">Select the amenities your studio offers to attract the right artists.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableAmenities.map(amenity => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                        <label key={amenity} className={`
                            flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 group
                            ${isSelected 
                                ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                                : 'bg-zinc-800/60 border-zinc-700/50 hover:border-orange-500/50'
                            }
                        `}>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleAmenity(amenity)}
                                className="sr-only"
                            />
                            <div className={`
                                w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all duration-200
                                ${isSelected ? 'bg-orange-500 border-orange-400' : 'bg-zinc-700 border-zinc-600 group-hover:border-orange-500/50'}
                            `}>
                                {isSelected && <CheckmarkIcon className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-semibold text-zinc-200">{amenity}</span>
                        </label>
                    );
                })}
            </div>

            <form onSubmit={handleAddCustomAmenity} className="mt-6 pt-6 border-t border-zinc-700/50">
                <label htmlFor="custom-amenity" className="block text-sm font-medium text-zinc-300 mb-2">Add a Custom Amenity</label>
                <div className="flex gap-2">
                    <input
                        id="custom-amenity"
                        type="text"
                        value={customAmenity}
                        onChange={(e) => setCustomAmenity(e.target.value)}
                        placeholder="e.g., Dolby Atmos Setup"
                        className="flex-grow px-4 py-2 bg-zinc-800/70 border border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                        type="submit"
                        className="flex-shrink-0 flex items-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm disabled:bg-zinc-600"
                        disabled={!customAmenity.trim()}
                    >
                        <PlusCircleIcon className="w-5 h-5"/>
                        Add
                    </button>
                </div>
            </form>

            <div className="mt-8 flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default AmenitiesManager;