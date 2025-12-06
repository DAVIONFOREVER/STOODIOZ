import React from 'react';

const LabelRoster: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto p-6 animate-fade-in space-y-8">
            {/* 1. Header Section */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100 tracking-tight">
                    Your Label Roster
                </h1>
                <p className="text-zinc-400 text-lg">
                    Manage artists, producers, and engineers under your label.
                </p>
            </div>

            {/* 2. Category Buttons (Tabs) */}
            <div className="flex justify-center border-b border-zinc-700/50">
                <div className="flex space-x-8">
                    <button className="pb-4 px-2 border-b-2 border-orange-500 text-orange-400 font-bold text-sm md:text-base">
                        Artists
                    </button>
                    <button className="pb-4 px-2 border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 font-medium text-sm md:text-base transition-colors">
                        Producers
                    </button>
                    <button className="pb-4 px-2 border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 font-medium text-sm md:text-base transition-colors">
                        Engineers
                    </button>
                </div>
            </div>

            {/* 3. Roster List Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div 
                        key={index} 
                        className="cardSurface p-6 flex flex-col items-center text-center space-y-4 hover:border-orange-500/30 transition-all cursor-pointer group"
                    >
                        {/* Circular Placeholder Avatar */}
                        <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 group-hover:border-orange-500/50 transition-colors flex items-center justify-center overflow-hidden">
                            <svg className="w-10 h-10 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>

                        {/* Text Info */}
                        <div className="w-full">
                            <h3 className="text-lg font-bold text-zinc-100 truncate">Artist Name {index + 1}</h3>
                            <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mt-1">Hip-Hop / Rap</p>
                            <p className="text-xs text-zinc-500 mt-2">Active • 3 Releases</p>
                        </div>

                        {/* Action Button Placeholder */}
                        <div className="w-full pt-2">
                            <button className="w-full py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-colors border border-zinc-700">
                                View Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LabelRoster;