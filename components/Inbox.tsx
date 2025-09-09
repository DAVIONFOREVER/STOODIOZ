import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, Message, Artist, Stoodio, Engineer, Booking } from '../types';
import { AppView } from '../types';
import { ChevronLeftIcon, PaperAirplaneIcon, PhotoIcon, LinkIcon, CloseIcon, MusicNoteIcon, PaperclipIcon } from './icons';
import { formatDistanceToNow } from 'date-fns';
import BookingContextCard from './BookingContextCard';

interface InboxProps {
    conversations: Conversation[];
    bookings: Booking[];
    onSendMessage: (conversationId: string, messageContent: Omit<Message, 'id' | 'senderId' | 'timestamp'>) => void;
    selectedConversationId: string | null;
    onSelectConversation: (id: string | null) => void;
    currentUser: Artist | Stoodio | Engineer;
    onNavigate: (view: AppView) => void;
    smartReplies: string[];
    isSmartRepliesLoading: boolean;
    onFetchSmartReplies: (messages: Message[]) => void;
}

const ConversationList: React.FC<{
    conversations: Conversation[];
    onSelect: (id: string) => void;
    selectedConversationId: string | null;
}> = ({ conversations, onSelect, selectedConversationId }) => {
    return (
        <div className="border-r border-zinc-700/50 h-full overflow-y-auto">
            <div className="p-4 border-b border-zinc-700/50">
                <h2 className="text-2xl font-bold text-zinc-100">Inbox</h2>
            </div>
            <ul>
                {conversations.map(convo => {
                    const lastMessage = convo.messages[convo.messages.length - 1];
                    let lastMessageText = 'No messages yet';
                    if (lastMessage) {
                        switch (lastMessage.type) {
                            case 'image': lastMessageText = 'Sent an image'; break;
                            case 'link': lastMessageText = 'Sent a link'; break;
                            case 'audio': lastMessageText = 'Sent a music file'; break;
                            default: lastMessageText = lastMessage.text || '';
                        }
                    }

                    const isSelected = convo.id === selectedConversationId;
                    return (
                        <li key={convo.id} onClick={() => onSelect(convo.id)}>
                            <div className={`p-4 flex items-center gap-4 cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-orange-500/10' : 'hover:bg-zinc-800/50'}`}>
                                <div className="relative flex-shrink-0">
                                    <img loading="lazy" src={convo.participant.imageUrl} alt={convo.participant.name} className="w-14 h-14 rounded-xl object-cover"/>
                                    {convo.participant.isOnline && (
                                        <span className="absolute -bottom-1 -right-1 block h-4 w-4 rounded-full bg-green-500 ring-2 ring-zinc-800" title="Online"></span>
                                    )}
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-zinc-100 truncate">{convo.participant.name}</p>
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

const ChatThread: React.FC<{
    conversation: Conversation;
    booking: Booking | null;
    currentUser: Artist | Stoodio | Engineer;
    onSendMessage: (conversationId: string, messageContent: Omit<Message, 'id' | 'senderId' | 'timestamp'>) => void;
    onBack: () => void;
    onNavigate: (view: AppView) => void;
    smartReplies: string[];
    isSmartRepliesLoading: boolean;
}> = ({ conversation, booking, currentUser, onSendMessage, onBack, onNavigate, smartReplies, isSmartRepliesLoading }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation.messages]);

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
            <div className="flex items-center gap-4 p-3 border-b border-zinc-700/50 bg-zinc-900/70 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={onBack} className="md:hidden p-2 rounded-full hover:bg-zinc-800">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <img src={conversation.participant.imageUrl} alt={conversation.participant.name} className="w-10 h-10 rounded-xl object-cover" />
                <h3 className="font-bold text-lg text-zinc-100">{conversation.participant.name}</h3>
            </div>
            
            {/* Messages */}
            <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-zinc-900">
                {booking && <BookingContextCard booking={booking} onNavigate={onNavigate}/>}

                {conversation.messages.length === 0 && (
                    <div className="text-center text-zinc-500 text-sm mt-8">
                        This is the beginning of your conversation.
                    </div>
                )}
                {conversation.messages.map(msg => {
                     const isUser = msg.senderId === currentUser.id;
                     return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && <img loading="lazy" src={conversation.participant.imageUrl} className="w-6 h-6 rounded-full self-start"/>}
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-1 rounded-2xl ${isUser ? 'bg-orange-500 text-white rounded-br-lg' : 'bg-zinc-700 text-zinc-200 rounded-bl-lg'}`}>
                                {msg.type === 'image' && msg.imageUrl && (
                                    <div className="p-2">
                                        <img loading="lazy" src={msg.imageUrl} alt={msg.text || 'Sent image'} className="rounded-xl w-full h-auto" />
                                        {msg.text && <p className="pt-2 px-1 text-sm">{msg.text}</p>}
                                    </div>
                                )}
                                {msg.type === 'link' && msg.link && (
                                    <a href={msg.link.url} target="_blank" rel="noopener noreferrer" className="block p-3 hover:bg-black/20 rounded-xl">
                                        <p className="font-bold">{msg.link.title}</p>
                                        <p className="text-xs opacity-80">{msg.link.url}</p>
                                        {msg.text && <p className="pt-2 text-sm">{msg.text}</p>}
                                    </a>
                                )}
                                {msg.type === 'audio' && msg.audioUrl && msg.audioInfo && (
                                    <div className="p-3 space-y-2">
                                        {msg.text && <p className="px-1 text-sm">{msg.text}</p>}
                                        <div className="bg-black/20 p-2 rounded-lg">
                                            <audio controls src={msg.audioUrl} className="w-full h-8 inbox-audio-player"></audio>
                                        </div>
                                    </div>
                                )}
                                {msg.type === 'text' && <p className="p-2">{msg.text}</p>}
                            </div>
                        </div>
                     )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Smart Replies */}
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


            {/* Input Area */}
            <div className="relative p-4 bg-zinc-900/70 backdrop-blur-sm border-t border-zinc-700/50">
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
    );
};

const Inbox: React.FC<InboxProps> = ({ conversations, bookings, onSendMessage, selectedConversationId, onSelectConversation, currentUser, onNavigate, smartReplies, isSmartRepliesLoading, onFetchSmartReplies }) => {
    
    useEffect(() => {
        if(selectedConversationId) {
            const convo = conversations.find(c => c.id === selectedConversationId);
            if (convo) {
                onFetchSmartReplies(convo.messages);
            }
        }
    }, [selectedConversationId, conversations, onFetchSmartReplies]);
    
    const selectedConversation = selectedConversationId ? conversations.find(c => c.id === selectedConversationId) : null;
    const associatedBooking = selectedConversation?.bookingId ? bookings.find(b => b.id === selectedConversation.bookingId) : null;
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const showDetailView = isMobile && selectedConversation;
    const showListView = !isMobile || !selectedConversation;

    return (
        <div className="h-[calc(100vh-128px)] bg-zinc-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-zinc-700/50 flex overflow-hidden animate-fade-in">
            {showListView && (
                 <div className={`w-full md:w-1/3 lg:w-1/4 ${showDetailView ? 'hidden md:block' : ''}`}>
                    <ConversationList
                        conversations={conversations}
                        onSelect={onSelectConversation}
                        selectedConversationId={selectedConversationId}
                    />
                </div>
            )}
            
            <div className={`flex-grow ${!showListView ? 'w-full' : 'hidden md:block'}`}>
                {selectedConversation ? (
                    <ChatThread
                        conversation={selectedConversation}
                        booking={associatedBooking || null}
                        currentUser={currentUser}
                        onSendMessage={onSendMessage}
                        onBack={() => onSelectConversation(null)}
                        onNavigate={onNavigate}
                        smartReplies={smartReplies}
                        isSmartRepliesLoading={isSmartRepliesLoading}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center bg-zinc-900">
                        <div className="text-center text-zinc-500">
                            <p className="text-lg font-semibold">Select a conversation</p>
                            <p>Start chatting with your connections.</p>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                .inbox-audio-player::-webkit-media-controls-panel { background-color: rgba(0,0,0,0.3); border-radius: 8px; }
                 .inbox-audio-player::-webkit-media-controls-play-button,
                 .inbox-audio-player::-webkit-media-controls-current-time-display,
                 .inbox-audio-player::-webkit-media-controls-time-remaining-display,
                 .inbox-audio-player::-webkit-media-controls-mute-button,
                 .inbox-audio-player::-webkit-media-controls-volume-slider,
                 .inbox-audio-player::-webkit-media-controls-timeline { color: white; }
            `}</style>
        </div>
    );
};

export default Inbox;