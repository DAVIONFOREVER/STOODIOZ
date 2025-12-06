import React, { useState, useMemo } from 'react';
import { AppView, ArtistScoutingData, AandRNote } from '../types';
import { ChevronLeftIcon, SearchIcon, StarIcon, ChartBarIcon, UsersIcon, EyeIcon, PlusCircleIcon, CloseIcon, CheckCircleIcon } from './icons';

interface LabelScoutingProps {
    onNavigate: (view: AppView) => void;
}

const mockArtists: ArtistScoutingData[] = [
    {
        id: '1',
        name: 'Nova Rae',
        image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=200&auto=format&fit=crop',
        city: 'Atlanta',
        genre: ['R&B', 'Soul'],
        followers: 12800,
        growth_30d: 42,
        engagement_score: 87
    },
    {
        id: '2',
        name: 'Kid Astro',
        image_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&auto=format&fit=crop',
        city: 'Los Angeles',
        genre: ['Hip-Hop'],
        followers: 55000,
        growth_30d: 23,
        engagement_score: 92
    },
    {
        id: '3',
        name: 'Echo & The Vibe',
        image_url: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?q=80&w=200&auto=format&fit=crop',
        city: 'New York',
        genre: ['Indie', 'Alternative'],
        followers: 8900,
        growth_30d: 15,
        engagement_score: 75
    },
    {
        id: '4',
        name: 'Lil Zay',
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        city: 'Chicago',
        genre: ['Trap', 'Hip-Hop'],
        followers: 22000,
        growth_30d: 58,
        engagement_score: 81
    },
    {
        id: '5',
        name: 'Serena Moon',
        image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        city: 'Nashville',
        genre: ['Pop', 'Singer-Songwriter'],
        followers: 4500,
        growth_30d: 12,
        engagement_score: 68
    }
];

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

    const cities = useMemo(() => Array.from(new Set(mockArtists.map(a => a.city || 'Unknown'))).sort(), []);
    const genres = useMemo(() => Array.from(new Set(mockArtists.flatMap(a => a.genre))).sort(), []);

    const filteredArtists = useMemo(() => {
        let result = mockArtists.filter(artist => 
            artist.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (cityFilter === 'All' || artist.city === cityFilter) &&
            (genreFilter === 'All' || artist.genre.includes(genreFilter))
        );

        result.sort((a, b) => {
            switch (sortOption) {
                case 'Trending': return b.growth_30d - a.growth_30d;
                case 'Most Followers': return b.followers - a.followers;
                case 'Highest Engagement': return b.engagement_score - a.engagement_score;
                case 'Newest': return parseInt(b.id) - parseInt(a.id); // Mock ID sort
                default: return 0;
            }
        });

        return result;
    }, [searchTerm, cityFilter, genreFilter, sortOption]);

    const toggleShortlist = (id: string) => {
        setShortlistedIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const openNoteModal = (artist: ArtistScoutingData) => {
        setSelectedArtistForNote(artist);
        // Load existing note if any
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
            // Upsert note logic for mock state
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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => onNavigate(AppView.LABEL_DASHBOARD)} className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 mb-2 transition-colors font-semibold">
                        <ChevronLeftIcon className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">A&R Talent Discovery</h1>
                    <p className="text-zinc-400 mt-1">Scout emerging talent, track growth, and manage your pipeline.</p>
                </div>
            </div>

            {/* Filters & Search */}
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

            {/* Artist Cards Grid */}
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
                                        {artist.image_url ? (
                                            <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-zinc-500">
                                                <UsersIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-100">{artist.name}</h3>
                                        <p className="text-sm text-zinc-400">{artist.city}</p>
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
                                {artist.genre.map(g => (
                                    <span key={g} className="px-2 py-1 text-xs font-semibold bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                                        {g}
                                    </span>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                                <div className="bg-zinc-800/50 rounded-lg p-2">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Followers</p>
                                    <p className="text-sm font-bold text-zinc-200">{artist.followers.toLocaleString()}</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-2">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Growth</p>
                                    <p className="text-sm font-bold text-green-400">+{artist.growth_30d}%</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-2">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Engage</p>
                                    <p className="text-sm font-bold text-blue-400">{artist.engagement_score}</p>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-3">
                                <button 
                                    onClick={() => openNoteModal(artist)}
                                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${hasNote ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                                >
                                    {hasNote ? <CheckCircleIcon className="w-4 h-4"/> : <PlusCircleIcon className="w-4 h-4"/>}
                                    {hasNote ? 'Edit Note' : 'Add Note'}
                                </button>
                                <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                                    <EyeIcon className="w-4 h-4" /> Profile
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Note Modal */}
            {noteModalOpen && selectedArtistForNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md animate-slide-up">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-100">A&R Note for {selectedArtistForNote.name}</h3>
                            <button onClick={() => setNoteModalOpen(false)} className="text-zinc-400 hover:text-zinc-100">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <textarea 
                                value={currentNoteText}
                                onChange={(e) => setCurrentNoteText(e.target.value)}
                                rows={5}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-200 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none placeholder:text-zinc-600"
                                placeholder="Add scouting notes, contact info, or deal potential..."
                            />
                        </div>
                        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
                            <button onClick={() => setNoteModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-200">Cancel</button>
                            <button onClick={saveNote} className="px-4 py-2 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600">Save Note</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabelScouting;