
import React, { useState } from 'react';
import type { Engineer, MixingSample } from '../types';
import { MusicNoteIcon, EditIcon, TrashIcon, PlusCircleIcon, CloseIcon, PhotoIcon } from './icons';

interface MixingSampleManagerProps {
    engineer: Engineer;
    onUpdateEngineer: (updatedProfile: Partial<Engineer>) => void;
}

const MixingSampleFormModal: React.FC<{
    sample: Partial<MixingSample> | null;
    onSave: (sample: MixingSample) => void;
    onClose: () => void;
}> = ({ sample, onSave, onClose }) => {
    const [title, setTitle] = useState(sample?.title || '');
    const [description, setDescription] = useState(sample?.description || '');
    const [audioUrl, setAudioUrl] = useState(sample?.audioUrl || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalSample: MixingSample = {
            id: sample?.id || `mix-${Date.now()}`,
            title,
            description,
            audioUrl: audioUrl || 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-2-short.mp3', // Placeholder
        };
        onSave(finalSample);
    };
    
    const inputClasses = "w-full p-2 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900/80 backdrop-blur-lg rounded-xl shadow-2xl w-full max-w-lg border border-zinc-700/50">
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-zinc-100">{sample?.id ? 'Edit Mixing Sample' : 'Add New Sample'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-zinc-400 hover:text-zinc-100" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClasses}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses}></textarea>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Audio File</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <MusicNoteIcon className="mx-auto h-12 w-12 text-zinc-500" />
                                    <p className="text-xs text-zinc-400">MP3 or WAV</p>
                                    <p className="text-xs text-zinc-500">(Upload is simulated)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-700/50 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm rounded bg-orange-500 text-white hover:bg-orange-600">Save Sample</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const MixingSampleManager: React.FC<MixingSampleManagerProps> = ({ engineer, onUpdateEngineer }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSample, setEditingSample] = useState<Partial<MixingSample> | null>(null);

    const handleOpenModal = (sample: Partial<MixingSample> | null = null) => {
        setEditingSample(sample);
        setIsModalOpen(true);
    };

    const handleSaveSample = (sampleToSave: MixingSample) => {
        const existingIndex = (engineer.mixingSamples || []).findIndex(i => i.id === sampleToSave.id);
        let updatedSamples: MixingSample[];

        if (existingIndex > -1) {
            updatedSamples = (engineer.mixingSamples || []).map(i => i.id === sampleToSave.id ? sampleToSave : i);
        } else {
            updatedSamples = [...(engineer.mixingSamples || []), sampleToSave];
        }
        
        onUpdateEngineer({ mixingSamples: updatedSamples });
        setIsModalOpen(false);
        setEditingSample(null);
    };

    const handleDeleteSample = (sampleId: string) => {
        if (window.confirm('Are you sure you want to delete this mixing sample?')) {
            const updatedSamples = (engineer.mixingSamples || []).filter(i => i.id !== sampleId);
            onUpdateEngineer({ mixingSamples: updatedSamples });
        }
    };

    return (
        <div className="p-6 cardSurface">
             <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold text-zinc-100">My Mixing Samples</h1>
                 <button onClick={() => handleOpenModal({})} className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm">
                    <PlusCircleIcon className="w-5 h-5"/>
                    Add Sample
                </button>
            </div>
            
            <div className="space-y-4">
                {(engineer.mixingSamples || []).length > 0 ? (engineer.mixingSamples || []).map(sample => (
                    <div key={sample.id} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg text-zinc-200 flex items-center gap-2"><MusicNoteIcon className="w-5 h-5 text-purple-400"/> {sample.title}</h3>
                            <p className="text-sm text-zinc-400 mt-1">{sample.description}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                             <button onClick={() => handleOpenModal(sample)} className="p-2 text-zinc-400 hover:text-orange-400 rounded-full bg-zinc-800 hover:bg-orange-500/10"><EditIcon className="w-5 h-5"/></button>
                             <button onClick={() => handleDeleteSample(sample.id)} className="p-2 text-zinc-400 hover:text-red-400 rounded-full bg-zinc-800 hover:bg-red-500/10"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center py-8 text-zinc-500">You haven't uploaded any mixing samples yet. Add your first sample to showcase your work!</p>
                )}
            </div>
            
            {isModalOpen && <MixingSampleFormModal sample={editingSample} onSave={handleSaveSample} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default MixingSampleManager;
      