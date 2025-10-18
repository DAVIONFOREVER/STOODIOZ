import React from 'react';
import type { VibeMatchResult, Stoodio, Engineer, Producer } from '../types';
import { ChevronLeftIcon, SoundWaveIcon, HouseIcon, MusicNoteIcon } from './icons';
import { useAppState } from '../contexts/AppContext';

interface VibeMatcherResultsProps {
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectProducer: (producer: Producer) => void;
    onBack: () => void;
}

const RecommendationCard: React.FC<{
    rec: VibeMatchResult['recommendations'][0];
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectProducer: (producer: Producer) => void;
}> = ({ rec, onSelectStoodio, onSelectEngineer, onSelectProducer }) => {
    
    const handleClick = () => {
        if (rec.type === 'stoodio') {
            onSelectStoodio(rec.entity as Stoodio);
        } else if (rec.type === 'engineer') {
            onSelectEngineer(rec.entity as Engineer);
        } else if (rec.type === 'producer') {
            onSelectProducer(rec.entity as Producer);
        }
    }

    const { typeName, icon, buttonText } = {
        stoodio: { typeName: 'Stoodio', icon: <HouseIcon className="w-8 h-8 text-orange-400"/>, buttonText: 'View Stoodio' },
        engineer: { typeName: 'Engineer', icon: <SoundWaveIcon className="w-8 h-8 text-amber-400"/>, buttonText: 'View Profile' },
        producer: { typeName: 'Producer', icon: <MusicNoteIcon className="w-8 h-8 text-purple-400"/>, buttonText: 'View Profile' }
    }[rec.type];

    return (
        <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 flex flex-col gap-4 hover:border-orange-500/50 transition-colors">
            <div className="flex items-center gap-4">
                <img src={rec.entity.imageUrl} alt={rec.entity.name} className="w-16 h-16 rounded-xl object-cover" />
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-400">{typeName}</p>
                    <h3 className="text-xl font-bold text-slate-100">{rec.entity.name}</h3>
                </div>
            </div>
            <div>
                <p className="text-sm text-slate-300 italic">"{rec.reason}"</p>
            </div>
            <button
                onClick={handleClick}
                className="mt-auto bg-zinc-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-orange-500 hover:text-white transition-all text-sm shadow-md"
            >
                {buttonText}
            </button>
        </div>
    );
};

const VibeMatcherResults: React.FC<VibeMatcherResultsProps> = ({ onSelectStoodio, onSelectEngineer, onSelectProducer, onBack }) => {
    const { vibeMatchResults } = useAppState();

    if (!vibeMatchResults) return null;

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Dashboard
            </button>
            
            <div className="bg-zinc-800 rounded-2xl shadow-xl p-8 border border-zinc-700 mb-8">
                <h1 className="text-5xl font-extrabold text-center mb-2 tracking-tight text-orange-500">Your Vibe Match</h1>
                <p className="text-center text-lg text-slate-300 mb-6 max-w-3xl mx-auto">
                    {vibeMatchResults.vibeDescription}
                </p>
                <div className="flex justify-center flex-wrap gap-2">
                    {vibeMatchResults.tags.map(tag => (
                        <span key={tag} className="bg-zinc-700 text-orange-300 text-sm font-semibold px-3 py-1 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-6 text-slate-100">AI Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vibeMatchResults.recommendations.map((rec, index) => (
                    <RecommendationCard 
                        key={`${rec.entity.id}-${index}`}
                        rec={rec}
                        onSelectStoodio={onSelectStoodio}
                        onSelectEngineer={onSelectEngineer}
                        onSelectProducer={onSelectProducer}
                    />
                ))}
            </div>
        </div>
    );
};

export default VibeMatcherResults;
