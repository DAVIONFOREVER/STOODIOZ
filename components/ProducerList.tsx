import React from 'react';
import type { Producer } from '../types';
import ProducerCard from './ProducerCard';
import { useAppState } from '../contexts/AppContext';

interface ProducerListProps {
    onSelectProducer: (producer: Producer) => void;
    onToggleFollow: (type: 'producer', id: string) => void;
}

const ProducerList: React.FC<ProducerListProps> = ({ onSelectProducer, onToggleFollow }) => {
    const { producers, currentUser } = useAppState();
    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Producers
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">Discover top-tier instrumentals and production talent.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
                {producers.map(producer => {
                    const isFollowing = currentUser && 'following' in currentUser ? (currentUser.following.producers || []).includes(producer.id) : false;
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
        </div>
    );
};

export default ProducerList;
