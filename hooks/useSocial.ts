
import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { moderatePostContent } from '../services/geminiService';
import * as apiService from '../services/apiService';
import type { Artist, Engineer, Producer, Stoodio, LinkAttachment } from '../types';

export const useSocial = () => {
    const dispatch = useAppDispatch();
    // FIX: Destructure all user arrays to construct `allUsers`.
    const { currentUser, userRole, notifications, artists, engineers, producers, stoodioz } = useAppState();

    // FIX: Construct allUsers from individual state arrays.
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);
    
    const updateAllUserState = (updatedUsers: any[]) => {
        dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
    };

    const toggleFollow = useCallback(async (type: 'stoodio' | 'engineer' | 'artist' | 'producer', id: string) => {
        if (!currentUser) return;
        const updatedUsers = await apiService.toggleFollow(currentUser, id, type, allUsers);
        updateAllUserState(updatedUsers);
    }, [currentUser, allUsers]);

    const createPost = useCallback(async (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => {
        if (!currentUser || !userRole) return;
        const moderationResult = await moderatePostContent(postData.text);
        if (!moderationResult.isSafe) return;
        const updatedUsers = await apiService.createPost(postData, currentUser, userRole, allUsers);
        updateAllUserState(updatedUsers);
    }, [currentUser, userRole, allUsers]);
    
    const likePost = useCallback(async (postId: string) => {
        if (!currentUser) return;
        const updatedUsers = await apiService.likePost(postId, currentUser.id, allUsers);
        updateAllUserState(updatedUsers);
    }, [currentUser, allUsers]);
    
    const commentOnPost = useCallback(async (postId: string, text: string) => {
        if (!currentUser) return;
        const updatedUsers = await apiService.commentOnPost(postId, text, currentUser, allUsers);
        updateAllUserState(updatedUsers);
    }, [currentUser, allUsers]);

    const markAsRead = useCallback((id: string) => {
        dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: { notifications: notifications.map(n => n.id === id ? { ...n, read: true } : n) }});
    }, [notifications, dispatch]);

    const markAllAsRead = useCallback(() => {
        dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: { notifications: notifications.map(n => ({ ...n, read: true })) }});
    }, [notifications, dispatch]);

    const dismissNotification = (id: string) => {
        dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: { notifications: notifications.filter(n => n.id !== id) }});
    };

    return { toggleFollow, createPost, likePost, commentOnPost, markAsRead, markAllAsRead, dismissNotification };
};
