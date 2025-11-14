import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Conversation, Message, Artist, Stoodio, Engineer, Booking, Producer, FileAttachment } from '../types';
import { AppView } from '../types';
import { ChevronLeftIcon, PaperAirplaneIcon, PhotoIcon, LinkIcon, CloseIcon, MusicNoteIcon, PaperclipIcon, DownloadIcon } from './icons';
import { formatDistanceToNow } from 'date-fns';
import BookingContextCard from './BookingContextCard';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useMessaging } from '../hooks/useMessaging';

const ConversationList: React.FC<{
    conversations: Conversation[];
    onSelect: (id: string) => void;
    selectedConversationId: string | null;
    currentUser: Artist | Stoodio | Engineer | Producer;
}> = ({ conversations, onSelect, selectedConversationId, currentUser }) => {
    return (
        <div className="border-r border-zinc-700/50 h-full overflow-y-auto">
            <div className="p-4 border-b border-zinc-700/50">
                <h2 className="text-2xl font-bold text-zinc-100">Inbox</h2>
            </div>
            <ul>
                {conversations.map(convo => {
                    const participant = convo.participants.find(p => p.id !== currentUser.id) || convo.participants[0];
                    const lastMessage = convo.messages[convo.messages.length - 1];
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
                                    <img loading="lazy" src={participant.imageUrl} alt={participant.name} className="w-14 h-14 rounded-xl object-cover"/>
                                    {participant.isOnline && (
                                        <span className="absolute -bottom-1 -right-1 block h-4 w-4 rounded-full bg-green-500 ring-2 ring-zinc-800" title="Online"></span>
                                    )}
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-zinc-100 truncate">{participant.name}</p>
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
        const blob = new Blob([file.rawContent], { type: 'text/plain;charset=utf-8' });
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
    currentUser: Artist | Stoodio | Engineer | Producer;
    onSendMessage: (conversationId: string, messageContent: Omit<Message, 'id' | 'senderId' | 'timestamp'>) => void;
    onBack: () => void;
    onNavigate: (view: AppView) => void;
    smartReplies: string[];
    isSmartRepliesLoading: boolean;
}> = ({ conversation, booking, currentUser, onSendMessage, onBack, onNavigate, smartReplies, isSmartRepliesLoading }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'messages' | 'documents'>('messages');
    
    const participant = conversation.participants.find(p => p.id !== currentUser.id) || conversation.participants[0];

    const documentMessages = useMemo(() => 
        conversation.messages.filter(msg => msg.type === 'files' && msg.files && msg.files.length > 0),
        [conversation.messages]
    );

    const documentsCount = useMemo(() => 
        documentMessages.reduce((acc, msg) => acc + (msg.files?.length || 0), 0),
        [documentMessages]
    );

    useEffect(() => {
        if (activeTab === 'messages') {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [conversation.messages, activeTab]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(conversation.id, { type: 'text', text: newMessage.trim() });
            setNewMessage('');
        }
    }
    
    const handleSendAttachment = (type: 'image' | 'audio' | 'link') => {
        const messageContent: Omit<Message, 'id' | 'senderId' | 'timestamp'> = { type: 'text' }; // default
        switch(type) {
            case 'image':
                messageContent.type = 'image';
                messageContent.imageUrl = `https://picsum.photos/seed/chatimg${Date.now()}/400/300`;
                messageContent.text = 'Here is a photo.';
                break;
            case 'audio':
                 messageContent.type = 'audio';
                 messageContent.text = 'Check out this track.';
                 messageContent.audioUrl = 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-2-short.mp3';
                 messageContent.audioInfo = { filename: 'track_idea.mp3', duration: '0:18' };
                 break;
            case 'link':
                 messageContent.type = 'link';
                 messageContent.link = { title: 'Inspiration Board', url: 'https://www.pinterest.com' };
                 messageContent.text = 'Here is a link for inspiration.';
                 break;
        }
        onSendMessage(conversation.id, messageContent);
        setIsAttachmentMenuOpen(false);
    }
    
    const handleSmartReplyClick = (reply: string) => {
        onSendMessage(conversation.id, { type: 'text', text: reply });
    }

    return (
        <div className="flex flex-col h-full bg-zinc-900">
            {/* Header */}
            <header className="flex-shrink-0 z-10">
                <div className="flex items-center gap-4 p-3 border-b border-zinc-700/50 bg-zinc-950/80 backdrop-blur-sm">
                    <button onClick={onBack} className="md:hidden p-2 rounded-full hover:bg-zinc-800">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <img src={participant.imageUrl} alt={participant.name} className="w-10 h-10 rounded-xl object-cover" />
                    <h3 className="font-bold text-lg text-zinc-100">{participant.name}</h3>
                </div>
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
                        {booking && <BookingContextCard booking={booking} onNavigate={onNavigate}/>}
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
                            const isUser = msg.senderId === currentUser.id;
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    {!isUser && <img loading="lazy" src={participant.imageUrl} className="w-6 h-6 rounded-full self-start"/>}
                                    <div className={`max-w-xs md:max-w-md lg:max-w-lg p-1 rounded-2xl ${isUser ? 'bg-orange-500 text-white rounded-br-lg' : 'bg-zinc-700 text-zinc-200 rounded-bl-lg'}`}>
                                        <div className="p-2 space-y-2">
                                            {msg.text && <p>{msg.text}</p>}
                                            {msg.type === 'image' && msg.imageUrl && <img loading="lazy" src={msg.imageUrl} alt="Sent image" className="rounded-xl w-full h-auto" />}
                                            {msg.type === 'link' && msg.link && (
                                                <a href={msg.link.url} target="_blank" rel="noopener noreferrer" className="block bg-black/20 p-3 hover:bg-black/30 rounded-xl">
                                                    <p className="font-bold">{msg.link.title}</p>
                                                    <p className="text-xs opacity-80">{msg.link.url}</p>
                                                </a>
                                            )}
                                            {msg.type === 'audio' && msg.audioUrl && (
                                                <div className="bg-black/20 p-2 rounded-lg">
                                                    <audio controls src={msg.audioUrl} className="w-full h-8 inbox-audio-player"></audio>
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
                                <button onClick={() => handleSendAttachment('image')} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700"><PhotoIcon className="w-5 h-5 text-zinc-400" /> Send Photo</button>
                                <button onClick={() => handleSendAttachment('link')} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700"><LinkIcon className="w-5 h-5 text-zinc-400" /> Send Link</button>
                                <button onClick={() => handleSendAttachment('audio')} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700"><MusicNoteIcon className="w-5 h-5 text-zinc-400" /> Send Music</button>
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
    const { conversations, bookings, selectedConversationId, currentUser, smartReplies, isSmartRepliesLoading } = useAppState();
    const { navigate } = useNavigation();
    const { sendMessage, selectConversation, fetchSmartReplies } = useMessaging(navigate);
    
    useEffect(() => {
        if(selectedConversationId) {
            const convo = conversations.find(c => c.id === selectedConversationId);
            if (convo) {
                fetchSmartReplies(convo.messages);
            }
        }
    }, [selectedConversationId, conversations, fetchSmartReplies]);
    
    const selectedConversation = selectedConversationId ? conversations.find(c => c.id === selectedConversationId) : null;
    const associatedBooking = selectedConversation?.bookingId ? bookings.find(b => b.id === selectedConversation.bookingId) : null;

    if (!currentUser) return null;

    return (
        <div className="flex h-[calc(100vh-10rem)] overflow-hidden cardSurface">
            <div className={`w-full md:w-1/3 ${selectedConversationId ? 'hidden md:block' : ''}`}>
                <ConversationList conversations={conversations} onSelect={selectConversation} selectedConversationId={selectedConversationId} currentUser={currentUser} />
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
                    />
                ) : (
                    <div className="items-center justify-center h-full w-full hidden md:flex">
                        <p className="text-slate-400">Select a conversation to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inbox;