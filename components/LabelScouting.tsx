import React, { useState, useMemo, useEffect } from 'react';
import { AppView, ArtistScoutingData, AandRNote } from '../types';
import { ChevronLeftIcon, SearchIcon, StarIcon, ChartBarIcon, UsersIcon, EyeIcon, PlusCircleIcon, CloseIcon, CheckCircleIcon } from './icons';
import * as apiService from '../services/apiService';
import { getProfileImageUrl } from '../constants';

interface LabelScoutingProps {
    onNavigate: (view: AppView) => void;
}

const LabelScouting: React.FC<LabelScoutingProps> = ({ onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('All');
    const [genreFilter, setGenreFilter] = useState('All');
    const [sortOption, setSortOption] = useState('Trending');
    const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
    const [notes, setNotes] = useState<AandRNote[]>([]);
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [selectedArtistForNote, setSelectedArtistForNote] = useState<ArtistScoutingData | null>(null);
    const [currentNoteText, setCurrentNoteText] = useState('');
    const [artists, setArtists] = useState<ArtistScoutingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const { artists: publicArtists } = await apiService.getAllPublicUsers();
                const mapped: ArtistScoutingData[] = (publicArtists || []).map((artist: any) => {
                    const genreList = Array.isArray(artist.genre)
                        ? artist.genre
                        : Array.isArray(artist.genres)
                        ? artist.genres
                        : [];
                    const followersCount = typeof artist.followers === 'number'
                        ? artist.followers
                        : Array.isArray(artist.follower_ids)
                        ? artist.follower_ids.length
                        : 0;
                    return {
                        id: artist.id ?? '',
                        name: artist.name ?? artist.display_name ?? artist.username ?? artist.stage_name ?? 'Artist',
                        image_url: artist.image_url || null,
                        city: artist.city || artist.location_text || artist.location || null,
                        genre: genreList,
                        followers: followersCount,
                        growth_30d: Number(artist.growth_30d || 0),
                        engagement_score: Number(artist.engagement_score || 0),
                    };
                });
                if (isActive) setArtists(mapped);
            } catch (e: any) {
                console.error('Failed to load scouting data', e);
                if (isActive) setError('Unable to load scouting data.');
            } finally {
                if (isActive) setLoading(false);
            }
        };
        load();
        return () => { isActive = false; };
    }, []);

    const cities = useMemo(() => Array.from(new Set(artists.map(a => a.city || 'Unknown'))).sort(), [artists]);
    const genres = useMemo(() => Array.from(new Set(artists.flatMap(a => a.genre || []))).sort(), [artists]);

    const filteredArtists = useMemo(() => {
        let result = artists.filter(artist => 
            (artist.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) &&
            (cityFilter === 'All' || artist.city === cityFilter) &&
            (genreFilter === 'All' || (artist.genre || []).includes(genreFilter))
        );

        result.sort((a, b) => {
            switch (sortOption) {
                case 'Trending': return b.growth_30d - a.growth_30d;
                case 'Most Followers': return b.followers - a.followers;
                case 'Highest Engagement': return b.engagement_score - a.engagement_score;
                case 'Newest': return b.id.localeCompare(a.id);
                default: return 0;
            }
        });

        return result;
    }, [artists, searchTerm, cityFilter, genreFilter, sortOption]);

    const toggleShortlist = (id: string) => {
        setShortlistedIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const openNoteModal = (artist: ArtistScoutingData) => {
        setSelectedArtistForNote(artist);
        const existing = notes.find(n => n.artist_id === artist.id);
        setCurrentNoteText(existing?.note || '');
        setNoteModalOpen(true);
    };

    const saveNote = () => {
        if (selectedArtistForNote) {
            const newNote: AandRNote = {
                artist_id: selectedArtistForNote.id,
                note: currentNoteText,
                created_at: new Date().toISOString()
            };
            setNotes(prev => [
                ...prev.filter(n => n.artist_id !== selectedArtistForNote.id),
                newNote
            ]);
            setNoteModalOpen(false);
            setSelectedArtistForNote(null);
            setCurrentNoteText('');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => onNavigate(AppView.LABEL_DASHBOARD)} className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 mb-2 transition-colors font-semibold">
                        <ChevronLeftIcon className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">A&R Discovery</h1>
                    <p className="text-zinc-400 mt-1">Scout emerging talent, track growth, and manage pipeline.</p>
                </div>
            </div>

            <div className="cardSurface p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="Search artists..."
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        <select 
                            value={cityFilter} 
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 outline-none cursor-pointer hover:bg-zinc-700"
                        >
                            <option value="All">All Cities</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select 
                            value={genreFilter} 
                            onChange={(e) => setGenreFilter(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 outline-none cursor-pointer hover:bg-zinc-700"
                        >
                            <option value="All">All Genres</option>
                            {genres.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select 
                            value={sortOption} 
                            onChange={(e) => setSortOption(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 outline-none cursor-pointer hover:bg-zinc-700"
                        >
                            <option value="Trending">Trending (Growth %)</option>
                            <option value="Most Followers">Most Followers</option>
                            <option value="Highest Engagement">Highest Engagement</option>
                            <option value="Newest">Newest</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="cardSurface p-10 text-center text-zinc-500">Loading scouting data...</div>
            )}
            {error && (
                <div className="cardSurface p-10 text-center text-red-400">{error}</div>
            )}
            {!loading && !error && filteredArtists.length === 0 && (
                <div className="cardSurface p-10 text-center text-zinc-500">
                    No scouting data available yet.
                </div>
            )}

            {!loading && !error && filteredArtists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArtists.map(artist => {
                    const isShortlisted = shortlistedIds.includes(artist.id);
                    const hasNote = notes.some(n => n.artist_id === artist.id);

                    return (
                        <div 
                            key={artist.id} 
                            className={`cardSurface p-6 flex flex-col transition-all duration-300 ${isShortlisted ? 'border-orange-500 shadow-orange-500/10' : 'hover:border-zinc-600'}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden border-2 border-zinc-700">
                                        <img src={getProfileImageUrl(artist)} alt={artist.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-100">{artist.name}</h3>
                                        <p className="text-sm text-zinc-400">{artist.city || 'Unknown'}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleShortlist(artist.id)}
                                    className={`p-2 rounded-full transition-colors ${isShortlisted ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800'}`}
                                >
                                    <StarIcon className={`w-5 h-5 ${isShortlisted ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {(artist.genre || []).map(g => (
                                    <span key={g} className="px-2 py-1 text-xs font-semibold bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                                        {g}
                                    </span>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                                <div className="bg-zinc-800/50 rounded-lg p-2">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Followers</p>
                                    <p className="text-sm font-bold text-zinc-200">{(artist.followers / 1000).toFixed(1)}k</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-2">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Growth</p>
                                    <p className="text-sm font-bold text-green-400">+{artist.growth_30d}%</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-2">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Engagement</p>
                                    <p className="text-sm font-bold text-orange-400">{artist.engagement_score}</p>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-800">
                                <button 
                                    onClick={() => openNoteModal(artist)}
                                    className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${hasNote ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                                >
                                    <PlusCircleIcon className="w-4 h-4" />
                                    {hasNote ? 'Edit Note' : 'Add Note'}
                                </button>
                                <button 
                                    onClick={() => toggleShortlist(artist.id)}
                                    className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${isShortlisted ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            )}

            {noteModalOpen && selectedArtistForNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="cardSurface w-full max-w-lg p-6 relative">
                        <button onClick={() => setNoteModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold text-zinc-100 mb-4">A&R Notes</h2>
                        <p className="text-sm text-zinc-400 mb-4">Notes for {selectedArtistForNote.name}</p>
                        <textarea
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                            rows={6}
                            placeholder="Add scouting notes, contact info, or deal potential..."
                            value={currentNoteText}
                            onChange={(e) => setCurrentNoteText(e.target.value)}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setNoteModalOpen(false)} className="px-4 py-2 bg-zinc-800 rounded-lg text-zinc-300">Cancel</button>
                            <button onClick={saveNote} className="px-4 py-2 bg-orange-500 rounded-lg text-white font-semibold">Save Note</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabelScouting;
