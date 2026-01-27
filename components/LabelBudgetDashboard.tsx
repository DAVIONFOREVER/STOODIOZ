import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { DollarSignIcon, ChartBarIcon, EditIcon, CheckCircleIcon, UsersIcon } from './icons';
import type { LabelBudgetOverview, ArtistBudget } from '../types';

const LabelBudgetDashboard: React.FC = () => {
    const { currentUser } = useAppState();
    const [overview, setOverview] = useState<LabelBudgetOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditingTotal, setIsEditingTotal] = useState(false);
    const [newTotalBudget, setNewTotalBudget] = useState<number>(0);
    const [editingArtistId, setEditingArtistId] = useState<string | null>(null);
    const [newAllocation, setNewAllocation] = useState<number>(0);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await apiService.getLabelBudgetOverview(currentUser.id);

            // Defensive normalization so UI never crashes even if API returns missing fields
            const safeArtists = (data as any)?.artists ?? [];
            const safeBudget = (data as any)?.budget ?? null;

            setOverview({
                ...(data as any),
                artists: Array.isArray(safeArtists) ? safeArtists : [],
                budget: safeBudget,
            } as LabelBudgetOverview);

            if (safeBudget?.total_budget != null) {
                setNewTotalBudget(Number(safeBudget.total_budget) || 0);
            } else {
                setNewTotalBudget(0);
            }
        } catch (e) {
            console.error("Failed to load label budget overview", e);
            setOverview(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id]);

    const handleSaveTotalBudget = async () => {
        if (!currentUser) return;
        try {
            const budget = { ...(overview?.budget || {}), total_budget: newTotalBudget };
            await apiService.setLabelBudget(currentUser.id, budget);
            setIsEditingTotal(false);
            await loadData();
        } catch (e) {
            console.error("Failed to save budget", e);
            alert("Failed to save total budget.");
        }
    };

    const handleSaveAllocation = async (artistId: string) => {
        if (!currentUser) return;
        try {
            await apiService.setArtistAllocation(currentUser.id, artistId, undefined, newAllocation);
            setEditingArtistId(null);
            await loadData();
        } catch (e) {
            console.error("Failed to save allocation", e);
            alert("Failed to save artist allocation.");
        }
    };

    const startEditingArtist = (artist: ArtistBudget) => {
        setEditingArtistId(artist.artist_id);
        setNewAllocation(Number(artist.allocation_amount) || 0);
    };

    const artists: ArtistBudget[] = useMemo(() => {
        const list = (overview as any)?.artists;
        return Array.isArray(list) ? list : [];
    }, [overview]);

    if (loading) {
        return <div className="p-12 text-center text-zinc-500">Loading budget data...</div>;
    }

    const totalBudget = overview?.budget?.total_budget || 0;
    const totalSpent = overview?.budget?.amount_spent || 0;
    const remainingBudget = totalBudget - totalSpent;
    const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Level Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="cardSurface p-6 border-l-4 border-orange-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-zinc-400 font-medium text-sm uppercase tracking-wider">Total Budget</p>
                            {isEditingTotal ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xl text-zinc-400">$</span>
                                    <input
                                        type="number"
                                        value={newTotalBudget}
                                        onChange={(e) => setNewTotalBudget(parseFloat(e.target.value))}
                                        className="bg-zinc-800 text-white p-2 rounded-md w-32 border border-zinc-600 focus:border-orange-500 outline-none"
                                    />
                                    <button onClick={handleSaveTotalBudget} className="p-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30">
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <h2 className="text-3xl font-extrabold text-zinc-100">${Number(totalBudget).toLocaleString()}</h2>
                                    <button onClick={() => setIsEditingTotal(true)} className="text-zinc-500 hover:text-orange-400 transition-colors">
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
                            <DollarSignIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="cardSurface p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-zinc-400 font-medium text-sm uppercase tracking-wider">Total Spent</p>
                            <h2 className="text-3xl font-extrabold text-zinc-100 mt-1">${Number(totalSpent).toLocaleString()}</h2>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="cardSurface p-6 border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-zinc-400 font-medium text-sm uppercase tracking-wider">Remaining</p>
                            <h2 className={`text-3xl font-extrabold mt-1 ${remainingBudget < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ${Number(remainingBudget).toLocaleString()}
                            </h2>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                            <DollarSignIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="cardSurface p-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-300">Budget Utilization</span>
                    <span className="text-zinc-400">{Number(percentSpent).toFixed(1)}% Used</span>
                </div>
                <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${percentSpent > 90 ? 'bg-red-500' : percentSpent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(percentSpent, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Artist Allocations */}
            <div>
                <h3 className="text-xl font-bold text-zinc-100 mb-4 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-orange-400" /> Artist Allocations
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {artists.map((artist) => {
                        const allocation = Number(artist.allocation_amount) || 0;
                        const spent = Number(artist.amount_spent) || 0;
                        const artistPercent = allocation > 0 ? (spent / allocation) * 100 : 0;
                        const isEditing = editingArtistId === artist.artist_id;
                        const remaining = allocation - spent;

                        return (
                            <div key={artist.artist_id} className="cardSurface p-5 flex flex-col md:flex-row items-center gap-6">
                                <div className="flex items-center gap-4 w-full md:w-1/3">
                                    <img
                                        src={getProfileImageUrl({ ...artist, image_url: artist.artist_image_url })}
                                        alt={artist.artist_name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
                                    />
                                    <div>
                                        <h4 className="font-bold text-zinc-100">{artist.artist_name}</h4>
                                        <p className="text-xs text-zinc-400">ID: {artist.artist_id.slice(0, 8)}...</p>
                                    </div>
                                </div>

                                <div className="flex-grow w-full md:w-1/3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-zinc-400">Spent: ${spent.toLocaleString()}</span>
                                        <span className={remaining < 0 ? 'text-red-400' : 'text-green-400'}>
                                            {remaining < 0 ? 'Over Budget' : 'Remaining'}: ${Math.abs(remaining).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${artistPercent > 100 ? 'bg-red-500' : 'bg-orange-500'}`}
                                            style={{ width: `${Math.min(artistPercent, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto flex flex-col items-end min-w-[150px]">
                                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Allocation</p>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={newAllocation}
                                                onChange={(e) => setNewAllocation(parseFloat(e.target.value))}
                                                className="bg-zinc-800 text-white p-1 rounded-md w-24 border border-zinc-600 text-sm"
                                            />
                                            <button onClick={() => handleSaveAllocation(artist.artist_id)} className="text-green-400 hover:text-green-300">
                                                <CheckCircleIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-zinc-100">${allocation.toLocaleString()}</span>
                                            <button onClick={() => startEditingArtist(artist)} className="text-zinc-600 hover:text-orange-400">
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {artists.length === 0 && (
                        <div className="p-8 text-center bg-zinc-900 rounded-lg border border-zinc-800 border-dashed">
                            <p className="text-zinc-500">No artists have budget allocations yet. Add them to your roster first.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabelBudgetDashboard;
