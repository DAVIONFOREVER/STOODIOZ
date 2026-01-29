
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Conversation, Message, Artist, Stoodio, Engineer, Booking, Producer, FileAttachment, Label } from '../types';
import { AppView, BookingStatus } from '../types';
import { ChevronLeftIcon, PaperAirplaneIcon, PhotoIcon, LinkIcon, CloseIcon, MusicNoteIcon, PaperclipIcon, DownloadIcon, VideoCameraIcon } from './icons';
import { formatDistanceToNow } from 'date-fns';
import { getDisplayName, getProfileImageUrl } from '../constants';
import BookingContextCard from './BookingContextCard';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useMessaging } from '../hooks/useMessaging';
import * as apiService from '../services/apiService';
import appIcon from '../assets/stoodioz-app-icon.png';
import { getSupabase } from '../lib/supabase';
import LiveHub from './LiveHub';
import LiveChatModal from './LiveChatModal';
import VideoCallModal from './VideoCallModal';
import AriaCantataAssistant from './AriaAssistant';
import { useAria } from '../hooks/useAria';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { useProfile } from '../hooks/useProfile';

const ConversationList: React.FC<{
    conversations: Conversation[];
    onSelect: (id: string) => void;
    selectedConversationId: string | null;
    currentUser: Artist | Stoodio | Engineer | Producer | Label;
    title?: string;
}> = ({ conversations, onSelect, selectedConversationId, currentUser, title = 'Conversations' }) => {
    return (
        <div className="border-r border-zinc-700/50 h-full overflow-y-auto">
            <div className="p-4 border-b border-zinc-700/50">
                <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
            </div>
            <ul>
                {conversations.map(convo => {
                    const participants = Array.isArray(convo.participants) ? convo.participants : [];
                    const messages = Array.isArray(convo.messages) ? convo.messages : [];
                    const participant = participants.find(p => p.id !== currentUser.id) || participants[0];
                    const lastMessage = messages[messages.length - 1];
                    let lastMessageText = 'No messages yet';
                    if (lastMessage) {
                        switch (lastMessage.type) {
                            case 'image': lastMessageText = 'Sent an image'; break;
                            case 'link': lastMessageText = 'Sent a link'; break;
                            case 'audio': lastMessageText = 'Sent a music file'; break;
                            case 'files': lastMessageText = 'Sent a file'; break;
                            case 'system': lastMessageText = 'System Message'; break;
                            default: lastMessageText = lastMessage.text || '';
                        }
                    }

                    const isSelected = convo.id === selectedConversationId;
                    return (
                        <li key={convo.id} onClick={() => onSelect(convo.id)}>
                            <div className={`p-4 flex items-center gap-4 cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-orange-500/10' : 'hover:bg-zinc-800/50'}`}>
                                <div className="relative flex-shrink-0">
                                    <img loading="lazy" src={getProfileImageUrl(participant || { image_url: undefined })} alt={participant?.name || 'User'} className="w-14 h-14 rounded-xl object-cover"/>
                                    {participant?.is_online && (
                                        <span className="absolute -bottom-1 -right-1 block h-4 w-4 rounded-full bg-green-500 ring-2 ring-zinc-800" title="Online"></span>
                                    )}
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-zinc-100 truncate">{participant?.name || 'Unknown'}</p>
                                        {lastMessage && <p className="text-xs text-zinc-400 flex-shrink-0">{formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })}</p>}
                                    </div>
                                    <p className="text-sm text-zinc-400 truncate">{lastMessageText}</p>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

const FileAttachmentDisplay: React.FC<{ file: FileAttachment }> = ({ file }) => {
    const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
        <div className="bg-black/40 p-3 rounded-lg flex items-center gap-3">
            <PaperclipIcon className="w-6 h-6 text-zinc-400 flex-shrink-0" />
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


const ChatThread: React.FC<{
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
    onStartLiveRoom?: () => void;
}> = ({ conversation, booking, currentUser, onSendMessage, onBack, onNavigate, smartReplies, isSmartRepliesLoading, allowVideoCall = false, onStartCall, onStartLiveRoom }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'messages' | 'documents'>('messages');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);
    
    const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const participant = participants.find(p => p.id !== currentUser.id) || participants[0];

    const documentMessages = useMemo(() => 
        messages.filter(msg => msg.type === 'files' && msg.files && msg.files.length > 0),
        [messages]
    );

    const documentsCount = useMemo(() => 
        documentMessages.reduce((acc, msg) => acc + (msg.files?.length || 0), 0),
        [documentMessages]
    );

    useEffect(() => {
        if (activeTab === 'messages') {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, activeTab]);

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
    }

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
        const hasNoDeliverablesYet = !conversation?.messages?.some((msg: any) => msg.type === 'files' && msg.files?.length);
        const allowLargeUploads = (!!associatedBooking && [
            BookingStatus.PENDING,
            BookingStatus.PENDING_APPROVAL,
            BookingStatus.CONFIRMED,
        ].includes(associatedBooking.status)) || hasNoDeliverablesYet;

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
                    text: 'Sent an image' 
                });
            } else if (file.type.startsWith('audio/')) {
                onSendMessage(conversation.id, { 
                    type: 'audio', 
                    audio_url: url,
                    text: 'Sent an audio file',
                    audio_info: { filename: file.name, duration: 'unknown' }
                });
            } else {
                 // Generic file
                 onSendMessage(conversation.id, { 
                    type: 'files', 
                    text: 'Sent a file',
                    files: [{
                        name: file.name,
                        url: url,
                        size: `${(file.size / 1024).toFixed(1)} KB`,
                        storage_path: path,
                        uploaded_at: new Date().toISOString(),
                    }]
                });
            }

        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file.");
        } finally {
            stopProgress();
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const triggerUpload = (acceptType: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = acceptType;
            fileInputRef.current.click();
        }
    }
    
    const handleSmartReplyClick = (reply: string) => {
        onSendMessage(conversation.id, { type: 'text', text: reply });
    }

    return (
        <div className="flex flex-col h-full bg-zinc-900">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            {/* Header */}
            <header className="flex-shrink-0 z-10">
                <div className="flex items-center gap-4 p-3 border-b border-zinc-700/50 bg-zinc-950/80 backdrop-blur-sm">
                    <button onClick={onBack} className="md:hidden p-2 rounded-full hover:bg-zinc-800">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <img src={getProfileImageUrl(participant || { image_url: undefined })} alt={participant?.name || 'User'} className="w-10 h-10 rounded-xl object-cover" />
                    <h3 className="font-bold text-lg text-zinc-100">{participant?.name || 'Conversation'}</h3>
                    <div className="ml-auto flex items-center gap-2">
                        {allowVideoCall && onStartCall && (
                            <button
                                type="button"
                                onClick={() => onStartCall(conversation.id, true)}
                                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                            >
                                <VideoCameraIcon className="w-4 h-4" />
                                Start Call
                            </button>
                        )}
                        {onStartLiveRoom && (
                            <button
                                type="button"
                                onClick={onStartLiveRoom}
                                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-900/70 text-zinc-200 border border-zinc-800 hover:bg-zinc-900"
                            >
                                <VideoCameraIcon className="w-4 h-4" />
                                Go Live
                            </button>
                        )}
                    </div>
                </div>
                {incomingCallFrom && allowVideoCall && onStartCall && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-orange-500/10 border-b border-orange-500/20">
                        <p className="text-xs text-orange-200">Incoming video call</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIncomingCallFrom(null)} className="text-xs text-zinc-300 hover:text-white">
                                Dismiss
                            </button>
                            <button onClick={() => { setIncomingCallFrom(null); onStartCall(conversation.id, false); }} className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500 text-white">
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
                        count={messages.length}
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
                        {booking && <BookingContextCard booking={booking} onNavigate={onNavigate}/>}
                        {messages.length === 0 && (
                            <div className="text-center text-zinc-500 text-sm mt-8">
                                This is the beginning of your conversation.
                            </div>
                        )}
                        {messages.map(msg => {
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
                                    {!isUser && <img loading="lazy" src={getProfileImageUrl(participant || { image_url: undefined })} className="w-6 h-6 rounded-full self-start"/>}
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
                            )
                        })}
                        {isUploading && (
                             <div className="flex justify-end">
                                <div className="bg-orange-500 text-white rounded-l-lg rounded-tr-lg p-2 text-sm animate-pulse flex items-center gap-2">
                                    <img src={appIcon} alt="Loading" className="w-3 h-3 animate-spin" />
                                    Uploading {Math.round(uploadProgress)}%...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {documentMessages.length > 0 ? (
                             documentMessages.flatMap(msg => 
                                msg.files?.map((file, index) => (
                                    <div key={`${msg.id}-${index}`} className="bg-zinc-800 p-3 rounded-lg flex items-center gap-4 border border-zinc-700">
                                        <PaperclipIcon className="w-6 h-6 text-zinc-400 flex-shrink-0" />
                                        <div className="flex-grow overflow-hidden">
                                            <a href={file.url} download={file.name} className="text-sm font-semibold text-orange-400 hover:underline truncate block">{file.name}</a>
                                            <p className="text-xs text-zinc-500">{file.size} - Shared {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}</p>
                                        </div>
                                        <a href={file.url} download={file.name} className="bg-zinc-600 hover:bg-zinc-500 p-2 rounded-full transition-colors" aria-label={`Download ${file.name}`}>
                                            <DownloadIcon className="w-5 h-5 text-zinc-200" />
                                        </a>
                                    </div>
                                ))
                            )
                        ) : (
                            <div className="text-center text-zinc-500 pt-16">
                                <PaperclipIcon className="w-12 h-12 mx-auto text-zinc-600"/>
                                <p className="mt-2 font-semibold">No documents yet</p>
                                <p className="text-sm">Files sent in this chat will appear here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            {activeTab === 'messages' && (
                <div className="flex-shrink-0">
                    {(isSmartRepliesLoading || smartReplies.length > 0) && (
                        <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto">
                            {isSmartRepliesLoading ? (
                                <div className="text-sm text-zinc-400 italic">Generating replies...</div>
                            ) : (
                                smartReplies.map((reply, i) => (
                                    <button key={i} onClick={() => handleSmartReplyClick(reply)} className="flex-shrink-0 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 py-1.5 px-3 rounded-full transition-colors">
                                        {reply}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                    <div className="relative p-4 bg-zinc-950/80 backdrop-blur-sm border-t border-zinc-700/50">
                        {isAttachmentMenuOpen && (
                            <div className="absolute bottom-20 left-4 bg-zinc-800 p-2 rounded-lg border border-zinc-700 shadow-xl flex flex-col gap-1 z-20 text-zinc-200">
                                <button onClick={() => triggerUpload('image/*,.heic,.heif')} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700"><PhotoIcon className="w-5 h-5 text-zinc-400" /> Send Photo</button>
                                <button onClick={() => handleSmartReplyClick("Here is a link.")} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700"><LinkIcon className="w-5 h-5 text-zinc-400" /> Send Link</button>
                                <button onClick={() => triggerUpload('audio/*')} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700"><MusicNoteIcon className="w-5 h-5 text-zinc-400" /> Send Music</button>
                                <button onClick={() => onStartLiveRoom?.()} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700"><VideoCameraIcon className="w-5 h-5 text-zinc-400" /> Go Live</button>
                                <button onClick={() => triggerUpload('*/*')} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700"><PaperclipIcon className="w-5 h-5 text-zinc-400" /> Send File</button>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            <button type="button" onClick={() => setIsAttachmentMenuOpen(prev => !prev)} className="text-zinc-400 hover:text-orange-400 p-2">
                                <PaperclipIcon className="w-6 h-6"/>
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-zinc-800 border-zinc-700 text-zinc-100 rounded-full py-2 px-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <button type="submit" disabled={!newMessage.trim()} className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors flex-shrink-0 disabled:bg-zinc-600 disabled:cursor-not-allowed">
                                <PaperAirplaneIcon className="w-6 h-6" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const Inbox: React.FC = () => {
    const { conversations, bookings, selectedConversationId, currentUser, smartReplies, isSmartRepliesLoading, artists, engineers, stoodioz, producers, labels, ariaHistory, initialAriaCantataPrompt } = useAppState();
    const dispatch = useAppDispatch();
    const { navigate, viewStoodioDetails, viewArtistProfile, viewEngineerProfile, viewProducerProfile, viewLabelProfile, navigateToStudio } = useNavigation();
    const { sendMessage, selectConversation, fetchSmartReplies, startConversation } = useMessaging(navigate);
    const { logout, selectRoleToSetup } = useAuth(navigate);
    const { confirmBooking } = useBookings(navigate);
    const { updateProfile } = useProfile();
    const { executeCommand } = useAria({
        startConversation: (participant) => startConversation(participant, undefined, false),
        navigate,
        viewStoodioDetails,
        viewEngineerProfile,
        viewProducerProfile,
        viewArtistProfile,
        viewLabelProfile,
        navigateToStudio,
        confirmBooking,
        updateProfile,
        selectRoleToSetup,
        logout,
    });
    const [isCallOpen, setIsCallOpen] = useState(false);
    const [callConversationId, setCallConversationId] = useState<string | null>(null);
    const [callIsCaller, setCallIsCaller] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeLiveRoomId, setActiveLiveRoomId] = useState<string | null>(null);
    const [activeLiveRoomTitle, setActiveLiveRoomTitle] = useState('');
    const [activeLiveConversationId, setActiveLiveConversationId] = useState<string | null>(null);
    const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
    const [isLiveChatLoading, setIsLiveChatLoading] = useState(false);

    useEffect(() => {
        if(selectedConversationId) {
            const convo = conversations.find(c => c.id === selectedConversationId);
            if (convo) {
                fetchSmartReplies(convo.messages);
            }
        }
    }, [selectedConversationId, conversations, fetchSmartReplies]);
    
    const selectedConversation = selectedConversationId ? conversations.find(c => c.id === selectedConversationId) : null;
    const associatedBooking = selectedConversation?.booking_id ? bookings.find(b => b.id === selectedConversation.booking_id) : null;
    const activeCallConversation = callConversationId ? conversations.find(c => c.id === callConversationId) : null;
    const callPeer = activeCallConversation?.participants.find(p => p.id !== currentUser?.id);

    const handleStartCall = (conversationId: string, isCaller: boolean) => {
        if (isCaller && currentUser) {
            const supabase = getSupabase();
            supabase.channel(`video_call:${conversationId}`).send({
                type: 'broadcast',
                event: 'call_request',
                payload: { from: currentUser.id, conversationId },
            });
        }
        setCallConversationId(conversationId);
        setCallIsCaller(isCaller);
        setIsCallOpen(true);
    };

    const allUsers = useMemo(() => {
        const list = [
            ...(artists ?? []),
            ...(engineers ?? []),
            ...(stoodioz ?? []),
            ...(producers ?? []),
            ...(labels ?? []),
        ];
        const convoParticipants = (conversations || [])
            .flatMap((c) => (c.participants || []))
            .filter(Boolean);
        const merged = [...list, ...convoParticipants];
        const unique = new Map<string, any>();
        merged.forEach((u: any) => {
            if (!u?.id) return;
            if (currentUser && u.id === currentUser.id) return;
            if (!unique.has(u.id)) unique.set(u.id, u);
        });
        return Array.from(unique.values());
    }, [artists, engineers, stoodioz, producers, labels, conversations, currentUser]);

    const filteredUsers = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return [];
        return allUsers.filter((user: any) => {
            const name = getDisplayName(user, '').toLowerCase();
            const email = String(user?.email || '').toLowerCase();
            const location = String(user?.location_text || user?.location || '').toLowerCase();
            return name.includes(term) || email.includes(term) || location.includes(term);
        });
    }, [allUsers, searchQuery]);

    const handleSelectUser = async (user: Artist | Engineer | Stoodio | Producer | Label) => {
        await startConversation(user, undefined, false);
        setSearchQuery('');
    };

    const handleStartLiveRoom = async () => {
        if (!currentUser) return;
        setIsLiveChatLoading(true);
        try {
            const room = await apiService.createLiveRoom(currentUser.id, `${currentUser.name} Live Room`);
            const updated = await apiService.fetchConversations(currentUser.id);
            dispatch({
                type: ActionTypes.SET_CONVERSATIONS,
                payload: { conversations: updated },
            });
            setActiveLiveRoomId(room.id);
            setActiveLiveRoomTitle(room.title || 'Live Room');
            setActiveLiveConversationId(room.conversation_id || null);
            setIsLiveChatOpen(true);
        } catch (e) {
            console.error('Failed to start live room', e);
            alert('Could not start a live room.');
        } finally {
            setIsLiveChatLoading(false);
        }
    };

    const handleJoinLiveRoom = async (roomId: string) => {
        if (!currentUser) return;
        setIsLiveChatLoading(true);
        try {
            const room = await apiService.joinLiveRoom(roomId, currentUser.id);
            const updated = await apiService.fetchConversations(currentUser.id);
            dispatch({
                type: ActionTypes.SET_CONVERSATIONS,
                payload: { conversations: updated },
            });
            setActiveLiveRoomId(roomId);
            setActiveLiveRoomTitle(room?.title || 'Live Room');
            setActiveLiveConversationId(room?.conversation_id || null);
            setIsLiveChatOpen(true);
        } catch (e) {
            console.error('Failed to join live room', e);
            alert('Could not join that live room.');
        } finally {
            setIsLiveChatLoading(false);
        }
    };

    const handleCloseLiveChat = async () => {
        if (activeLiveRoomId && currentUser) {
            try {
                await apiService.leaveLiveRoom(activeLiveRoomId, currentUser.id);
            } catch (e) {
                console.warn('Failed to leave live room', e);
            }
        }
        setIsLiveChatOpen(false);
    };

    useEffect(() => {
        if (!activeLiveConversationId) return;
        const conversation = conversations.find(c => c.id === activeLiveConversationId);
        if (conversation) {
            fetchSmartReplies(conversation.messages);
        }
    }, [activeLiveConversationId, conversations, fetchSmartReplies]);

    if (!currentUser) {
        return (
            <div className="flex h-[calc(100dvh-10rem)] items-center justify-center cardSurface border border-zinc-800/70 bg-zinc-950/70">
                <div className="text-center">
                    <p className="text-slate-200 font-semibold">Message Hub</p>
                    <p className="text-sm text-slate-500 mt-1">Sign in to access your conversations.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100dvh-10rem)] overflow-hidden cardSurface border border-zinc-800/70 bg-zinc-950/70">
            <div className={`w-full md:w-1/3 ${selectedConversationId ? 'hidden md:block' : ''}`}>
                <div className="h-full flex flex-col border-r border-zinc-800/60">
                    <div className="p-5 border-b border-zinc-800/60 bg-gradient-to-br from-zinc-950 via-zinc-950/80 to-zinc-900/50">
                        <div className="flex items-center gap-3">
                            <img src={appIcon} alt="Stoodioz" className="w-10 h-10 rounded-xl object-cover" />
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-orange-400">Message Hub</p>
                                <h2 className="text-xl font-bold text-zinc-100">Message Hub</h2>
                                <p className="text-xs text-zinc-400">Bookings, collabs, and live sessions.</p>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                onClick={handleStartLiveRoom}
                                className="px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold hover:bg-orange-500/30"
                            >
                                Start Live Room
                            </button>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="px-3 py-1.5 rounded-full bg-zinc-900/70 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-900"
                            >
                                Find People
                            </button>
                        </div>
                        <div className="mt-4">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search artists, engineers, producers, studios, labels..."
                                className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                            />
                        </div>
                        {searchQuery.trim().length > 0 && (
                            <div className="mt-3 max-h-52 overflow-y-auto space-y-2">
                                {filteredUsers.length === 0 ? (
                                    <p className="text-xs text-zinc-500 px-1">No matches found.</p>
                                ) : (
                                    filteredUsers.slice(0, 10).map((user: any) => {
                                        const role = ((user as any).role || (user as any).profiles?.role || (user as any).profile?.role || '').toString().toUpperCase();
                                        const location = String(user?.location_text || user?.location || '');
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => handleSelectUser(user)}
                                                className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-900/80 transition-colors text-left"
                                            >
                                                <img src={getProfileImageUrl(user)} alt={getDisplayName(user)} className="w-9 h-9 rounded-lg object-cover" />
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-semibold text-zinc-100 truncate">{getDisplayName(user)}</p>
                                                    <p className="text-xs text-zinc-400 truncate">
                                                        {role || 'CREATOR'}{location ? ` • ${location}` : ''}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ConversationList
                            conversations={conversations}
                            onSelect={selectConversation}
                            selectedConversationId={selectedConversationId}
                            currentUser={currentUser}
                            title="Conversations"
                        />
                        <div className="p-4 border-t border-zinc-800/60">
                            <LiveHub onStartLive={handleStartLiveRoom} onJoinLive={handleJoinLiveRoom} />
                        </div>
                        <div className="p-4 border-t border-zinc-800/60">
                            <div className="cardSurface p-4 bg-zinc-950/70">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.25em] text-orange-400">Aria Helpdesk</p>
                                        <p className="text-sm text-zinc-400">Scheduling, networking, and messaging support.</p>
                                    </div>
                                </div>
                                <div className="h-[360px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
                                    <AriaCantataAssistant
                                        isOpen={true}
                                        onClose={() => {}}
                                        onExecuteCommand={executeCommand}
                                        history={ariaHistory}
                                        setHistory={(newHistory) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history: newHistory } })}
                                        initialPrompt={initialAriaCantataPrompt}
                                        clearInitialPrompt={() => dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: null } })}
                                        isInline={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`w-full md:w-2/3 ${selectedConversationId ? 'block' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                    <ChatThread
                        conversation={selectedConversation} 
                        booking={associatedBooking || null}
                        currentUser={currentUser}
                        onSendMessage={sendMessage}
                        onBack={() => selectConversation(null)}
                        onNavigate={navigate}
                        smartReplies={smartReplies}
                        isSmartRepliesLoading={isSmartRepliesLoading}
                        allowVideoCall={true}
                        onStartCall={handleStartCall}
                        onStartLiveRoom={handleStartLiveRoom}
                    />
                ) : (
                    <div className="items-center justify-center h-full w-full hidden md:flex">
                        <div className="text-center">
                            <p className="text-slate-300 font-semibold">Start a conversation</p>
                            <p className="text-sm text-slate-500 mt-1">Search for creators or pick a recent thread.</p>
                        </div>
                    </div>
                )}
            </div>
            {isCallOpen && activeCallConversation && callPeer && currentUser && (
                <VideoCallModal
                    conversationId={activeCallConversation.id}
                    currentUserId={currentUser.id}
                    peerId={callPeer.id}
                    isCaller={callIsCaller}
                    onClose={() => setIsCallOpen(false)}
                />
            )}
            {isLiveChatOpen && currentUser && (
                <LiveChatModal
                    conversationId={activeLiveConversationId}
                    roomTitle={activeLiveRoomTitle}
                    onClose={handleCloseLiveChat}
                    currentUser={currentUser as Artist | Engineer | Stoodio | Producer | Label}
                    onSendMessage={sendMessage}
                    onNavigate={navigate}
                    smartReplies={smartReplies}
                    isSmartRepliesLoading={isSmartRepliesLoading}
                />
            )}
            {isLiveChatLoading && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
                    <div className="cardSurface px-6 py-4 text-sm text-zinc-200">Connecting to live chat...</div>
                </div>
            )}
        </div>
    );
};

export default Inbox;
