import React, { useMemo, useState } from 'react';
import type { Producer } from '../types';
import ProducerCard from './ProducerCard';
import { useAppState } from '../contexts/AppContext';

interface ProducerListProps {
    onSelectProducer: (producer: Producer) => void;
    onToggleFollow: (type: 'producer', id: string) => void;
}

const ProducerList: React.FC<ProducerListProps> = ({ onSelectProducer, onToggleFollow }) => {
    const { producers, currentUser } = useAppState();
    const [query, setQuery] = useState('');

    const filteredProducers = useMemo(() => {
        const list = producers ?? [];
        const term = query.trim().toLowerCase();
        if (!term) return list;
        return list.filter((producer) => {
            const name = producer.name?.toLowerCase() || '';
            const locationText = (producer as any).location_text?.toLowerCase() || '';
            const location = (producer as any).location?.toLowerCase() || '';
            const email = (producer as any).email?.toLowerCase() || '';
            return name.includes(term) || locationText.includes(term) || location.includes(term) || email.includes(term);
        });
    }, [query, producers]);
    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Producers
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">Discover top-tier instrumentals and production talent.</p>
            <div className="max-w-2xl mx-auto mb-10">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search producers by name, location, email..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
            </div>
            {filteredProducers.length === 0 ? (
                <div className="text-center text-zinc-400">
                    <p>No producers found.</p>
                    <p className="text-xs text-zinc-500 mt-2">If this should have results, check Supabase RLS policies for public reads.</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducers.map(producer => {
                    const list = currentUser?.following?.producers || [];
                    const isFollowing = currentUser ? list.includes(producer.id) || list.includes((producer as any).profile_id) : false;
                    return (
                        <ProducerCard
                            key={producer.id}
                            producer={producer}
                            onSelectProducer={onSelectProducer}
                            onToggleFollow={currentUser ? onToggleFollow : () => {}}
                            isFollowing={isFollowing}
                            isSelf={currentUser?.id === producer.id}
                            isLoggedIn={!!currentUser}
                        />
                    );
                })}
            </div>
            )}
        </div>
    );
};

export default ProducerList;
