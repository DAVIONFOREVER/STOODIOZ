
import React from 'react';
import { StarIcon, UsersIcon } from '../icons';

// This component reuses some logic from the main AdminRankings but scoped for Label scouting
const LabelAdminRankings: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-zinc-100">Global Talent Scout</h1>
            <p className="text-zinc-400">Identify rising stars and top performers across the entire Stoodioz ecosystem.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Artists Card */}
                <div className="cardSurface p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-zinc-100 flex items-center gap-2">
                            <UsersIcon className="w-6 h-6 text-orange-400"/> Top Unsigned Artists
                        </h3>
                        <button className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase">View All</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-zinc-600 w-4">#{i}</div>
                                    <div className="w-10 h-10 rounded-full bg-zinc-700"></div>
                                    <div>
                                        <p className="font-semibold text-zinc-200">Artist Name {i}</p>
                                        <p className="text-xs text-zinc-500">Atlanta, GA</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-zinc-300">98.5</p>
                                    <p className="text-xs text-green-400">+12%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Top Producers Card */}
                 <div className="cardSurface p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-zinc-100 flex items-center gap-2">
                            <StarIcon className="w-6 h-6 text-purple-400"/> Trending Producers
                        </h3>
                        <button className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase">View All</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-zinc-600 w-4">#{i}</div>
                                    <div className="w-10 h-10 rounded-full bg-zinc-700"></div>
                                    <div>
                                        <p className="font-semibold text-zinc-200">Producer Name {i}</p>
                                        <p className="text-xs text-zinc-500">Los Angeles, CA</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-zinc-300">97.2</p>
                                    <p className="text-xs text-green-400">+5%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelAdminRankings;
