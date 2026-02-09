import React from 'react';
import type { Conversation, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { AppView } from '../types';
import ChatThread from './ChatThread';
import { useAppState } from '../contexts/AppContext';
import { CloseIcon } from './icons';

interface LiveChatModalProps {
    conversationId: string | null;
    roomTitle: string;
    onClose: () => void;
    currentUser: Artist | Engineer | Stoodio | Producer | Label;
    onSendMessage: (conversationId: string, messageContent: any) => void;
    onNavigate: (view: AppView) => void;
    smartReplies: string[];
    isSmartRepliesLoading: boolean;
}

const LiveChatModal: React.FC<LiveChatModalProps> = ({
    conversationId,
    roomTitle,
    onClose,
    currentUser,
    onSendMessage,
    onNavigate,
    smartReplies,
    isSmartRepliesLoading,
}) => {
    const { conversations } = useAppState();
    const conversation = conversationId ? conversations.find(c => c.id === conversationId) : null;

    if (!conversationId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-5xl h-[80dvh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3 right-3 z-20 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors"
                    aria-label="Close live chat"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
                {conversation ? (
                    <ChatThread
                        conversation={conversation as Conversation}
                        booking={null}
                        currentUser={currentUser}
                        onSendMessage={onSendMessage}
                        onBack={onClose}
                        onNavigate={onNavigate}
                        smartReplies={smartReplies}
                        isSmartRepliesLoading={isSmartRepliesLoading}
                        allowVideoCall={false}
                        titleOverride={roomTitle}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-400">
                        Loading live chat...
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveChatModal;
