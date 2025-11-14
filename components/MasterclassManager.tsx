import React, { useState, useEffect } from 'react';
import type { Engineer, Producer, Masterclass } from '../types';
import { EditIcon } from './icons';

interface MasterclassManagerProps {
    user: Engineer | Producer;
    onUpdateUser: (updatedProfile: Partial<Engineer | Producer>) => void;
}

const MasterclassManager: React.FC<MasterclassManagerProps> = ({ user, onUpdateUser }) => {
    
    const defaultMasterclass: Masterclass = {
        id: `mc-${user.id}`,
        isEnabled: false,
        title: '',
        description: '',
        videoUrl: '',
        price: 99.99,
    };

    const initialMasterclass = user.masterclass || defaultMasterclass;
    
    const [masterclass, setMasterclass] = useState<Masterclass>(initialMasterclass);

    useEffect(() => {
        setMasterclass(user.masterclass || defaultMasterclass);
    }, [user.masterclass]);

    const handleChange = (field: keyof Omit<Masterclass, 'id'>, value: any) => {
        setMasterclass(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onUpdateUser({ masterclass });
    };

    const hasChanges = JSON.stringify(masterclass) !== JSON.stringify(initialMasterclass);
    
    const inputClasses = "w-full p-2 bg-zinc-700 border-zinc-600 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";
    const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";


    return (
        <div className="p-6 cardSurface">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <EditIcon className="w-6 h-6 text-orange-400" />
                Manage Masterclass
            </h1>
            <p className="text-zinc-400 mb-6">
                Offer a premium video class to share your expertise and create a new revenue stream.
            </p>
            
            <div className="space-y-6">
                <div className="cardSurface p-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-zinc-200">Enable Masterclass on Profile</h3>
                        <p className="text-sm text-zinc-400">Make your masterclass visible and available for purchase.</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={masterclass.isEnabled}
                                onChange={(e) => handleChange('isEnabled', e.target.checked)}
                            />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${masterclass.isEnabled ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${masterclass.isEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                </div>
                
                <div className={`transition-opacity ${masterclass.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                     <div>
                        <label htmlFor="mc-title" className={labelClasses}>Masterclass Title</label>
                        <input type="text" id="mc-title" value={masterclass.title} onChange={e => handleChange('title', e.target.value)} className={inputClasses} placeholder="e.g., The Art of the Vocal Mix" />
                    </div>
                    <div>
                        <label htmlFor="mc-desc" className={labelClasses}>Description</label>
                        <textarea id="mc-desc" value={masterclass.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={inputClasses} placeholder="Describe what students will learn..."></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="mc-video" className={labelClasses}>Video URL</label>
                            <input type="url" id="mc-video" value={masterclass.videoUrl} onChange={e => handleChange('videoUrl', e.target.value)} className={inputClasses} placeholder="e.g., YouTube or Vimeo link" />
                            <p className="text-xs text-zinc-500 mt-1 px-1">
                                Pro Tip: Use an "Unlisted" video link from YouTube or Vimeo for the best experience. This keeps it private while allowing it to be embedded here.
                            </p>
                        </div>
                        <div>
                            <label htmlFor="mc-price" className={labelClasses}>Price ($)</label>
                            <input type="number" id="mc-price" value={masterclass.price} onChange={e => handleChange('price', Number(e.target.value))} min="0" className={inputClasses} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MasterclassManager;