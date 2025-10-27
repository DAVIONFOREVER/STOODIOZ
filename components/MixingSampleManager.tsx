import React, { useState } from 'react';
import type { Engineer, MixingSample } from '../types';
import { PlusCircleIcon, TrashIcon, EditIcon } from './icons';

interface MixingSampleManagerProps {
    engineer: Engineer;
    onUpdateEngineer: (updates: Partial<Engineer>) => void;
}

const SampleForm: React.FC<{ sample?: MixingSample, onSave: (sample: MixingSample) => void, onCancel: () => void }> = ({ sample, onSave, onCancel }) => {
    const [title, setTitle] = useState(sample?.title || '');
    const [description, setDescription] = useState(sample?.description || '');
    const [audioUrl, setAudioUrl] = useState(sample?.audioUrl || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: sample?.id || `sample-${Date.now()}`, title, description, audioUrl });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700 space-y-4">
            <h3 className="font-semibold text-lg">{sample ? 'Edit Sample' : 'Add New Sample'}</h3>
            <div><label>Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 bg-zinc-800 rounded-md" required /></div>
            <div><label>Audio URL</label><input type="text" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} className="w-full p-2 bg-zinc-800 rounded-md" required /></div>
            <div><label>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-zinc-800 rounded-md" rows={2}></textarea></div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg">Save Sample</button>
            </div>
        </form>
    );
};


const MixingSampleManager: React.FC<MixingSampleManagerProps> = ({ engineer, onUpdateEngineer }) => {
    const [editingSample, setEditingSample] = useState<MixingSample | null | 'new'>(null);
    const samples = engineer.mixingSamples || [];

    const handleSave = (sampleToSave: MixingSample) => {
        const updatedSamples = samples.find(s => s.id === sampleToSave.id)
            ? samples.map(s => s.id === sampleToSave.id ? sampleToSave : s)
            : [...samples, sampleToSave];
        onUpdateEngineer({ mixingSamples: updatedSamples });
        setEditingSample(null);
    };

    const handleDelete = (sampleId: string) => {
        if (window.confirm("Are you sure?")) {
            onUpdateEngineer({ mixingSamples: samples.filter(s => s.id !== sampleId) });
        }
    };
    
    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-zinc-100">Manage Mixing Samples</h1>
                <button onClick={() => setEditingSample('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <PlusCircleIcon className="w-5 h-5"/> Add Sample
                </button>
            </div>
            {editingSample && <SampleForm sample={editingSample === 'new' ? undefined : editingSample} onSave={handleSave} onCancel={() => setEditingSample(null)} />}
            <div className="space-y-4 mt-4">
                {samples.map(sample => (
                    <div key={sample.id} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-orange-400">{sample.title}</h3>
                            <p className="text-sm text-zinc-300">{sample.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => setEditingSample(sample)} className="p-2 bg-zinc-700 rounded-md"><EditIcon className="w-5 h-5"/></button>
                           <button onClick={() => handleDelete(sample.id)} className="p-2 bg-red-500/20 text-red-400 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MixingSampleManager;
