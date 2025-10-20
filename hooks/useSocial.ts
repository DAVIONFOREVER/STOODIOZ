

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
    }, [currentUser, allUsers]);

    const createPost = useCallback(async (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => {
        if (!currentUser || !userRole) return;
        const moderationResult = await moderatePostContent(postData.text);
        if (!moderationResult.isSafe) return;
        // FIX: apiService.createPost takes 3 arguments and returns the updated author.
        const updatedAuthor = await apiService.createPost(postData, currentUser, userRole);
        const updatedUsers = allUsers.map(u => u.id === updatedAuthor.id ? updatedAuthor : u);
        updateAllUserState(updatedUsers);
    }, [currentUser, userRole, allUsers]);
    
    const likePost = useCallback(async (postId: string) => {
        if (!currentUser) return;
        // FIX: apiService.likePost needs authorId and authorType, which we find first.
        let author, authorType;
        for (const user of allUsers) {
            const post = (user.posts || []).find(p => p.id === postId);
            if (post) {
                author = user;
                if ('amenities' in user) authorType = 'STOODIO' as UserRole;
                else if ('specialties' in user) authorType = 'ENGINEER' as UserRole;
                else if ('instrumentals' in user) authorType = 'PRODUCER' as UserRole;
                else authorType = 'ARTIST' as UserRole;
                break;
            }
        }
        if (author && authorType) {
            const updatedAuthor = await apiService.likePost(postId, currentUser.id, author.id, authorType);
            const updatedUsers = allUsers.map(u => u.id === author!.id ? updatedAuthor : u);
            updateAllUserState(updatedUsers);
        }
    }, [currentUser, allUsers]);
    
    const commentOnPost = useCallback(async (postId: string, text: string) => {
        if (!currentUser) return;
        // FIX: apiService.commentOnPost needs the post author's ID and type.
        let postAuthor, postAuthorType;
        for (const user of allUsers) {
            const post = (user.posts || []).find(p => p.id === postId);
            if (post) {
                postAuthor = user;
                if ('amenities' in user) postAuthorType = 'STOODIO' as UserRole;
                else if ('specialties' in user) postAuthorType = 'ENGINEER' as UserRole;
                else if ('instrumentals' in user) postAuthorType = 'PRODUCER' as UserRole;
                else postAuthorType = 'ARTIST' as UserRole;
                break;
            }
        }
        if (postAuthor && postAuthorType) {
            const updatedAuthor = await apiService.commentOnPost(postId, text, currentUser, postAuthor.id, postAuthorType);
            const updatedUsers = allUsers.map(u => u.id === postAuthor!.id ? updatedAuthor : u);
            updateAllUserState(updatedUsers);
        }
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