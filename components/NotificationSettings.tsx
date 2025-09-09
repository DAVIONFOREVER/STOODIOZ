import React from 'react';
import type { Engineer } from '../types';
import { BellIcon, RoadIcon, DollarSignIcon } from './icons';

interface NotificationSettingsProps {
    engineer: Engineer;
    onUpdateEngineer: (updatedProfile: Partial<Engineer>) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ engineer, onUpdateEngineer }) => {
    const prefs = engineer.notificationPreferences || { enabled: false, radius: 25 };

    const handleToggle = (enabled: boolean) => {
        onUpdateEngineer({ notificationPreferences: { ...prefs, enabled } });
    };

    const handleRadiusChange = (radius: number) => {
        onUpdateEngineer({ notificationPreferences: { ...prefs, radius } });
    };

    const handlePayRateChange = (rate: number) => {
        // If input is cleared, send undefined to clear the value, otherwise send the number
        onUpdateEngineer({ minimumPayRate: isNaN(rate) ? undefined : rate });
    };

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <BellIcon className="w-6 h-6 text-orange-400" />
                Job Preferences
            </h1>
            <p className="text-zinc-400 mb-6">
                Control how you get notified about new jobs and filter opportunities that match your criteria.
            </p>

            <div className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-lg border border-zinc-700">
                    <div>
                        <h3 className="font-semibold text-zinc-200">Enable Job Alerts</h3>
                        <p className="text-sm text-zinc-400">Receive push notifications for new opportunities.</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={prefs.enabled}
                                onChange={(e) => handleToggle(e.target.checked)}
                            />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${prefs.enabled ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${prefs.enabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                </div>

                {/* Radius Slider */}
                <div className={`bg-zinc-900/50 p-4 rounded-lg border border-zinc-700 transition-opacity ${prefs.enabled ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="radius-slider" className="font-semibold text-zinc-200 flex items-center gap-2">
                           <RoadIcon className="w-5 h-5"/> Notification Radius
                        </label>
                        <span className="font-bold text-orange-400">{prefs.radius} miles</span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-4">
                        Set the maximum distance for job alerts you want to receive.
                    </p>
                    <input
                        id="radius-slider"
                        type="range"
                        min="5"
                        max="150"
                        step="5"
                        value={prefs.radius}
                        onChange={(e) => handleRadiusChange(Number(e.target.value))}
                        disabled={!prefs.enabled}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>

                {/* Minimum Pay Rate */}
                 <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="pay-rate-input" className="font-semibold text-zinc-200 flex items-center gap-2">
                           <DollarSignIcon className="w-5 h-5"/> Minimum Pay Rate
                        </label>
                    </div>
                    <p className="text-sm text-zinc-400 mb-4">
                        Only see jobs on the board that meet or exceed your minimum hourly rate. Direct requests will still be shown.
                    </p>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-zinc-400 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            id="pay-rate-input"
                            value={engineer.minimumPayRate || ''}
                            onChange={(e) => handlePayRateChange(parseInt(e.target.value))}
                            className="w-full pl-7 pr-12 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-md py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g., 50"
                            min="0"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-zinc-400 sm:text-sm">/hr</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;