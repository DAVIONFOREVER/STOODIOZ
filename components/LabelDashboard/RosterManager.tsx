
import React, { useState, useEffect } from 'react';
import { UsersIcon, PlusCircleIcon, TrashIcon } from '../icons';
import { useLabel } from '../../hooks/useLabel';
import * as apiService from '../../services/apiService';

const RosterManager: React.FC = () => {
    const { labelProfile } = useLabel(() => {});
    const [roster, setRoster] = useState<{ artists: any[], producers: any[], engineers: any[] }>({ artists: [], producers: [], engineers: [] });
    
    useEffect(() => {
        if (labelProfile) {
            apiService.fetchLabelRoster(labelProfile.id).then(setRoster);
        }
    }, [labelProfile]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-zinc-100">Roster Management</h1>
                <button className="bg-zinc-800 border border-zinc-700 text-zinc-200 px-4 py-2 rounded-lg font-semibold hover:bg-zinc-700 transition-colors flex items-center gap-2">
                    <PlusCircleIcon className="w-5 h-5"/> Add Talent
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['Artists', 'Producers', 'Engineers'].map((type) => {
                    const key = type.toLowerCase() as keyof typeof roster;
                    const items = roster[key] || [];
                    
                    return (
                        <div key={type} className="cardSurface p-6">
                            <h3 className="font-bold text-lg text-zinc-100 mb-4 flex items-center gap-2">
                                <UsersIcon className="w-5 h-5 text-orange-400" /> {type}
                            </h3>
                            <div className="space-y-3">
                                {items.length > 0 ? items.map((member: any) => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors group">
                                        <img src={member.image_url} className="w-10 h-10 rounded-full object-cover" alt={member.name} />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-zinc-200">{member.name}</p>
                                            <p className="text-xs text-zinc-500 capitalize">{member.relationship}</p>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-zinc-500 text-sm italic">No {type.toLowerCase()} signed.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RosterManager;
