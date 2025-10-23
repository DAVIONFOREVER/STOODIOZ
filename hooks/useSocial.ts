import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { moderatePostContent } from '../services/geminiService';
import * as apiService from '../services/apiService';
import type { LinkAttachment } from '../types';

export const useSocial = () => {
    const dispatch = useAppDispatch();
    const { currentUser, userRole, notifications, artists, engineers, producers, stoodioz } = useAppState();

    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);
    
    const toggleFollow = useCallback(async (type: 'stoodio' | 'engineer' | 'artist' | 'producer', id: string) => {
        if (!currentUser) return;
        try {
            const { updatedCurrentUser, updatedTargetUser } = await apiService.toggleFollow(currentUser, id, type, allUsers);
            if (!updatedTargetUser) {
                const newAllUsers = allUsers.map(u => (u.id === updatedCurrentUser.id ? updatedCurrentUser : u));
                dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: newAllUsers } });
                return;
            }

            const newAllUsers = allUsers.map(u => {
                if (u.id === updatedCurrentUser.id) return updatedCurrentUser;
                if (u.id === updatedTargetUser.id) return updatedTargetUser;
                return u;
            });
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: newAllUsers } });
        } catch(error) {
            console.error("Failed to toggle follow:", error);
        }
    }, [currentUser, allUsers, dispatch]);

    const createPost = useCallback(async (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => {
        if (!currentUser || !userRole) return;
        try {
            const moderationResult = await moderatePostContent(postData.text);
            if (!moderationResult.isSafe) {
                alert(`Post cannot be created: ${moderationResult.reason}`);
                return;
            }
            const updatedAuthor = await apiService.createPost(postData, currentUser, userRole);
            const updatedUsers = allUsers.map(u => u.id === updatedAuthor.id ? updatedAuthor : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
        } catch(error) {
            console.error("Failed to create post:", error);
        }
    }, [currentUser, userRole, allUsers, dispatch]);
    
    const likePost = useCallback(async (postId: string) => {
        if (!currentUser) return;
        const author = allUsers.find(u => (u.posts || []).some(p => p.id === postId));
        if (!author) return;

        try {
            const updatedAuthor = await apiService.likePost(postId, currentUser.id, author);
            const updatedUsers = allUsers.map(u => u.id === author.id ? updatedAuthor : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
        } catch(error) {
            console.error("Failed to like post:", error);
        }
    }, [currentUser, allUsers, dispatch]);
    
    const commentOnPost = useCallback(async (postId: string, text: string) => {
        if (!currentUser) return;
        const postAuthor = allUsers.find(u => (u.posts || []).some(p => p.id === postId));
        if (!postAuthor) return;

        try {
            const updatedAuthor = await apiService.commentOnPost(postId, text, currentUser, postAuthor);
            const updatedUsers = allUsers.map(u => u.id === postAuthor.id ? updatedAuthor : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
        } catch(error) {
            console.error("Failed to comment on post:", error);
        }
    }, [currentUser, allUsers, dispatch]);

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
