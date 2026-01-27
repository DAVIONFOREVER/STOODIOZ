import React, { useState, useEffect, useRef } from 'react';
import type { MediaAsset, AssetCategory } from '../types';
import { AssetCategory as AssetCategoryEnum } from '../types';
import { PaperclipIcon, DownloadIcon, TrashIcon, PlusCircleIcon, MusicNoteIcon, PhotoIcon, BriefcaseIcon } from './icons';
import { fetchUserAssets, uploadAsset } from '../services/apiService';
import { useAppState } from '../contexts/AppContext';
import appIcon from '../assets/stoodioz-app-icon.png';

const AssetVault: React.FC = () => {
    const { currentUser } = useAppState();
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [filter, setFilter] = useState<AssetCategory | 'ALL'>('ALL');
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            fetchUserAssets(currentUser.id).then(data => {
                setAssets(data);
                setLoading(false);
            });
        }
    }, [currentUser]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        setIsUploading(true);
        try {
            // Defaulting to DEMO for quick upload, Aria can categorize later
            const newAsset = await uploadAsset(currentUser.id, file, { category: AssetCategoryEnum.DEMO });
            setAssets(prev => [newAsset, ...prev]);
        } catch (err) {
            console.error("Asset upload failed", err);
        } finally {
            setIsUploading(false);
        }
    };

    const getIcon = (category: AssetCategory) => {
        switch(category) {
            case AssetCategoryEnum.MASTER: return <MusicNoteIcon className="w-5 h-5 text-yellow-400" />;
            case AssetCategoryEnum.DEMO: return <MusicNoteIcon className="w-5 h-5 text-zinc-400" />;
            case AssetCategoryEnum.ARTWORK: return <PhotoIcon className="w-5 h-5 text-purple-400" />;
            case AssetCategoryEnum.LEGAL: return <BriefcaseIcon className="w-5 h-5 text-blue-400" />;
            default: return <PaperclipIcon className="w-5 h-5 text-zinc-500" />;
        }
    };

    const filteredAssets = filter === 'ALL' ? assets : assets.filter(a => a.category === filter);

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-100">Asset Vault</h1>
                    <p className="text-zinc-400 mt-1">Secure repository for masters, demos, and legal documents.</p>
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
                >
                    {isUploading ? <img src={appIcon} alt="Loading" className="w-4 h-4 animate-spin" /> : <PlusCircleIcon className="w-5 h-5" />}
                    Upload File
                </button>
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {['ALL', ...Object.values(AssetCategoryEnum)].map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setFilter(cat as any)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filter === cat ? 'bg-orange-500 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssets.map(asset => (
                    <div key={asset.id} className="cardSurface p-4 flex items-center gap-4 group">
                        <div className="p-3 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors">
                            {getIcon(asset.category)}
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="text-zinc-200 font-bold text-sm truncate">{asset.name}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{asset.category} • {asset.size}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={asset.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:text-orange-400">
                                <DownloadIcon className="w-4 h-4" />
                            </a>
                            <button className="p-2 hover:text-red-400">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredAssets.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center text-zinc-600 bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-800">
                        <BriefcaseIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No assets found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetVault;