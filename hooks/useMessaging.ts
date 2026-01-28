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
    const [permissionError, setPermissionError] = useState<{
        status: string;
        sender: string;
        receiver: string;
    } | null>(null);

    /**
     * Real-time Message Listener
     * Uses the single global Supabase client.
     * No getSupabase. No null guards. No duplicate clients.
     */
    useEffect(() => {
        if (!currentUser) return;

        const supabase = getSupabase();
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload) => {
                    const newMessage = payload.new as any;

                    // Ignore messages we sent ourselves (optimistic update already handled)
                    if (newMessage.sender_id === currentUser.id) return;

                    try {
                        const updatedConversations = await apiService.fetchConversations(currentUser.id);
                        dispatch({
                            type: ActionTypes.SET_CONVERSATIONS,
                            payload: { conversations: updatedConversations },
                        });
                    } catch (err) {
                        console.error('Failed to refresh conversations', err);
                    }
                }
            )
            .subscribe();

        return () => {
            try {
                supabase.removeChannel(channel);
            } catch (e) {
                console.warn('[useMessaging] removeChannel failed:', e);
            }
        };
    }, [currentUser, dispatch]);

    const fetchSmartReplies = useCallback(
        async (messages: Message[]) => {
            if (!currentUser) return;

            dispatch({
                type: ActionTypes.SET_IS_SMART_REPLIES_LOADING,
                payload: { isLoading: true },
            });

            try {
                const replies = await generateSmartReplies(messages, currentUser.id);
                dispatch({
                    type: ActionTypes.SET_SMART_REPLIES,
                    payload: { replies },
                });
            } catch (error) {
                console.error('Failed to fetch smart replies', error);
            } finally {
                dispatch({
                    type: ActionTypes.SET_IS_SMART_REPLIES_LOADING,
                    payload: { isLoading: false },
                });
            }
        },
        [currentUser, dispatch]
    );

    const startConversation = useCallback(
        async (
            participant: Artist | Engineer | Stoodio | Producer | Label,
            initialMessageText?: string,
            navigateToInbox: boolean = true
        ) => {
            if (!currentUser) return;

            const existingConversation = conversations.find(
                (c) =>
                    c.participants.some((p) => p.id === participant.id) &&
                    c.participants.some((p) => p.id === currentUser.id)
            );

            let conversationId = existingConversation?.id;

            if (!existingConversation) {
                try {
                    const newConversation = await apiService.createConversation([
                        currentUser.id,
                        participant.id,
                    ]);

                    if (newConversation?.blocked_by_label_permissions) {
                        setPermissionError({
                            status: newConversation.reason,
                            sender: newConversation.sender_id,
                            receiver: newConversation.receiver_id,
                        });
                        return;
                    }

                    if (newConversation) {
                        conversationId = newConversation.id;
                        const updated = await apiService.fetchConversations(currentUser.id);
                        dispatch({
                            type: ActionTypes.SET_CONVERSATIONS,
                            payload: { conversations: updated },
                        });
                    }
                } catch (err) {
                    console.error('Failed to create conversation', err);
                    return;
                }
            }

            if (!conversationId) return;

            dispatch({
                type: ActionTypes.SET_SELECTED_CONVERSATION,
                payload: { conversationId },
            });

            if (initialMessageText) {
                await apiService.sendMessage(
                    conversationId,
                    currentUser.id,
                    initialMessageText
                );

                const updated = await apiService.fetchConversations(currentUser.id);
                dispatch({
                    type: ActionTypes.SET_CONVERSATIONS,
                    payload: { conversations: updated },
                });
            }

            if (navigateToInbox) {
                navigate(AppView.INBOX);
            }
        },
        [conversations, currentUser, dispatch, navigate]
    );

    const sendMessage = useCallback(
        async (
            conversationId: string,
            messageContent: Omit<Message, 'id' | 'sender_id' | 'timestamp'>
        ) => {
            if (!currentUser) return;

            // Optimistic UI update
            const optimisticMessage: Message = {
                id: `tmp-${Date.now()}`,
                sender_id: currentUser.id,
                timestamp: new Date().toISOString(),
                ...messageContent,
            };

            const optimisticConversations = conversations.map((c) =>
                c.id === conversationId
                    ? { ...c, messages: [...c.messages, optimisticMessage] }
                    : c
            );

            dispatch({
                type: ActionTypes.SET_CONVERSATIONS,
                payload: { conversations: optimisticConversations },
            });

            try {
                const { text, type, files, image_url, audio_url, video_url, link } = messageContent;

                const payload =
                    type === 'files' ? { files } :
                    type === 'image' ? { image_url } :
                    type === 'audio' ? { audio_url } :
                    type === 'video' ? { video_url } :
                    type === 'link' ? { link } :
                    undefined;

                await apiService.sendMessage(
                    conversationId,
                    currentUser.id,
                    text || '',
                    type,
                    payload
                );

                const conversation = optimisticConversations.find(
                    (c) => c.id === conversationId
                );

                if (conversation) {
                    fetchSmartReplies(conversation.messages);
                }
            } catch (err) {
                console.error('Message send failed', err);
                alert('Message failed to send.');
            }
        },
        [conversations, currentUser, dispatch, fetchSmartReplies]
    );

    const selectConversation = useCallback(
        (conversationId: string | null) => {
            dispatch({
                type: ActionTypes.SET_SELECTED_CONVERSATION,
                payload: { conversationId },
            });
        },
        [dispatch]
    );

    return {
        sendMessage,
        selectConversation,
        fetchSmartReplies,
        startConversation,
        permissionError,
        setPermissionError,
    };
};
