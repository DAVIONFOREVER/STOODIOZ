import React, { useMemo, useState } from 'react';
import type { Engineer } from '../types';
import EngineerCard from './EngineerCard.tsx';
import { useAppState } from '../contexts/AppContext.tsx';

interface EngineerListProps {
    onSelectEngineer: (engineer: Engineer) => void;
    onToggleFollow: (type: 'engineer', id: string) => void;
}

const EngineerList: React.FC<EngineerListProps> = ({ onSelectEngineer, onToggleFollow }) => {
    const { engineers, currentUser } = useAppState();
    const [query, setQuery] = useState('');

    const filteredEngineers = useMemo(() => {
        const list = engineers ?? [];
        const term = query.trim().toLowerCase();
        if (!term) return list;
        return list.filter((engineer) => {
            const name = engineer.name?.toLowerCase() || '';
            const locationText = (engineer as any).location_text?.toLowerCase() || '';
            const location = (engineer as any).location?.toLowerCase() || '';
            const email = (engineer as any).email?.toLowerCase() || '';
            return name.includes(term) || locationText.includes(term) || location.includes(term) || email.includes(term);
        });
    }, [query, engineers]);
    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Engineers
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">Discover talented audio engineers to bring your sound to life.</p>
            <div className="max-w-2xl mx-auto mb-10">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search engineers by name, location, email..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
            </div>
            {filteredEngineers.length === 0 ? (
                <div className="text-center text-zinc-400">
                    <p>No engineers found.</p>
                    <p className="text-xs text-zinc-500 mt-2">If this should have results, check Supabase RLS policies for public reads.</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEngineers.map(engineer => {
                     const list = currentUser?.following?.engineers || [];
                    const isFollowing = currentUser ? list.includes(engineer.id) || list.includes((engineer as any).profile_id) : false;
                    return (
                        <EngineerCard
                            key={engineer.id}
                            engineer={engineer}
                            onSelectEngineer={onSelectEngineer}
                            onToggleFollow={currentUser ? onToggleFollow : () => {}}
                            isFollowing={isFollowing}
                            isSelf={currentUser?.id === engineer.id}
                            isLoggedIn={!!currentUser}
                        />
                    );
                })}
            </div>
            )}
        </div>
    );
};

export default EngineerList;