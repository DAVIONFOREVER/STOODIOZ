import { useCallback, useEffect, useState } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { generateSmartReplies } from '../services/geminiService';
import * as apiService from '../services/apiService';
import type { Message, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { AppView, NotificationType } from '../types';
import { getDisplayName } from '../utils/getDisplayName';
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

                    const myProfileId = (currentUser as any)?.profile_id ?? currentUser?.id;
                    if (!myProfileId) return;
                    // Only refresh for messages from others (normalize IDs so we don't refetch on own send and reset the hub)
                    if (String(newMessage?.sender_id || '').trim() === String(myProfileId).trim()) return;

                    try {
                        const updatedConversations = await apiService.fetchConversations(myProfileId);
                        // Don't replace with empty list — keeps selection and prevents hub from resetting
                        if (!Array.isArray(updatedConversations) || updatedConversations.length === 0) return;
                        dispatch({
                            type: ActionTypes.SET_CONVERSATIONS,
                            payload: { conversations: updatedConversations },
                        });
                        // In-app notification so recipient sees bell + toast (e.g. "Vijeta sent you a message")
                        const conv = updatedConversations.find((c) => c.id === newMessage.conversation_id);
                        const sender = conv?.participants?.find((p: { id: string }) => String(p.id) === String(newMessage.sender_id));
                        const senderName = sender ? getDisplayName(sender, 'Someone') : 'Someone';
                        dispatch({
                            type: ActionTypes.ADD_NOTIFICATION,
                            payload: {
                                notification: {
                                    id: `msg-${newMessage.id}`,
                                    recipient_id: myProfileId,
                                    type: NotificationType.NEW_MESSAGE,
                                    message: `${senderName} sent you a message`,
                                    read: false,
                                    timestamp: new Date().toISOString(),
                                    link: { view: AppView.INBOX, entityId: newMessage.conversation_id },
                                    actor: sender ?? undefined,
                                },
                            },
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

            const myProfileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            const participantProfileId = (participant as any)?.profile_id ?? participant?.id;
            if (!myProfileId || !participantProfileId) return;

            const existingConversation = conversations.find(
                (c) =>
                    c.participants.some((p) => p.id === participantProfileId || p.id === participant.id) &&
                    c.participants.some((p) => p.id === myProfileId || p.id === currentUser.id)
            );

            let conversationId = existingConversation?.id;

            if (!existingConversation) {
                try {
                    const newConversation = await apiService.createConversation([
                        myProfileId,
                        participantProfileId,
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
                        const updated = await apiService.fetchConversations(myProfileId);
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
                    myProfileId,
                    initialMessageText
                );

                const updated = await apiService.fetchConversations(myProfileId);
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

            const myProfileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            if (!myProfileId) return;

            // Optimistic UI update
            const optimisticMessage: Message = {
                id: `tmp-${Date.now()}`,
                sender_id: myProfileId,
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
                    myProfileId,
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

    const unsendMessage = useCallback(
        async (messageId: string) => {
            if (!currentUser) return { ok: false };
            const myProfileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            if (!myProfileId) return { ok: false };
            const result = await apiService.unsendMessage(messageId, myProfileId);
            if (result.ok) {
                const updated = await apiService.fetchConversations(myProfileId);
                dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updated } });
            }
            return result;
        },
        [currentUser, dispatch]
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
        unsendMessage,
        selectConversation,
        fetchSmartReplies,
        startConversation,
        permissionError,
        setPermissionError,
    };
};
