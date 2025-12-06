import React from 'react';
import type { Engineer } from '../types';
import EngineerCard from './EngineerCard.tsx';
import { useAppState } from '../contexts/AppContext.tsx';

interface EngineerListProps {
    onSelectEngineer: (engineer: Engineer) => void;
    onToggleFollow: (type: 'engineer', id: string) => void;
}

const EngineerList: React.FC<EngineerListProps> = ({ onSelectEngineer, onToggleFollow }) => {
    const { engineers, currentUser } = useAppState();
    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Engineers
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">Discover talented audio engineers to bring your sound to life.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
                {engineers.map(engineer => {
                     const isFollowing = currentUser && 'following' in currentUser ? (currentUser.following.engineers || []).includes(engineer.id) : false;
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
        </div>
    );
};

export default EngineerList;