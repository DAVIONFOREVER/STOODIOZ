
import React, { useEffect, useMemo, useState } from 'react';
import type { Conversation, FileAttachment } from '../types';
import { UserRole } from '../types';
import { PaperclipIcon, DownloadIcon, BriefcaseIcon } from './icons';
import { formatDistanceToNow } from 'date-fns';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';

interface DocumentsProps {
    conversations: Conversation[];
    /** When LABEL, bookings are filtered to this label's only (label_profile_id). */
    userRole?: UserRole | null;
    /** deliverables = chat files only */
    variant?: 'default' | 'deliverables';
}

interface DocumentInfo {
    type: 'file' | 'invoice' | 'document';
    file: FileAttachment;
    source: string; // Conversation Name or "Booking"
    timestamp: string;
    id?: string;
    storage_path?: string | null;
}

const Documents: React.FC<DocumentsProps> = ({ conversations, userRole, variant = 'default' }) => {
    const { currentUser, bookings } = useAppState();
    const [dbDocuments, setDbDocuments] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'documents' | 'invoices' | 'files'>('all');
    const [search, setSearch] = useState('');
    const isDeliverables = variant === 'deliverables';

    useEffect(() => {
        if (!currentUser?.id) return;
        let isActive = true;
        apiService.fetchUserDocuments(currentUser.id)
            .then((rows) => {
                if (isActive) setDbDocuments(rows || []);
            })
            .catch((err) => console.error('Failed to load documents', err));
        return () => {
            isActive = false;
        };
    }, [currentUser?.id]);

    const EXPIRY_DAYS = 7;
    const isExpired = (ts?: string) => {
        if (!ts) return false;
        const ageMs = Date.now() - new Date(ts).getTime();
        return ageMs > EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    };

    const allDocuments = useMemo(() => {
        if (!currentUser) return [];
        const documents: DocumentInfo[] = [];

        const getDbFilename = (doc: any) => {
            if (doc?.name) return doc.name;
            if (doc?.file_name) return doc.file_name;
            if (doc?.title) return `${doc.title}.pdf`;
            if (doc?.storage_path) return String(doc.storage_path).split('/').pop();
            return 'Document.pdf';
        };

        if (!isDeliverables) {
            // 0. AI / Vault Documents
            dbDocuments.forEach((doc) => {
                if (!doc?.url) return;
                const fileName = getDbFilename(doc);
                documents.push({
                    type: 'document',
                    file: {
                        name: fileName,
                        url: doc.url,
                        size: doc.size || doc.file_size || 'PDF'
                    },
                    source: doc.type || doc.category || 'AI Document',
                    timestamp: doc.created_at || doc.updated_at || new Date().toISOString(),
                    id: doc.id,
                    storage_path: doc.storage_path || null
                });
            });
        }

        if (isDeliverables) {
            // 1. Chat Files — only conversations where currentUser is a participant (user-scoped, no cross-label leak)
            const participantIds = (c: Conversation) =>
                (c.participant_ids as string[] | undefined) || (c.participants || []).map((p: any) => (typeof p === 'string' ? p : p?.id)).filter(Boolean);
            (conversations || []).filter(convo => participantIds(convo).includes(currentUser?.id || '')).forEach(convo => {
                const participants = convo.participants || [];
                const participant = participants.find((p: any) => p.id !== currentUser?.id) || participants[0];
                (convo.messages || []).forEach((msg: any) => {
                    if (msg.type === 'files' && msg.files) {
                        msg.files.forEach(file => {
                            documents.push({
                                type: 'file',
                                file,
                                source: convo.title || participant?.name || 'Unknown Chat',
                                timestamp: msg.timestamp,
                                storage_path: file?.storage_path || null
                            });
                        });
                    }
                });
            });
        }

        if (!isDeliverables) {
            // 2. Invoices from Bookings — for LABEL only this label's (label_profile_id); others use all
            const scopeBookings = userRole === UserRole.LABEL && currentUser?.id
                ? (bookings || []).filter((b: any) => b.label_profile_id === currentUser.id)
                : (bookings || []);
            scopeBookings.forEach((booking: any) => {
                if (booking.invoice_url) {
                    const filename = `Invoice-${booking.id}.pdf`;
                    documents.push({
                        type: 'invoice',
                        file: {
                            name: filename,
                            url: booking.invoice_url,
                            size: 'PDF' // Size usually unknown here without metadata fetch
                        },
                        source: 'Automated Booking Invoice',
                        timestamp: booking.date // Use booking date
                    });
                }
            });
        }

        return documents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [conversations, currentUser, bookings, userRole, isDeliverables]);

    useEffect(() => {
        if (!isDeliverables) return;
        const expiredPaths = allDocuments
            .filter((doc) => doc.type === 'file' && isExpired(doc.timestamp) && doc.storage_path)
            .map((doc) => doc.storage_path as string);
        if (expiredPaths.length === 0) return;
        apiService.deletePostAttachments(expiredPaths);
    }, [allDocuments, isDeliverables]);

    const filteredDocuments = useMemo(() => {
        const term = search.trim().toLowerCase();
        return allDocuments.filter((doc) => {
            if (isDeliverables && doc.type !== 'file') return false;
            if (isDeliverables && isExpired(doc.timestamp)) return false;
            if (filter === 'documents' && doc.type !== 'document') return false;
            if (filter === 'invoices' && doc.type !== 'invoice') return false;
            if (filter === 'files' && doc.type !== 'file') return false;
            if (!term) return true;
            const hay = [
                doc.file?.name,
                doc.source,
                doc.file?.url,
                doc.file?.size
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(term);
        });
    }, [allDocuments, filter, search, isDeliverables]);

    const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>, file: FileAttachment) => {
        if (!file.rawContent) {
            if (file.url === '#') e.preventDefault();
            return;
        }
        e.preventDefault();
        const blobType = file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain;charset=utf-8';
        const blob = new Blob([file.rawContent], { type: blobType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 cardSurface">
            <h1 className="text-2xl font-bold mb-4 text-zinc-100 flex items-center gap-2">
                <PaperclipIcon className="w-6 h-6 text-orange-400" />
                {isDeliverables ? 'Session Deliverables' : userRole === UserRole.LABEL ? 'Label Vault' : 'My Documents'}
            </h1>
            {isDeliverables && (
                <p className="text-xs text-zinc-400 mb-3">Deliverables auto-delete after 7 days.</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {!isDeliverables && [
                    { id: 'all', label: 'All' },
                    { id: 'documents', label: 'Documents' },
                    { id: 'invoices', label: 'Invoices' },
                    { id: 'files', label: 'Files' }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setFilter(item.id as any)}
                        className={`text-xs px-3 py-1 rounded-full border ${
                            filter === item.id
                                ? 'bg-orange-500/20 border-orange-400 text-orange-200'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
                <div className={`w-full ${isDeliverables ? 'sm:w-64' : 'sm:w-64 ml-auto'}`}>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isDeliverables ? 'Search deliverables...' : 'Search documents...'}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500"
                    />
                </div>
            </div>
            {filteredDocuments.length > 0 ? (
                <div className="space-y-3">
                    {filteredDocuments.map((doc, index) => (
                        <div key={`${doc.source}-${index}`} className="bg-zinc-800 p-3 rounded-lg flex items-center gap-4 border border-zinc-700">
                            {doc.type === 'invoice' ? (
                                <BriefcaseIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                            ) : doc.type === 'document' ? (
                                <BriefcaseIcon className="w-6 h-6 text-orange-400 flex-shrink-0" />
                            ) : (
                                <PaperclipIcon className="w-6 h-6 text-zinc-400 flex-shrink-0" />
                            )}
                            
                            <div className="flex-grow overflow-hidden">
                                <a href={doc.file.url} onClick={(e) => handleDownload(e, doc.file)} download={doc.file.name} className="text-sm font-semibold text-orange-400 hover:underline truncate block" target="_blank" rel="noopener noreferrer">{doc.file.name}</a>
                                <p className="text-xs text-zinc-500">
                                    {doc.type === 'invoice' ? 'Aria generated' : doc.file.size} - {doc.source} - {formatDistanceToNow(new Date(doc.timestamp), { addSuffix: true })}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                                        {doc.type}
                                    </span>
                                    {doc.source && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                                            {doc.source}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <a href={doc.file.url} onClick={(e) => handleDownload(e, doc.file)} download={doc.file.name} className="bg-zinc-600 hover:bg-zinc-500 p-2 rounded-full transition-colors" aria-label={`Download ${doc.file.name}`} target="_blank" rel="noopener noreferrer">
                                <DownloadIcon className="w-5 h-5 text-zinc-200" />
                            </a>
                            {doc.type === 'document' && doc.id && (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Delete this document? This cannot be undone.')) return;
                                        try {
                                            await apiService.deleteDocument({ id: doc.id, storage_path: doc.storage_path });
                                            setDbDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                                        } catch (err) {
                                            console.error('Failed to delete document', err);
                                            alert('Failed to delete document. Please try again.');
                                        }
                                    }}
                                    className="bg-red-500/10 hover:bg-red-500/20 p-2 rounded-full transition-colors"
                                    aria-label={`Delete ${doc.file.name}`}
                                >
                                    <span className="text-red-300 text-xs font-bold">DEL</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-zinc-500 py-16">
                    <PaperclipIcon className="w-12 h-12 mx-auto text-zinc-600"/>
                    <p className="mt-2 font-semibold">{isDeliverables ? 'No deliverables yet' : 'No documents yet'}</p>
                    <p className="text-sm">
                        {isDeliverables
                            ? 'Session files sent by engineers and studios will appear here.'
                            : 'Invoices generated by Aria and files shared in chats will appear here.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Documents;
