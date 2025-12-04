

import React, { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { AppView } from '../types';
import { useLabel } from '../hooks/useLabel';
import { useAppState } from '../contexts/AppContext';
import { ChevronLeftIcon, CloseIcon, CheckCircleIcon, UsersIcon } from '../components/icons';

interface LabelRosterImportProps {
    labelId?: string;
    onAdded?: () => void;
    onClose?: () => void;
}

const LabelRosterImport: React.FC<LabelRosterImportProps> = ({ labelId: propLabelId, onAdded, onClose }) => {
    const { navigate } = useNavigation();
    const { currentUser } = useAppState();
    
    // If used as a page, get ID from context. If modal, use prop.
    const labelId = propLabelId || currentUser?.id || '';
    const isModal = !!propLabelId;

    const { importRoster, loading } = useLabel(labelId);

    const [csvText, setCsvText] = useState('');
    const [parsedRows, setParsedRows] = useState<{ name: string; email: string; role: 'artist' | 'producer' | 'engineer' }[]>([]);
    const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
    const [importedCount, setImportedCount] = useState(0);

    const handleParse = () => {
        const lines = csvText.split('\n');
        const rows: { name: string; email: string; role: 'artist' | 'producer' | 'engineer' }[] = [];
        
        lines.forEach(line => {
            const parts = line.split(',').map(s => s.trim());
            if (parts.length >= 3) {
                // Expected format: Name, Email, Role
                const [name, email, role] = parts;
                if (name && role) {
                    const normalizedRole = role.toLowerCase();
                    if (['artist', 'producer', 'engineer'].includes(normalizedRole)) {
                        rows.push({
                            name,
                            email: email || '',
                            role: normalizedRole as 'artist' | 'producer' | 'engineer'
                        });
                    }
                }
            }
        });

        if (rows.length > 0) {
            setParsedRows(rows);
            setStep('preview');
        } else {
            alert("No valid rows found. Please check format: Name, Email, Role");
        }
    };

    const handleImport = async () => {
        if (!labelId) return;
        try {
            await importRoster(parsedRows);
            setImportedCount(parsedRows.length);
            if (onAdded) onAdded();
            setStep('success');
        } catch (e: any) {
            alert(`Import failed: ${e.message}`);
        }
    };

    const handleFinish = () => {
        if (onClose) {
            onClose();
        } else {
            navigate(AppView.LABEL_DASHBOARD);
        }
    };

    const handleCancel = () => {
        if (onClose) {
            onClose();
        } else {
            navigate(AppView.LABEL_DASHBOARD);
        }
    };

    return (
        <div className={`max-w-4xl mx-auto ${!isModal ? 'p-8 animate-fade-in' : 'w-full'}`}>
            {!isModal && (
                <button onClick={() => navigate(AppView.LABEL_DASHBOARD)} className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                    <ChevronLeftIcon className="w-5 h-5" />
                    Back to Dashboard
                </button>
            )}

            {!isModal && (
                <>
                    <h1 className="text-4xl font-extrabold text-zinc-100 mb-2">Import Roster</h1>
                    <p className="text-zinc-400 mb-8">Bulk upload artists, producers, and engineers to create shadow profiles.</p>
                </>
            )}

            <div className={`cardSurface ${!isModal ? 'p-8' : 'p-6 bg-zinc-900 border border-zinc-700 rounded-xl'}`}>
                {isModal && (
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-700">
                        <h2 className="text-xl font-bold text-zinc-100">Import Roster</h2>
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                )}

                {step === 'input' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-zinc-300 mb-2">
                                Paste CSV Data
                            </label>
                            <p className="text-xs text-zinc-500 mb-2">
                                Format: Name, Email, Role (artist/producer/engineer)
                            </p>
                            <textarea
                                className="w-full h-64 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-zinc-200 font-mono text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder={`Luna Vance, luna@example.com, artist\nJaxson Beats, jax@example.com, producer`}
                                value={csvText}
                                onChange={e => setCsvText(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={handleCancel}
                                className="px-6 py-3 rounded-lg font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleParse}
                                disabled={!csvText.trim()}
                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Preview Import
                            </button>
                        </div>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-zinc-100">Preview ({parsedRows.length} members)</h3>
                            <button onClick={() => setStep('input')} className="text-sm text-orange-400 hover:underline">
                                Edit Data
                            </button>
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto border border-zinc-700 rounded-lg bg-zinc-900">
                            <table className="w-full text-left text-sm text-zinc-300">
                                <thead className="bg-zinc-800 text-zinc-400 sticky top-0">
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {parsedRows.map((row, i) => (
                                        <tr key={i}>
                                            <td className="p-3 font-medium text-white">{row.name}</td>
                                            <td className="p-3">{row.email}</td>
                                            <td className="p-3 capitalize">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    row.role === 'artist' ? 'bg-green-500/20 text-green-400' :
                                                    row.role === 'engineer' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-purple-500/20 text-purple-400'
                                                }`}>
                                                    {row.role}
                                                </span>
                                            </td>
                                            <td className="p-3 text-zinc-500 italic">Create Shadow Profile</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-4 border-t border-zinc-700/50 pt-6">
                            <button 
                                onClick={() => setStep('input')}
                                className="px-6 py-3 rounded-lg font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleImport}
                                disabled={loading}
                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? 'Importing...' : 'Confirm Import'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircleIcon className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-zinc-100 mb-2">Import Successful!</h2>
                        <p className="text-zinc-400 mb-8">
                            Successfully created {importedCount} shadow profiles. They are now available in your roster.
                        </p>
                        <button 
                            onClick={handleFinish}
                            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors"
                        >
                            {isModal ? 'Close' : 'Go to Roster'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabelRosterImport;
