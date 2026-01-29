import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Conversation, Message, Booking, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { AppView, BookingStatus } from '../types';
import { ChevronLeftIcon, PaperAirplaneIcon, PhotoIcon, CloseIcon, MusicNoteIcon, PaperclipIcon, DownloadIcon, VideoCameraIcon } from './icons';
import BookingContextCard from './BookingContextCard';
import { getProfileImageUrl } from '../constants';
import * as apiService from '../services/apiService';
import { getSupabase } from '../lib/supabase';

const FileAttachmentDisplay: React.FC<{ file: { name: string; url: string; size: string } }> = ({ file }) => {
    const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.stopPropagation();
    };

    return (
        <div className="flex items-center gap-4 bg-zinc-800/80 rounded-xl px-4 py-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-700">
                <PaperclipIcon className="w-5 h-5 text-zinc-300" />
            </div>
            <div className="flex-grow overflow-hidden">
                <p className="text-sm font-semibold truncate">{file.name}</p>
                <p className="text-xs text-zinc-400">{file.size}</p>
            </div>
            <a href={file.url} onClick={handleDownload} download={file.name} className="bg-zinc-600 hover:bg-zinc-500 p-2 rounded-full transition-colors" aria-label={`Download ${file.name}`}>
                <DownloadIcon className="w-5 h-5" />
            </a>
        </div>
    );
};

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; count: number; }> = ({ label, isActive, onClick, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors ${isActive ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100 border-b-2 border-transparent'}`}
    >
        <span>{label}</span>
        {count > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-orange-500/20 text-orange-300' : 'bg-zinc-700 text-zinc-300'}`}>{count}</span>}
    </button>
);

interface ChatThreadProps {
    conversation: Conversation;
    booking: Booking | null;
    currentUser: Artist | Stoodio | Engineer | Producer | Label;
    onSendMessage: (conversationId: string, messageContent: Omit<Message, 'id' | 'sender_id' | 'timestamp'>) => void;
    onBack: () => void;
    onNavigate: (view: AppView) => void;
    smartReplies: string[];
    isSmartRepliesLoading: boolean;
    allowVideoCall?: boolean;
    onStartCall?: (conversationId: string, isCaller: boolean) => void;
    titleOverride?: string;
    avatarUrlOverride?: string;
}

const ChatThread: React.FC<ChatThreadProps> = ({
    conversation,
    booking,
    currentUser,
    onSendMessage,
    onBack,
    onNavigate,
    smartReplies,
    isSmartRepliesLoading,
    allowVideoCall = false,
    onStartCall,
    titleOverride,
    avatarUrlOverride,
}) => {
    const [newMessage, setNewMessage] = useState('');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'messages' | 'documents'>('messages');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);

    const participant = conversation.participants.find(p => p.id !== currentUser.id) || conversation.participants[0];
    const displayName = titleOverride || participant?.name || 'Conversation';
    const avatarSrc = avatarUrlOverride || (participant ? getProfileImageUrl(participant) : undefined);

    const documentMessages = useMemo(
        () => conversation.messages.filter(msg => msg.type === 'files' && msg.files && msg.files.length > 0),
        [conversation.messages]
    );

    const allowLargeUploads = useMemo(() => {
        const hasActiveBooking = !!booking && [
            BookingStatus.PENDING,
            BookingStatus.PENDING_APPROVAL,
            BookingStatus.CONFIRMED,
        ].includes(booking.status);
        const hasNoDeliverablesYet = documentMessages.length === 0;
        return hasActiveBooking || hasNoDeliverablesYet;
    }, [booking, documentMessages.length]);

    const documentsCount = useMemo(
        () => documentMessages.reduce((acc, msg) => acc + (msg.files?.length || 0), 0),
        [documentMessages]
    );

    useEffect(() => {
        if (activeTab === 'messages') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversation.messages, activeTab]);

    useEffect(() => {
        if (!allowVideoCall) return;
        const supabase = getSupabase();
        const channel = supabase
            .channel(`video_call:${conversation.id}`)
            .on('broadcast', { event: 'call_request' }, (payload) => {
                const from = payload?.payload?.from;
                if (from && from !== currentUser.id) {
                    setIncomingCallFrom(from);
                }
            })
            .subscribe();

        return () => {
            try {
                supabase.removeChannel(channel);
            } catch (e) {
                console.warn('[ChatThread] removeChannel failed:', e);
            }
        };
    }, [allowVideoCall, conversation.id, currentUser.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(conversation.id, { type: 'text', text: newMessage.trim() });
            setNewMessage('');
        }
    };

    const simulateProgress = () => {
        setUploadProgress(0);
        progressIntervalRef.current = window.setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) return prev;
                const increment = Math.max(1, (90 - prev) / 15);
                return prev + increment;
            });
        }, 400);
    };

    const stopProgress = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        setUploadProgress(100);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MB = 1024 * 1024;
        const GB = 1024 * MB;
        const MAX_STANDARD_BYTES = 10 * MB;
        const MAX_DELIVERABLE_BYTES = 2 * GB;
        const maxBytes = allowLargeUploads ? MAX_DELIVERABLE_BYTES : MAX_STANDARD_BYTES;

        if (file.size > maxBytes) {
            const limitLabel = allowLargeUploads ? '2GB' : '10MB';
            const reason = allowLargeUploads
                ? 'Please split the file or compress it before sending.'
                : 'Large files are only allowed when a session is scheduled or before the first deliverable is sent.';
            alert(`This file exceeds the ${limitLabel} limit. ${reason}`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        setIsAttachmentMenuOpen(false);
        simulateProgress();

        try {
            const { url, path } = await apiService.uploadPostAttachment(currentUser.id, file);

            if (file.type.startsWith('image/')) {
                onSendMessage(conversation.id, {
                    type: 'image',
                    image_url: url,
                    text: 'Sent an image',
                });
            } else if (file.type.startsWith('audio/')) {
                onSendMessage(conversation.id, {
                    type: 'audio',
                    audio_url: url,
                    text: 'Sent an audio file',
                    audio_info: { filename: file.name, duration: 'unknown' },
                });
            } else {
                onSendMessage(conversation.id, {
                    type: 'files',
                    text: 'Sent a file',
                    files: [{
                        name: file.name,
                        url: url,
                        size: `${(file.size / 1024).toFixed(1)} KB`,
                        storage_path: path,
                        uploaded_at: new Date().toISOString(),
                    }],
                });
            }
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload file.');
        } finally {
            stopProgress();
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerUpload = (acceptType: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = acceptType;
            fileInputRef.current.click();
        }
    };

    const handleSmartReplyClick = (reply: string) => {
        onSendMessage(conversation.id, { type: 'text', text: reply });
    };

    const handleStartCall = () => {
        if (!onStartCall) return;
        const supabase = getSupabase();
        supabase.channel(`video_call:${conversation.id}`).send({
            type: 'broadcast',
            event: 'call_request',
            payload: { from: currentUser.id, conversationId: conversation.id },
        });
        onStartCall(conversation.id, true);
    };

    const handleAcceptCall = () => {
        if (!onStartCall) return;
        setIncomingCallFrom(null);
        onStartCall(conversation.id, false);
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            <header className="flex-shrink-0 z-10">
                <div className="flex items-center gap-4 p-3 border-b border-zinc-700/50 bg-zinc-950/80 backdrop-blur-sm">
                    <button onClick={onBack} className="md:hidden p-2 rounded-full hover:bg-zinc-800">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    {avatarSrc && <img src={avatarSrc} alt={displayName} className="w-10 h-10 rounded-xl object-cover" />}
                    <h3 className="font-bold text-lg text-zinc-100">{displayName}</h3>
                    <div className="ml-auto flex items-center gap-2">
                        {allowVideoCall && (
                            <button
                                type="button"
                                onClick={handleStartCall}
                                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                            >
                                <VideoCameraIcon className="w-4 h-4" />
                                Start Call
                            </button>
                        )}
                    </div>
                </div>
                {incomingCallFrom && allowVideoCall && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-orange-500/10 border-b border-orange-500/20">
                        <p className="text-xs text-orange-200">Incoming video call</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIncomingCallFrom(null)} className="text-xs text-zinc-300 hover:text-white">
                                Dismiss
                            </button>
                            <button onClick={handleAcceptCall} className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500 text-white">
                                Accept
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex border-b border-zinc-700/50 bg-zinc-950/80 backdrop-blur-sm">
                    <TabButton
                        label="Messages"
                        isActive={activeTab === 'messages'}
                        onClick={() => setActiveTab('messages')}
                        count={conversation.messages.length}
                    />
                    <TabButton
                        label="Documents"
                        isActive={activeTab === 'documents'}
                        onClick={() => setActiveTab('documents')}
                        count={documentsCount}
                    />
                </div>
            </header>

            <div className="flex-grow overflow-y-auto">
                {activeTab === 'messages' ? (
                    <div className="p-4 space-y-4">
                        {booking && <BookingContextCard booking={booking} onNavigate={onNavigate} />}
                        {conversation.messages.length === 0 && (
                            <div className="text-center text-zinc-500 text-sm mt-8">
                                This is the beginning of your conversation.
                            </div>
                        )}
                        {conversation.messages.map(msg => {
                            if (msg.type === 'system') {
                                return (
                                    <div key={msg.id} className="text-center my-2">
                                        <span className="text-xs text-zinc-400 bg-zinc-700/50 px-3 py-1 rounded-full">{msg.text}</span>
                                    </div>
                                );
                            }
                            const isUser = msg.sender_id === currentUser.id;
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    {!isUser && avatarSrc && <img loading="lazy" src={avatarSrc} className="w-6 h-6 rounded-full self-start" />}
                                    <div className={`max-w-xs md:max-w-md lg:max-w-lg p-1 rounded-2xl ${isUser ? 'bg-orange-500 text-white rounded-br-lg' : 'bg-zinc-700 text-zinc-200 rounded-bl-lg'}`}>
                                        <div className="p-2 space-y-2">
                                            {msg.text && <p>{msg.text}</p>}
                                            {msg.type === 'image' && msg.image_url && <img loading="lazy" src={msg.image_url} alt="Sent image" className="rounded-xl w-full h-auto" />}
                                            {msg.type === 'link' && msg.link && (
                                                <a href={msg.link.url} target="_blank" rel="noopener noreferrer" className="block bg-black/20 p-3 hover:bg-black/30 rounded-xl">
                                                    <p className="font-bold">{msg.link.title}</p>
                                                    <p className="text-xs opacity-80">{msg.link.url}</p>
                                                </a>
                                            )}
                                            {msg.type === 'audio' && msg.audio_url && (
                                                <div className="bg-black/20 p-2 rounded-lg">
                                                    <audio controls src={msg.audio_url} className="w-full h-8 inbox-audio-player"></audio>
                                                </div>
                                            )}
                                            {msg.type === 'files' && msg.files && msg.files.map((file, i) => (
                                                <FileAttachmentDisplay key={i} file={file} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {documentMessages.length > 0 ? documentMessages.map((msg) => (
                            <div key={msg.id} className="space-y-2">
                                {msg.files?.map((file, i) => (
                                    <FileAttachmentDisplay key={i} file={file} />
                                ))}
                            </div>
                        )) : (
                            <div className="text-center text-zinc-500 text-sm mt-8">
                                No documents shared yet.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <footer className="flex-shrink-0 p-3 border-t border-zinc-700/50 bg-zinc-950/80 backdrop-blur-sm">
                {smartReplies.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {smartReplies.map((reply, idx) => (
                            <button
                                key={`${reply}-${idx}`}
                                onClick={() => handleSmartReplyClick(reply)}
                                className="whitespace-nowrap text-xs text-zinc-300 bg-zinc-700/70 hover:bg-zinc-600 rounded-full px-3 py-1"
                            >
                                {reply}
                            </button>
                        ))}
                        {isSmartRepliesLoading && (
                            <span className="text-xs text-zinc-500">Generating smart replies...</span>
                        )}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700"
                        >
                            <PaperclipIcon className="w-5 h-5 text-zinc-300" />
                        </button>
                        {isAttachmentMenuOpen && (
                            <div className="absolute bottom-full left-0 mb-2 bg-zinc-800 rounded-xl shadow-lg border border-zinc-700 w-40 z-10">
                                <button type="button" onClick={() => triggerUpload('image/*')} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-zinc-700">
                                    <PhotoIcon className="w-4 h-4 text-zinc-300" />
                                    <span className="text-sm text-zinc-200">Photo</span>
                                </button>
                                <button type="button" onClick={() => triggerUpload('audio/*')} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-zinc-700">
                                    <MusicNoteIcon className="w-4 h-4 text-zinc-300" />
                                    <span className="text-sm text-zinc-200">Audio</span>
                                </button>
                                <button type="button" onClick={() => triggerUpload('*/*')} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-zinc-700">
                                    <PaperclipIcon className="w-4 h-4 text-zinc-300" />
                                    <span className="text-sm text-zinc-200">File</span>
                                </button>
                                <button type="button" onClick={() => setIsAttachmentMenuOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-zinc-700">
                                    <CloseIcon className="w-4 h-4 text-zinc-300" />
                                    <span className="text-sm text-zinc-200">Close</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Write a message..."
                        className="flex-grow bg-zinc-800/80 border border-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-200 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isUploading}
                        className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:bg-zinc-700"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </form>
                {isUploading && (
                    <div className="mt-2 text-xs text-zinc-400">Uploading... {Math.round(uploadProgress)}%</div>
                )}
            </footer>
        </div>
    );
};

export default ChatThread;
