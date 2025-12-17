
import React, { useState, useEffect, useMemo } from 'react';
import type { Conversation, FileAttachment } from '../types';
import { PaperclipIcon, DownloadIcon, BriefcaseIcon, ChartBarIcon } from './icons';
import { formatDistanceToNow } from 'date-fns';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';

interface DocumentsProps {
    conversations: Conversation[];
}

interface DocumentInfo {
    id?: string;
    type: 'file' | 'invoice' | 'official';
    file: FileAttachment;
    source: string; 
    timestamp: string;
    category?: string;
}

const Documents: React.FC<DocumentsProps> = ({ conversations }) => {
    const { currentUser, bookings } = useAppState();
    const [dbDocuments, setDbDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            apiService.fetchUserDocuments(currentUser.id).then(docs => {
                setDbDocuments(docs);
                setIsLoading(false);
            });
        }
    }, [currentUser]);

    const allDocuments = useMemo(() => {
        if (!currentUser) return [];
        const documents: DocumentInfo[] = [];

        // 1. Aria Official Generated Documents (from DB)
        dbDocuments.forEach(doc => {
            documents.push({
                id: doc.id,
                type: 'official',
                file: {
                    name: doc.name,
                    url: doc.url,
                    size: doc.size
                },
                source: 'Aria Assistant',
                timestamp: doc.created_at,
                category: doc.category
            });
        });

        // 2. Chat Files
        conversations.forEach(convo => {
            const participant = convo.participants.find(p => p.id !== currentUser.id) || convo.participants[0];
            convo.messages.forEach(msg => {
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

        // 3. Invoices from Bookings
        bookings.forEach(booking => {
            if (booking.invoice_url) {
                const filename = `Invoice-${booking.id.slice(0, 8)}.pdf`;
                documents.push({
                    type: 'invoice',
                    file: {
                        name: filename,
                        url: booking.invoice_url,
                        size: 'PDF'
                    },
                    source: 'Automated Booking Invoice',
                    timestamp: booking.date 
                });
            }
        });

        return documents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [conversations, currentUser, bookings, dbDocuments]);

    const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>, file: FileAttachment) => {
        if (!file.rawContent) {
            if (file.url === '#' || !file.url) {
                e.preventDefault();
                alert("This file is being processed. Please try again in a few seconds.");
            }
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

    const getIcon = (doc: DocumentInfo) => {
        if (doc.type === 'invoice') return <BriefcaseIcon className="w-6 h-6 text-green-400 flex-shrink-0" />;
        if (doc.type === 'official') {
            return doc.category === 'REPORT' 
                ? <ChartBarIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
                : <BriefcaseIcon className="w-6 h-6 text-orange-400 flex-shrink-0" />;
        }
        return <PaperclipIcon className="w-6 h-6 text-zinc-400 flex-shrink-0" />;
    };

    return (
        <div className="p-6 cardSurface min-h-[400px]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                    <PaperclipIcon className="w-6 h-6 text-orange-400" /> My Documents
                </h1>
                {isLoading && <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>}
            </div>

            {allDocuments.length > 0 ? (
                <div className="space-y-3">
                    {allDocuments.map((doc, index) => (
                        <div key={`${doc.source}-${index}`} className="bg-zinc-800 p-4 rounded-xl flex items-center gap-4 border border-zinc-700 hover:border-orange-500/30 transition-all group">
                            {getIcon(doc)}
                            
                            <div className="flex-grow overflow-hidden">
                                <a 
                                    href={doc.file.url} 
                                    onClick={(e) => handleDownload(e, doc.file)} 
                                    download={doc.file.name} 
                                    className="text-sm font-bold text-zinc-200 group-hover:text-orange-400 hover:underline truncate block transition-colors" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    {doc.file.name}
                                </a>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{doc.source}</span>
                                    <span className="text-zinc-600">•</span>
                                    <span className="text-[10px] text-zinc-500">{formatDistanceToNow(new Date(doc.timestamp), { addSuffix: true })}</span>
                                    {doc.file.size && (
                                        <>
                                            <span className="text-zinc-600">•</span>
                                            <span className="text-[10px] text-zinc-500">{doc.file.size}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <a 
                                href={doc.file.url} 
                                onClick={(e) => handleDownload(e, doc.file)} 
                                download={doc.file.name} 
                                className="bg-zinc-700 hover:bg-zinc-600 p-2.5 rounded-full transition-colors group-hover:bg-orange-500 group-hover:text-white" 
                                aria-label={`Download ${doc.file.name}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <DownloadIcon className="w-5 h-5" />
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <PaperclipIcon className="w-16 h-16 text-zinc-600 mb-4"/>
                    <p className="font-bold text-zinc-300">No documents yet</p>
                    <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-1">Files shared in chats, booking invoices, and documents generated by Aria will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default Documents;
