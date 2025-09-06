import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, Message } from '../types';
import { ChevronLeftIcon, PaperAirplaneIcon, PlusCircleIcon, PhotoIcon, LinkIcon, CloseIcon, MusicNoteIcon } from './icons';
import { formatDistanceToNow } from 'date-fns';

interface InboxProps {
    conversations: Conversation[];
    onSendMessage: (conversationId: string, messageContent: Omit<Message, 'id' | 'senderId' | 'timestamp'>) => void;
    selectedConversationId: string | null;
    onSelectConversation: (id: string | null) => void;
}

const ConversationList: React.FC<{
    conversations: Conversation[];
    onSelect: (id: string) => void;
    selectedConversationId: string | null;
}> = ({ conversations, onSelect, selectedConversationId }) => {
    return (
        <div className="border-r border-zinc-700 h-full overflow-y-auto">
            <div className="p-4 border-b border-zinc-700">
                <h2 className="text-2xl font-bold text-slate-100">Inbox</h2>
            </div>
            <ul>
                {conversations.map(convo => {
                    const lastMessage = convo.messages[convo.messages.length - 1];
                    let lastMessageText = 'No messages yet';
                    if (lastMessage) {
                        switch (lastMessage.type) {
                            case 'image':
                                lastMessageText = 'Sent an image';
                                break;
                            case 'link':
                                lastMessageText = 'Sent a link';
                                break;
                            case 'audio':
                                lastMessageText = 'Sent a music file';
                                break;
                            default:
                                lastMessageText = lastMessage.text || '';
                        }
                    }

                    const isSelected = convo.id === selectedConversationId;
                    return (
                        <li key={convo.id} onClick={() => onSelect(convo.id)}>
                            <div className={`p-4 flex items-center gap-4 cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-orange-500/10' : 'hover:bg-zinc-700/50'}`}>
                                <div className="relative flex-shrink-0">
                                    <img src={convo.participant.imageUrl} alt={convo.participant.name} className="w-14 h-14 rounded-xl object-cover"/>
                                    {convo.unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-orange-500 ring-2 ring-zinc-800"></span>
                                    )}
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-slate-100 truncate">{convo.participant.name}</p>
                                        {lastMessage && <p className="text-xs text-slate-400 flex-shrink-0">{formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })}</p>}
                                    </div>
                                    <p className="text-sm text-slate-400 truncate">{lastMessageText}</p>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

const LinkModal: React.FC<{
    onSendLink: (title: string, url: string) => void;
    onClose: () => void;
}> = ({ onSendLink, onClose }) => {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && url.trim()) {
            onSendLink(title, url);
        }
    };

    return (
        <div className="absolute bottom-20 left-4 right-4 z-20">
            <form onSubmit={handleSubmit} className="bg-zinc-900 p-4 rounded-lg border border-zinc-700 shadow-xl">
                <h4 className="font-semibold text-center mb-2">Send a Link</h4>
                 <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Link Title"
                    className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-md p-2 mb-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
                 <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-md p-2 mb-3 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
                 <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-zinc-600 hover:bg-zinc-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm rounded-md bg-orange-500 hover:bg-orange-600 text-white">Send</button>
                </div>
            </form>
        </div>
    );
}

const ChatThread: React.FC<{
    conversation: Conversation;
    onSendMessage: (conversationId: string, messageContent: Omit<Message, 'id' | 'senderId' | 'timestamp'>) => void;
    onBack: () => void;
}> = ({ conversation, onSendMessage, onBack }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
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

    const handleSendPhoto = () => {
        onSendMessage(conversation.id, {
            type: 'image',
            imageUrl: `https://picsum.photos/seed/chatimg${Date.now()}/400/300`,
            text: 'Here is the photo you requested.'
        });
        setIsAttachmentMenuOpen(false);
    };

    const handleSendMusic = () => {
        onSendMessage(conversation.id, {
            type: 'audio',
            text: 'Here is the track.',
            audioUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3',
            audioInfo: {
                filename: 'new_track_demo.mp3',
                duration: '0:28'
            }
        });
        setIsAttachmentMenuOpen(false);
    };

    const handleSendLink = (title: string, url: string) => {
        onSendMessage(conversation.id, {
            type: 'link',
            link: { title, url },
            text: `Check this out: ${title}`
        });
        setIsLinkModalOpen(false);
        setIsAttachmentMenuOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-zinc-800">
            {/* Header */}
            <div className="flex items-center gap-4 p-3 border-b border-zinc-700 bg-zinc-800 sticky top-0 z-10">
                <button onClick={onBack} className="md:hidden p-2 rounded-full hover:bg-zinc-700">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <img src={conversation.participant.imageUrl} alt={conversation.participant.name} className="w-10 h-10 rounded-xl object-cover" />
                <h3 className="font-bold text-lg text-slate-100">{conversation.participant.name}</h3>
            </div>
            
            {/* Messages */}
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {conversation.messages.length === 0 && (
                    <div className="text-center text-slate-500 text-sm mt-8">
                        This is the beginning of your conversation.
                    </div>
                )}
                {conversation.messages.map(msg => {
                     const isUser = msg.senderId === 'artist-user';
                     return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && <img src={conversation.participant.imageUrl} className="w-6 h-6 rounded-xl self-start"/>}
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-1 rounded-2xl ${isUser ? 'bg-orange-500 text-white rounded-br-lg' : 'bg-zinc-700 text-slate-100 rounded-bl-lg'}`}>
                                {msg.type === 'image' && msg.imageUrl && (
                                    <div className="p-2">
                                        <img src={msg.imageUrl} alt={msg.text || 'Sent image'} className="rounded-xl w-full h-auto" />
                                        {msg.text && <p className="pt-2 px-1 text-sm">{msg.text}</p>}
                                    </div>
                                )}
                                {msg.type === 'link' && msg.link && (
                                    <a href={msg.link.url} target="_blank" rel="noopener noreferrer" className="block p-3 hover:bg-black/10 rounded-xl">
                                        <p className="font-bold">{msg.link.title}</p>
                                        <p className="text-xs opacity-80">{msg.link.url}</p>
                                        {msg.text && <p className="pt-2 text-sm">{msg.text}</p>}
                                    </a>
                                )}
                                {msg.type === 'audio' && msg.audioUrl && msg.audioInfo && (
                                    <div className="p-3 space-y-2">
                                        {msg.text && <p className="px-1 text-sm">{msg.text}</p>}
                                        <div className="bg-black/20 p-2 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MusicNoteIcon className="w-5 h-5 flex-shrink-0" />
                                                <span className="font-semibold text-sm truncate">{msg.audioInfo.filename}</span>
                                            </div>
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

            {/* Input Area */}
            <div className="relative p-4 bg-zinc-800 border-t border-zinc-700">
                {isLinkModalOpen && <LinkModal onSendLink={handleSendLink} onClose={() => setIsLinkModalOpen(false)} />}
                {isAttachmentMenuOpen && !isLinkModalOpen && (
                    <div className="absolute bottom-20 left-4 bg-zinc-900 p-2 rounded-lg border border-zinc-700 shadow-xl flex flex-col gap-1 z-20">
                        <button onClick={handleSendPhoto} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700">
                            <PhotoIcon className="w-5 h-5 text-slate-300" /> Send Photo
                        </button>
                         <button onClick={() => setIsLinkModalOpen(true)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700">
                            <LinkIcon className="w-5 h-5 text-slate-300" /> Send Link
                        </button>
                        <button onClick={handleSendMusic} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-zinc-700">
                            <MusicNoteIcon className="w-5 h-5 text-slate-300" /> Send Music
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                     <button type="button" onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)} className="text-slate-400 hover:text-orange-400 p-2">
                        <PlusCircleIcon className="w-7 h-7" />
                    </button>
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-zinc-700 border-transparent text-slate-200 rounded-full p-3 px-5 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button type="submit" className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition-colors flex-shrink-0 disabled:bg-slate-600" disabled={!newMessage.trim()}>
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    )
}

const Inbox: React.FC<InboxProps> = ({ conversations, onSendMessage, selectedConversationId, onSelectConversation }) => {

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-xl border border-zinc-700 h-[calc(100vh-12rem)] overflow-hidden flex">
            {/* Desktop: List always visible */}
            <div className={`w-full md:w-1/3 flex-shrink-0 ${selectedConversationId ? 'hidden md:block' : 'block'}`}>
                <ConversationList 
                    conversations={conversations}
                    onSelect={onSelectConversation}
                    selectedConversationId={selectedConversationId}
                />
            </div>

             {/* Main content area */}
            <div className={`flex-grow h-full ${selectedConversationId ? 'block' : 'hidden md:hidden'}`}>
                {selectedConversation ? (
                    <ChatThread 
                        conversation={selectedConversation}
                        onSendMessage={onSendMessage}
                        onBack={() => onSelectConversation(null)}
                    />
                ) : (
                    <div className="h-full hidden md:flex items-center justify-center text-slate-500">
                        <p>Select a conversation to start chatting.</p>
                    </div>
                )}
            </div>
             <style>{`
                .inbox-audio-player::-webkit-media-controls-panel {
                  background-color: transparent;
                }
                .inbox-audio-player::-webkit-media-controls-play-button,
                .inbox-audio-player::-webkit-media-controls-current-time-display,
                .inbox-audio-player::-webkit-media-controls-time-remaining-display,
                .inbox-audio-player::-webkit-media-controls-timeline,
                .inbox-audio-player::-webkit-media-controls-mute-button {
                  filter: invert(0.9);
                }
            `}</style>
        </div>
    );
};

export default Inbox;