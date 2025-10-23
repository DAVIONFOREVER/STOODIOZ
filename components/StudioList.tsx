import React, { useState, useMemo } from 'react';
import type { Stoodio } from '../types';
import { VerificationStatus, SmokingPolicy } from '../types';
import StoodioCard from './StudioCard';
import { SearchIcon } from './icons';
import { useAppState } from '../contexts/AppContext';

interface StoodioListProps {
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const FilterButton: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            active ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-700'
        }`}
    >
        {label}
    </button>
);

const StoodioList: React.FC<StoodioListProps> = ({ onSelectStoodio }) => {
    const { stoodioz } = useAppState();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showVerifiedOnly, setShowVerifiedOnly] = useState<boolean>(false);
    const [smokingFilter, setSmokingFilter] = useState<'any' | SmokingPolicy>('any');

    const filteredStoodioz = useMemo(() => {
        let results = stoodioz;

        if (showVerifiedOnly) {
            results = results.filter(s => s.verificationStatus === VerificationStatus.VERIFIED);
        }

        if (smokingFilter !== 'any') {
            results = results.filter(s => s.rooms.some(r => (r.smokingPolicy || SmokingPolicy.NON_SMOKING) === smokingFilter));
        }

        if (searchTerm) {
            const lowerCaseTerm = searchTerm.toLowerCase();
            results = results.filter(s => 
                s.name.toLowerCase().includes(lowerCaseTerm) || 
                s.location.toLowerCase().includes(lowerCaseTerm) ||
                s.businessAddress?.toLowerCase().includes(lowerCaseTerm) ||
                s.amenities.some(a => a.toLowerCase().includes(lowerCaseTerm))
            );
        }

        return results.slice().sort((a, b) => a.name.localeCompare(b.name));
    }, [stoodioz, searchTerm, showVerifiedOnly, smokingFilter]);

    return (
        <div className="animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-400">
                Find Stoodioz
            </h1>
            <p className="text-center text-lg text-zinc-400 mb-8">Discover and book top-tier recording stoodioz.</p>

            <div className="max-w-4xl mx-auto mb-12 p-4 bg-zinc-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-zinc-700/50">
                <div className="relative flex-grow w-full mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border-zinc-700 text-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Search by name, location, address, or amenity..."
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center cursor-pointer">
                            <span className="text-sm font-medium text-zinc-300 mr-3">Verified Only</span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={showVerifiedOnly} 
                                    onChange={(e) => setShowVerifiedOnly(e.target.checked)} 
                                />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${showVerifiedOnly ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showVerifiedOnly ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                     <div className="flex items-center bg-zinc-900/50 rounded-lg p-1 border border-zinc-700">
                        <FilterButton label="Any" active={smokingFilter === 'any'} onClick={() => setSmokingFilter('any')} />
                        <FilterButton label="Smoking" active={smokingFilter === SmokingPolicy.SMOKING_ALLOWED} onClick={() => setSmokingFilter(SmokingPolicy.SMOKING_ALLOWED)} />
                        <FilterButton label="Non-Smoking" active={smokingFilter === SmokingPolicy.NON_SMOKING} onClick={() => setSmokingFilter(SmokingPolicy.NON_SMOKING)} />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredStoodioz.map((stoodio, index) => (
                    <div key={stoodio.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`}}>
                        <StoodioCard 
                            stoodio={stoodio} 
                            onSelectStoodio={onSelectStoodio} 
                        />
                    </div>
                ))}
            </div>
             {filteredStoodioz.length === 0 && (
                <p className="text-center text-zinc-400 mt-8">No stoodioz found. Try adjusting your filters.</p>
            )}
        </div>
    );
};

export default StoodioList;