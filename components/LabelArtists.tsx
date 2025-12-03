
import React, { useState, useMemo } from 'react';
import { UsersIcon, ChartBarIcon, CalendarIcon, HeartIcon, PlusCircleIcon, TrashIcon, EyeIcon, CloseIcon, MicrophoneIcon } from './icons';

// --- Types ---
interface Artist {
    id: string;
    name: string;
    image_url: string;
    genre: string;
    monthly_listeners: number;
    bookings_this_month: number;
    bio?: string;
}

// --- Mock Data ---
const MOCK_ARTISTS: Artist[] = [
    { id: '1', name: 'Luna Vance', image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=200&auto=format&fit=crop', genre: 'Indie Pop', monthly_listeners: 12500, bookings_this_month: 4, bio: 'Ethereal vocals and dreamy synths. Based in LA.' },
    { id: '2', name: 'The Midnight Echo', image_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&auto=format&fit=crop', genre: 'Alt Rock', monthly_listeners: 45000, bookings_this_month: 8, bio: 'High energy alternative rock band touring soon.' },
    { id: '3', name: 'Jaxson Beats', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', genre: 'Hip Hop', monthly_listeners: 8900, bookings_this_month: 12, bio: 'Producer and rapper making waves in the underground scene.' },
    { id: '4', name: 'Velvet Voices', image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop', genre: 'R&B', monthly_listeners: 32000, bookings_this_month: 6, bio: 'Soulful harmonies and smooth rhythms.' },
    { id: '5', name: 'Neon Drifter', image_url: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?q=80&w=200&auto=format&fit=crop', genre: 'Synthwave', monthly_listeners: 1500, bookings_this_month: 2, bio: 'Retro-futuristic sounds from the year 2084.' },
];

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800 border border-zinc-700/50 p-6 rounded-xl flex items-center gap-4 shadow-lg">
        <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
            {icon}
        </div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
        </div>
    </div>
);

const LabelArtists: React.FC = () => {
    const [artists, setArtists] = useState<Artist[]>(MOCK_ARTISTS);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    
    // New Artist Form State
    const [newName, setNewName] = useState('');
    const [newGenre, setNewGenre] = useState('');
    const [newListeners, setNewListeners] = useState('');

    // --- Analytics ---
    const stats = useMemo(() => {
        const totalArtists = artists.length;
        const totalMonthlyListeners = artists.reduce((acc, curr) => acc + curr.monthly_listeners, 0);
        const totalBookings = artists.reduce((acc, curr) => acc + curr.bookings_this_month, 0);
        // Mock engagement calc
        const avgEngagement = totalArtists > 0 ? (totalMonthlyListeners / totalArtists / 100).toFixed(1) : '0.0';

        return {
            totalArtists,
            totalMonthlyListeners: totalMonthlyListeners.toLocaleString(),
            totalBookings,
            avgEngagement: `${avgEngagement}%`
        };
    }, [artists]);

    const handleAddArtist = (e: React.FormEvent) => {
        e.preventDefault();
        const newArtist: Artist = {
            id: `new-${Date.now()}`,
            name: newName,
            genre: newGenre,
            monthly_listeners: parseInt(newListeners) || 0,
            bookings_this_month: 0,
            image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop', // Default placeholder
            bio: 'New talent signed to the label.'
        };

        setArtists([newArtist, ...artists]);
        setIsAddModalOpen(false);
        setNewName('');
        setNewGenre('');
        setNewListeners('');
    };

    const handleRemoveArtist = (id: string) => {
        if (window.confirm("Are you sure you want to remove this artist from your roster?")) {
            setArtists(artists.filter(a => a.id !== id));
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Artist Roster</h1>
                    <p className="text-zinc-400 mt-1">Manage talent, track performance, and grow your label.</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Add Artist
                </button>
            </div>

            {/* SECTION A: Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Artists" value={stats.totalArtists.toString()} icon={<UsersIcon className="w-6 h-6" />} />
                <StatCard label="Monthly Listeners" value={stats.totalMonthlyListeners} icon={<ChartBarIcon className="w-6 h-6" />} />
                <StatCard label="Active Bookings" value={stats.totalBookings.toString()} icon={<CalendarIcon className="w-6 h-6" />} />
                <StatCard label="Avg. Engagement" value={stats.avgEngagement} icon={<HeartIcon className="w-6 h-6" />} />
            </div>

            {/* SECTION B: Artist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artists.map((artist) => (
                    <div key={artist.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300 group">
                        <div className="flex items-center gap-4 mb-6">
                            <img src={artist.image_url} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">{artist.name}</h3>
                                <span className="inline-block bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full border border-zinc-700 mt-1">
                                    {artist.genre}
                                </span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                                <p className="text-xs text-zinc-500 uppercase font-bold">Listeners</p>
                                <p className="text-lg font-bold text-zinc-200">{artist.monthly_listeners.toLocaleString()}</p>
                            </div>
                            <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                                <p className="text-xs text-zinc-500 uppercase font-bold">Bookings</p>
                                <p className="text-lg font-bold text-orange-400">{artist.bookings_this_month}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setSelectedArtist(artist)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <EyeIcon className="w-4 h-4" /> View
                            </button>
                            <button 
                                onClick={() => handleRemoveArtist(artist.id)}
                                className="flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
                                title="Remove Artist"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* SECTION C: Add Artist Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-zinc-100">Add New Artist</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-100">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddArtist} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Artist Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-100 focus:border-orange-500 focus:outline-none"
                                    placeholder="e.g. The Weeknd"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Genre</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newGenre}
                                    onChange={(e) => setNewGenre(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-100 focus:border-orange-500 focus:outline-none"
                                    placeholder="e.g. R&B"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Monthly Listeners (Approx)</label>
                                <input 
                                    type="number" 
                                    required 
                                    value={newListeners}
                                    onChange={(e) => setNewListeners(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-100 focus:border-orange-500 focus:outline-none"
                                    placeholder="e.g. 50000"
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg mt-4 transition-colors shadow-lg"
                            >
                                Confirm & Add
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* SECTION D: View Artist Modal */}
            {selectedArtist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden relative">
                        <button 
                            onClick={() => setSelectedArtist(null)} 
                            className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-zinc-200 hover:bg-black/70 backdrop-blur-md"
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="h-40 bg-gradient-to-br from-orange-600 to-purple-700 relative">
                            <img src={selectedArtist.image_url} className="w-full h-full object-cover opacity-50 mix-blend-overlay" alt="cover" />
                        </div>
                        
                        <div className="px-8 pb-8 -mt-16 relative">
                            <img src={selectedArtist.image_url} alt={selectedArtist.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-zinc-900 shadow-xl mb-4" />
                            
                            <h2 className="text-3xl font-extrabold text-zinc-100">{selectedArtist.name}</h2>
                            <p className="text-orange-400 font-medium mb-4">{selectedArtist.genre}</p>
                            
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                {selectedArtist.bio}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Total Listeners</p>
                                    <p className="text-2xl font-bold text-zinc-100">{selectedArtist.monthly_listeners.toLocaleString()}</p>
                                </div>
                                <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Bookings (Mo)</p>
                                    <p className="text-2xl font-bold text-green-400">{selectedArtist.bookings_this_month}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center justify-between text-zinc-500 text-sm">
                                <div className="flex items-center gap-2">
                                    <MicrophoneIcon className="w-4 h-4" />
                                    <span>Artist Profile</span>
                                </div>
                                <span>ID: {selectedArtist.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabelArtists;
