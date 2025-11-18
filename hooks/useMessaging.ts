import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { generateSmartReplies } from '../services/geminiService';
import type { Message, Artist, Engineer, Stoodio, Producer } from '../types';

export const useMessaging = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();
    const { currentUser, conversations } = useAppState();

    const fetchSmartReplies = useCallback(async (messages: Message[]) => {
        if (!currentUser) return;
        dispatch({ type: ActionTypes.SET_IS_SMART_REPLIES_LOADING, payload: { isLoading: true } });
        try {
            const replies = await generateSmartReplies(messages, currentUser.id);
            dispatch({ type: ActionTypes.SET_SMART_REPLIES, payload: { replies }});
        } catch (error) {
            console.error("Failed to fetch smart replies:", error);
            dispatch({ type: ActionTypes.SET_SMART_REPLIES, payload: { replies: [] }});
        } finally {
            dispatch({ type: ActionTypes.SET_IS_SMART_REPLIES_LOADING, payload: { isLoading: false } });
        }
    }, [currentUser, dispatch]);

    const sendMessage = useCallback((conversationId: string, messageContent: Omit<Message, 'id' | 'senderId' | 'timestamp'>) => {
        if (!currentUser) return;
        const newMessage: Message = { ...messageContent, id: `msg-${Date.now()}`, senderId: currentUser.id, timestamp: new Date().toISOString() };
        const updatedConversations = conversations.map(convo => 
            convo.id === conversationId ? { ...convo, messages: [...convo.messages, newMessage], unreadCount: 0 } : convo
        );
        dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });
    }, [currentUser, conversations, dispatch]);

    const startConversation = useCallback((participant: Artist | Engineer | Stoodio | Producer) => {
        if (!currentUser) return;
        if (participant.id === 'artist-aria-cantata') {
            dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
            return;
        }
        const existingConvo = conversations.find(c => c.participants.length === 2 && c.participants.every(p => [currentUser.id, participant.id].includes(p.id)));
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
        if (existingConvo) {
            dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId: existingConvo.id } });
            navigate('INBOX');
        } else {
            // FIX: Changed `imageUrl` to `image_url` to match the Conversation type definition.
            const newConversation = { id: `convo-${currentUser.id}-${participant.id}`, participants: [currentUser, participant], messages: [], unreadCount: 0, title: participant.name, image_url: participant.image_url };
            dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: [newConversation, ...conversations] }});
            dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId: newConversation.id } });
            navigate('INBOX');
        }
    }, [currentUser, conversations, dispatch, navigate]);

    const selectConversation = (id: string | null) => {
        if (!id) {
            dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId: null } });
            return;
        }
        const convo = conversations.find(c => c.id === id);
        if (convo?.participants.some(p => p.id === 'artist-aria-cantata')) {
            dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
        } else {
            dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId: id } });
        }
    };

    return { fetchSmartReplies, sendMessage, startConversation, selectConversation };
};