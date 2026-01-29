import React from 'react';
import type { Conversation, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { AppView } from '../types';
import ChatThread from './ChatThread';
import { useAppState } from '../contexts/AppContext';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-5xl h-[80dvh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
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
