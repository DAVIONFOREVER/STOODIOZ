
import React from 'react';
import type { Conversation, FileAttachment } from '../types';
import { PaperclipIcon, DownloadIcon, BriefcaseIcon } from './icons';
import { formatDistanceToNow } from 'date-fns';
import { useAppState } from '../contexts/AppContext';

interface DocumentsProps {
    conversations: Conversation[];
}

interface DocumentInfo {
    type: 'file' | 'invoice';
    file: FileAttachment;
    source: string; // Conversation Name or "Booking"
    timestamp: string;
}

const Documents: React.FC<DocumentsProps> = ({ conversations }) => {
    const { currentUser, bookings } = useAppState();

    const allDocuments = React.useMemo(() => {
        if (!currentUser) return [];
        const documents: DocumentInfo[] = [];

        // 1. Chat Files
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

        // 2. Invoices from Bookings
        bookings.forEach(booking => {
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
    }, [conversations, currentUser, bookings]);

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
