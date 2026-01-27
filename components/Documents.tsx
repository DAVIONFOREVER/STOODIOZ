
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
}

interface DocumentInfo {
    type: 'file' | 'invoice' | 'document';
    file: FileAttachment;
    source: string; // Conversation Name or "Booking"
    timestamp: string;
}

const Documents: React.FC<DocumentsProps> = ({ conversations, userRole }) => {
    const { currentUser, bookings } = useAppState();
    const [dbDocuments, setDbDocuments] = useState<any[]>([]);

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
                timestamp: doc.created_at || doc.updated_at || new Date().toISOString()
            });
        });

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
                        });
                    });
                }
            });
        });

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

        return documents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [conversations, currentUser, bookings, userRole]);

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
            <h1 className="text-2xl font-bold mb-6 text-zinc-100 flex items-center gap-2">
                <PaperclipIcon className="w-6 h-6 text-orange-400" /> My Documents
            </h1>
            {allDocuments.length > 0 ? (
                <div className="space-y-3">
                    {allDocuments.map((doc, index) => (
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
                            </div>
                            <a href={doc.file.url} onClick={(e) => handleDownload(e, doc.file)} download={doc.file.name} className="bg-zinc-600 hover:bg-zinc-500 p-2 rounded-full transition-colors" aria-label={`Download ${doc.file.name}`} target="_blank" rel="noopener noreferrer">
                                <DownloadIcon className="w-5 h-5 text-zinc-200" />
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-zinc-500 py-16">
                    <PaperclipIcon className="w-12 h-12 mx-auto text-zinc-600"/>
                    <p className="mt-2 font-semibold">No documents yet</p>
                    <p className="text-sm">Invoices generated by Aria and files shared in chats will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default Documents;
