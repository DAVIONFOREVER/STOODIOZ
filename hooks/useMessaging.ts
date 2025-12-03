
import { useCallback, useEffect, useState } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { generateSmartReplies } from '../services/geminiService';
import * as apiService from '../services/apiService';
import type { Message, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { AppView } from '../types';
import { getSupabase } from '../lib/supabase';

export const useMessaging = (navigate: (view: AppView) => void) => {
    const dispatch = useAppDispatch();
    const { currentUser, conversations } = useAppState();
    const [permissionError, setPermissionError] = useState<{ status: string; sender: string; receiver: string } | null>(null);

    // Real-time Message Listener
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase || !currentUser) return;

        // Subscribing to all messages. Row Level Security (RLS) on the backend 
        // will ensure we only receive messages for conversations we are part of.
        const channel = supabase.channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload) => {
                    const newMessageData = payload.new as any;
                    
                    // If we sent it, we likely already updated optimistically 
                    if (newMessageData.sender_id === currentUser.id) return; 

                    // Fetch the latest state of conversations to ensure we append correctly
                    // Ideally we just append to state, but fetching ensures sync
                    const updatedConversations = await apiService.fetchConversations(currentUser.id);
                    dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, dispatch]);

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

    const startConversation = useCallback(async (participant: Artist | Engineer | Stoodio | Producer | Label, initialMessageText?: string) => {
        if (!currentUser) return;
        
        // Check if conversation already exists locally first
        const existingConvo = conversations.find(c => 
            c.participants.some(p => p.id === participant.id) && 
            c.participants.some(p => p.id === currentUser.id)
        );

        let conversationId = existingConvo?.id;

        if (!existingConvo) {
            // Create real conversation in DB
            try {
                const newConvoData = await apiService.createConversation([currentUser.id, participant.id]);
                
                // Handle blocking logic
                if (newConvoData && newConvoData.blocked_by_label_permissions) {
                    setPermissionError({
                        status: newConvoData.reason,
                        sender: newConvoData.sender_id,
                        receiver: newConvoData.receiver_id
                    });
                    return;
                }

                if (newConvoData) {
                    conversationId = newConvoData.id;
                    // Refresh to get the new conversation object with full details
                    const updatedConversations = await apiService.fetchConversations(currentUser.id);
                    dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });
                }
            } catch (e) {
                console.error("Failed to create conversation", e);
                return;
            }
        }

        if (conversationId) {
            dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId } });
            
            if (initialMessageText) {
                await apiService.sendMessage(conversationId, currentUser.id, initialMessageText);
                // Re-fetch to sync the new message
                const updatedConversations = await apiService.fetchConversations(currentUser.id);
                dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });
            }
            navigate(AppView.INBOX);
        }

    }, [conversations, currentUser, dispatch, navigate]);

    const sendMessage = useCallback(async (conversationId: string, messageContent: Omit<Message, 'id' | 'sender_id' | 'timestamp'>) => {
        if (!currentUser) return;

        // Optimistic update
        const tempId = `msg-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            sender_id: currentUser.id,
            timestamp: new Date().toISOString(),
            ...messageContent
        };

        const updatedConversations = conversations.map(c => {
            if (c.id === conversationId) {
                return { ...c, messages: [...c.messages, optimisticMessage] };
            }
            return c;
        });
        dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });

        // API Call
        try {
            const { text, type, files, image_url, audio_url } = messageContent;
            let content = text || '';
            let fileData = null;
            
            if (type === 'files') fileData = files;
            else if (type === 'image') fileData = { url: image_url };
            else if (type === 'audio') fileData = { url: audio_url };

            await apiService.sendMessage(conversationId, currentUser.id, content, type, fileData);
            
            // Trigger smart replies generation
            const conversation = updatedConversations.find(c => c.id === conversationId);
            if (conversation) fetchSmartReplies(conversation.messages);

        } catch (e) {
            console.error("Send failed", e);
            // In a production app, we would revert the optimistic update here
            alert("Message failed to send.");
        }

    }, [conversations, currentUser, dispatch, fetchSmartReplies]);

    const selectConversation = useCallback((conversationId: string | null) => {
         dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId } });
    }, [dispatch]);

    return { sendMessage, selectConversation, fetchSmartReplies, startConversation, permissionError, setPermissionError };
};
