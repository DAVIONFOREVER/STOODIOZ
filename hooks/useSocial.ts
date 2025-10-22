

import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { moderatePostContent } from '../services/geminiService';
import * as apiService from '../services/apiService';
import type { Artist, Engineer, Producer, Stoodio, LinkAttachment, UserRole } from '../types';

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
        // FIX: apiService.toggleFollow takes 3 arguments and only returns the updated current user.
        const updatedCurrentUserArray = await apiService.toggleFollow(currentUser, id, type);
        const updatedCurrentUser = updatedCurrentUserArray[0];

        if (updatedCurrentUser) {
             const listKey = `${type}s` as keyof typeof updatedCurrentUser.following;
            const isNowFollowing = updatedCurrentUser.following[listKey].includes(id);

            const updatedAllUsers = allUsers.map(u => {
                if (u.id === currentUser.id) {
                    return updatedCurrentUser;
                }
                if (u.id === id) {
                    const newFollowerIds = isNowFollowing
                        ? [...u.followerIds, currentUser.id]
                        : u.followerIds.filter(fid => fid !== currentUser.id);
                    return { ...u, followers: newFollowerIds.length, followerIds: newFollowerIds };
                }
                return u;
            });
            updateAllUserState(updatedAllUsers);
        }
    }, [currentUser, allUsers, dispatch]);

    const createPost = useCallback(async (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => {
        if (!currentUser || !userRole) return;
        const moderationResult = await moderatePostContent(postData.text);
        if (!moderationResult.isSafe) return;
        // FIX: apiService.createPost takes 3 arguments and returns the updated author.
        const updatedAuthor = await apiService.createPost(postData, currentUser, userRole);
        const updatedUsers = allUsers.map(u => u.id === updatedAuthor.id ? updatedAuthor : u);
        updateAllUserState(updatedUsers);
    }, [currentUser, userRole, allUsers, dispatch]);
    
    const likePost = useCallback(async (postId: string) => {
        if (!currentUser) return;
        // FIX: Find the author of the post to pass to the API service
        const author = allUsers.find(u => (u.posts || []).some(p => p.id === postId));

        if (author) {
            const updatedAuthor = await apiService.likePost(postId, currentUser.id, author);
            const updatedUsers = allUsers.map(u => u.id === author.id ? updatedAuthor : u);
            updateAllUserState(updatedUsers);
        }
    }, [currentUser, allUsers, dispatch]);
    
    const commentOnPost = useCallback(async (postId: string, text: string) => {
        if (!currentUser) return;
        // FIX: Find the post's author to pass to the API service
        const postAuthor = allUsers.find(u => (u.posts || []).some(p => p.id === postId));

        if (postAuthor) {
            const updatedAuthor = await apiService.commentOnPost(postId, text, currentUser, postAuthor);
            const updatedUsers = allUsers.map(u => u.id === postAuthor.id ? updatedAuthor : u);
            updateAllUserState(updatedUsers);
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
