
import React, { useState, useRef } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { AppView, RosterImportRow } from '../types';
import * as apiService from '../services/apiService';
import * as labelService from '../services/labelService';
import { useAppState } from '../contexts/AppContext';
import { ChevronLeftIcon, CloseIcon, CheckCircleIcon, UsersIcon, PaperclipIcon, DownloadIcon } from '../components/icons';
// @ts-ignore
import * as XLSX from 'xlsx';

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

    const [parsedRows, setParsedRows] = useState<RosterImportRow[]>([]);
    const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
    const [importedCount, setImportedCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const processData = (data: any[]) => {
        const rows: RosterImportRow[] = [];
        
        data.forEach((row: any) => {
            // Normalize keys to lowercase to handle variations (e.g., "Email", "email", "E-mail")
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toLowerCase().trim()] = row[key];
            });

            // Map fields based on common column names
            const name = normalizedRow['name'] || normalizedRow['artist name'] || normalizedRow['artist'] || normalizedRow['full name'];
            const email = normalizedRow['email'] || normalizedRow['e-mail'] || normalizedRow['email address'];
            let role = normalizedRow['role'] || normalizedRow['type'] || 'artist';
            
            // Normalize role
            role = role.toLowerCase();
            if (!['artist', 'producer', 'engineer'].includes(role)) {
                role = 'artist'; // Default
            }

            const phone = normalizedRow['phone'] || normalizedRow['phone number'];
            const instagram = normalizedRow['instagram'] || normalizedRow['ig'] || normalizedRow['handle'];
            const notes = normalizedRow['notes'] || normalizedRow['bio'] || normalizedRow['description'];

            if (name && email) {
                rows.push({
                    name,
                    email,
                    role: role as 'artist' | 'producer' | 'engineer',
                    phone,
                    instagram,
                    notes
                });
            }
        });

        if (rows.length > 0) {
            setParsedRows(rows);
            setStep('preview');
        } else {
            alert("No valid rows found. Please ensure your file has columns for 'Name' and 'Email'.");
            setStep('upload');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            processData(jsonData);
        } catch (error) {
            console.error("Error parsing file:", error);
            alert("Failed to parse file. Please make sure it is a valid CSV or Excel file.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        if (!labelId) return;
        setIsProcessing(true);
        try {
            const { imported, errors } = await apiService.importRosterEdge(labelId, parsedRows);
            setImportedCount(imported);
            if (onAdded) onAdded();
            setStep('success');
            if (errors?.length) {
                const msg = errors.slice(0, 5).map((e: any) => e?.email || e?.name || e?.message).join('; ');
                setTimeout(() => alert(`Some rows had issues: ${msg}${errors.length > 5 ? ' ...' : ''}`), 300);
            }
        } catch (e: any) {
            try {
                await labelService.importRoster(labelId, parsedRows);
                setImportedCount(parsedRows.length);
                if (onAdded) onAdded();
                setStep('success');
            } catch (e2: any) {
                alert(`Import failed: ${(e2 || e)?.message || 'Unknown error'}`);
            }
        } finally {
            setIsProcessing(false);
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

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
             // Reuse logic by setting property on a mock event object if needed, 
             // but cleaner to extract logic. For brevity, creating a new event flow:
             if (fileInputRef.current) {
                 const dataTransfer = new DataTransfer();
                 dataTransfer.items.add(file);
                 fileInputRef.current.files = dataTransfer.files;
                 // Manually trigger handler
                 const event = { target: { files: dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
                 handleFileUpload(event);
             }
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
                    <p className="text-zinc-400 mb-8">Bulk upload artists using CSV or Excel spreadsheets.</p>
                </>
            )}

            <div className={`cardSurface ${!isModal ? 'p-8' : 'p-6 bg-zinc-900 border border-zinc-700 rounded-xl'}`}>
                {isModal && (
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-700">
                        <h2 className="text-xl font-bold text-zinc-100">Import Roster</h2>
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                )}

                {step === 'upload' && (
                    <div className="space-y-8">
                        <div 
                            className="border-2 border-dashed border-zinc-600 rounded-xl p-12 text-center hover:border-orange-500 hover:bg-zinc-800/30 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500/20 transition-colors">
                                <UsersIcon className="w-8 h-8 text-zinc-400 group-hover:text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-200 mb-2">Upload Roster File</h3>
                            <p className="text-zinc-400 mb-6">Drag & drop or click to upload <br/> <span className="font-mono text-orange-400">.xlsx</span>, <span className="font-mono text-orange-400">.xls</span>, or <span className="font-mono text-orange-400">.csv</span></p>
                            
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                className="hidden"
                            />
                            
                            <button className="bg-zinc-700 text-zinc-200 px-6 py-2 rounded-lg font-bold group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                Select File
                            </button>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                            <div className="p-1 bg-blue-500/20 rounded">
                                <PaperclipIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-200 text-sm mb-1">Required Columns</h4>
                                <p className="text-zinc-400 text-xs">
                                    Your file must include <strong>Name</strong> and <strong>Email</strong> headers. 
                                    Optional columns: <strong>Role</strong> (Artist/Producer/Engineer), <strong>Phone</strong>, <strong>Instagram</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                             <button 
                                onClick={handleCancel}
                                className="px-6 py-3 text-zinc-400 hover:text-zinc-200 font-bold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">Preview Import</h3>
                                <p className="text-sm text-zinc-400">Found {parsedRows.length} valid entries in <span className="text-zinc-200 font-mono">{fileName}</span></p>
                            </div>
                            <button onClick={() => setStep('upload')} className="text-sm text-orange-400 hover:underline">
                                Choose Different File
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
                                            <td className="p-3 text-zinc-500 italic">Create Account & Invite</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-4 border-t border-zinc-700/50 pt-6">
                            <button 
                                onClick={handleCancel}
                                className="px-6 py-3 rounded-lg font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleImport}
                                disabled={isProcessing}
                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isProcessing ? 'Importing...' : (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Import & Send Invites
                                    </>
                                )}
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
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            {importedCount} profile{importedCount !== 1 ? 's' : ''} created. Each person will receive an invite with a link to claim their profile. Once they claim, they’ll have a verified badge while on your roster.
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
