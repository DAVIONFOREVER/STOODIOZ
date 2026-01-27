
import React, { useState, useEffect } from 'react';
import type { Engineer, MixingServices } from '../types';
import { DollarSignIcon, EditIcon } from './icons';

interface MixingServicesManagerProps {
    engineer: Engineer;
    onUpdateEngineer: (updatedProfile: Partial<Engineer>) => void;
}

const MixingServicesManager: React.FC<MixingServicesManagerProps> = ({ engineer, onUpdateEngineer }) => {
    
    const defaultServices: MixingServices = {
        is_enabled: false,
        price_per_track: 0,
        description: "",
        turnaround_time: ""
    };

    // FIX: Corrected property name from 'mixingServices' to 'mixing_services'
    const initialServices = engineer.mixing_services || defaultServices;
    
    const [services, setServices] = useState<MixingServices>(initialServices);

    useEffect(() => {
        // FIX: Corrected property name from 'mixingServices' to 'mixing_services'
        setServices(engineer.mixing_services || defaultServices);
    }, [engineer.mixing_services]);

    const handleChange = (field: keyof MixingServices, value: any) => {
        setServices(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // FIX: Corrected property name from 'mixingServices' to 'mixing_services'
        onUpdateEngineer({ mixing_services: services });
    };

    const hasChanges = JSON.stringify(services) !== JSON.stringify(initialServices);
    
    const inputClasses = "w-full p-2 bg-zinc-700 border-zinc-600 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";
    const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";


    return (
        <div className="p-6 cardSurface">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <EditIcon className="w-6 h-6 text-orange-400" />
                Mixing & Mastering Services
            </h1>
            <p className="text-zinc-400 mb-6">
                Offer your mixing services to artists remotely. Set your price and describe what you offer.
            </p>
            
            <div className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="cardSurface p-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-zinc-200">Offer Remote Mixing Services</h3>
                        <p className="text-sm text-zinc-400">Allow artists to book you for remote mixing jobs.</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                // FIX: Corrected property name from 'isEnabled' to 'is_enabled'
                                checked={services.is_enabled}
                                // FIX: Corrected property name from 'isEnabled' to 'is_enabled'
                                onChange={(e) => handleChange('is_enabled', e.target.checked)}
                            />
                            {/* FIX: Corrected property name from 'isEnabled' to 'is_enabled' */}
                            <div className={`block w-12 h-6 rounded-full transition-colors ${services.is_enabled ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                            {/* FIX: Corrected property name from 'isEnabled' to 'is_enabled' */}
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${services.is_enabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                </div>
                
                {/* FIX: Corrected property name from 'isEnabled' to 'is_enabled' */}
                <div className={`transition-opacity ${services.is_enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price-per-track" className={labelClasses}>Price Per Track</label>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-zinc-400">$</span>
                                </div>
                                <input
                                    type="number"
                                    id="price-per-track"
                                    // FIX: Corrected property name from 'pricePerTrack' to 'price_per_track'
                                    value={services.price_per_track}
                                    // FIX: Corrected property name from 'pricePerTrack' to 'price_per_track'
                                    onChange={(e) => handleChange('price_per_track', Number(e.target.value))}
                                    // FIX: Corrected property name from 'isEnabled' to 'is_enabled'
                                    disabled={!services.is_enabled}
                                    className={`${inputClasses} pl-7`}
                                />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="turnaround-time" className={labelClasses}>Typical Turnaround Time</label>
                            <input
                                type="text"
                                id="turnaround-time"
                                // FIX: Corrected property name from 'turnaroundTime' to 'turnaround_time'
                                value={services.turnaround_time}
                                // FIX: Corrected property name from 'turnaroundTime' to 'turnaround_time'
                                onChange={(e) => handleChange('turnaround_time', e.target.value)}
                                // FIX: Corrected property name from 'isEnabled' to 'is_enabled'
                                disabled={!services.is_enabled}
                                placeholder="e.g., 3-5 business days"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                     <div className="mt-4">
                        <label htmlFor="description" className={labelClasses}>Service Description</label>
                        <textarea
                            id="description"
                            value={services.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            // FIX: Corrected property name from 'isEnabled' to 'is_enabled'
                            disabled={!services.is_enabled}
                            rows={3}
                            placeholder="e.g., Includes 2 revisions, up to 48 stems."
                            className={inputClasses}
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
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
        </div>
    );
};

export default MixingServicesManager;
