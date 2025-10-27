import React, { useState, useEffect } from 'react';
import type { Engineer, MixingServices } from '../types';
import { DollarSignIcon, EditIcon } from './icons';

interface MixingServicesManagerProps {
    engineer: Engineer;
    onUpdateEngineer: (updatedProfile: Partial<Engineer>) => void;
}

const MixingServicesManager: React.FC<MixingServicesManagerProps> = ({ engineer, onUpdateEngineer }) => {
    
    const defaultServices: MixingServices = {
        isEnabled: false,
        pricePerTrack: 0,
        description: "",
        turnaroundTime: ""
    };

    const initialServices = engineer.mixingServices || defaultServices;
    
    const [services, setServices] = useState<MixingServices>(initialServices);

    useEffect(() => {
        setServices(engineer.mixingServices || defaultServices);
    }, [engineer.mixingServices]);

    const handleChange = (field: keyof MixingServices, value: any) => {
        setServices(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onUpdateEngineer({ mixingServices: services });
    };

    const hasChanges = JSON.stringify(services) !== JSON.stringify(initialServices);
    
    const inputClasses = "w-full p-2 bg-zinc-700 border-zinc-600 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";
    const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";


    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <EditIcon className="w-6 h-6 text-orange-400" />
                Mixing & Mastering Services
            </h1>
            <p className="text-zinc-400 mb-6">
                Offer your mixing services to artists remotely. Set your price and describe what you offer.
            </p>
            
            <div className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-lg border border-zinc-700">
                    <div>
                        <h3 className="font-semibold text-zinc-200">Offer Remote Mixing Services</h3>
                        <p className="text-sm text-zinc-400">Allow artists to book you for remote mixing jobs.</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={services.isEnabled}
                                onChange={(e) => handleChange('isEnabled', e.target.checked)}
                            />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${services.isEnabled ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${services.isEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                </div>
                
                <div className={`transition-opacity ${services.isEnabled ? 'opacity-100' : 'opacity-50'}`}>
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
                                    value={services.pricePerTrack}
                                    onChange={(e) => handleChange('pricePerTrack', Number(e.target.value))}
                                    disabled={!services.isEnabled}
                                    className={`${inputClasses} pl-7`}
                                />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="turnaround-time" className={labelClasses}>Typical Turnaround Time</label>
                            <input
                                type="text"
                                id="turnaround-time"
                                value={services.turnaroundTime}
                                onChange={(e) => handleChange('turnaroundTime', e.target.value)}
                                disabled={!services.isEnabled}
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
                            disabled={!services.isEnabled}
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