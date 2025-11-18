import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { generateSmartReplies } from '../services/geminiService';
import type { Message, Artist, Engineer, Stoodio, Producer } from '../types';
import { AppView } from '../types';

export const useMessaging = (navigate: (view: AppView) => void) => {
    const dispatch = useAppDispatch();
    const { currentUser, conversations } = useAppState();

    const fetchSmartReplies = useCallback(async (messages: Message[]) => {
        if (!currentUser) return;
        dispatch({ type: ActionTypes.SET_IS_SMART_REPLIES_LOADING, payload: { isLoading: true } });
        try {
            const replies = await generateSmartReplies(messages, currentUser.id);
            dispatch({ type: ActionTypes.SET_SMART_REPLIES, payload: { replies } });
        } catch (error) {
            console.error("Failed to fetch smart replies", error);
        } finally {
            dispatch({ type: ActionTypes.SET_IS_SMART_REPLIES_LOADING, payload: { isLoading: false } });
        }
    }, [currentUser, dispatch]);

    const startConversation = useCallback((participant: Artist | Engineer | Stoodio | Producer) => {
        if (!currentUser) return;
        
        // Check if conversation already exists
        const existingConvo = conversations.find(c => 
            c.participants.some(p => p.id === participant.id) && 
            c.participants.some(p => p.id === currentUser.id)
        );

        if (existingConvo) {
            dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId: existingConvo.id } });
        } else {
            // Create new conversation object (optimistic)
            const newConversation = {
                id: `convo-${Date.now()}`,
                participants: [currentUser, participant],
                messages: [],
                unread_count: 0
            };
            dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: [newConversation, ...conversations] } });
            dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId: newConversation.id } });
        }
        navigate(AppView.INBOX);
    }, [conversations, currentUser, dispatch, navigate]);

    const sendMessage = useCallback((conversationId: string, messageContent: Omit<Message, 'id' | 'sender_id' | 'timestamp'>) => {
        if (!currentUser) return;

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            sender_id: currentUser.id,
            timestamp: new Date().toISOString(),
            ...messageContent
        };

        const updatedConversations = conversations.map(c => {
            if (c.id === conversationId) {
                return { ...c, messages: [...c.messages, newMessage] };
            }
            return c;
        });

        dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });
        
        // Generate smart replies for the new context
        const conversation = updatedConversations.find(c => c.id === conversationId);
        if (conversation) {
             fetchSmartReplies(conversation.messages);
        }

    }, [conversations, currentUser, dispatch, fetchSmartReplies]);

    const selectConversation = useCallback((conversationId: string | null) => {
         dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId } });
    }, [dispatch]);

    return { sendMessage, selectConversation, fetchSmartReplies, startConversation };
};