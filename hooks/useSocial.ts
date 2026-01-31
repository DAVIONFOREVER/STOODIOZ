
import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { moderatePostContent, fetchLinkMetadata } from '../services/geminiService';
import * as apiService from '../services/apiService';
import type { LinkAttachment } from '../types';
import { UserRole } from '../types';

export const useSocial = () => {
    const dispatch = useAppDispatch();
    const { currentUser, userRole, notifications, artists, engineers, producers, stoodioz, labels } = useAppState();

    const allUsers = useMemo(
        () => [...artists, ...engineers, ...producers, ...stoodioz, ...labels],
        [artists, engineers, producers, stoodioz, labels]
    );
    
    const toggleFollow = useCallback(async (type: 'stoodio' | 'engineer' | 'artist' | 'producer' | 'label', id: string) => {
        if (!currentUser) return;
        
        // 1. OPTIMISTIC UPDATE: Calculate new state immediately
        const targetUser = allUsers.find(u => u.id === id);
        const targetId = String(id || targetUser?.profile_id || targetUser?.id || '');
        if (!targetId) return;
        
        let isFollowing = false;
        if ('following' in currentUser) {
             const key = `${type}s` as keyof typeof currentUser.following;
             isFollowing = (currentUser.following[key] || []).includes(targetId);
        }

        // Create optimistic copy
        const optimisticUser = { ...currentUser };
        if ('following' in optimisticUser) {
            const key = `${type}s` as keyof typeof optimisticUser.following;
            const currentList = optimisticUser.following[key] || [];
            
            if (isFollowing) {
                // Unfollow
                optimisticUser.following = {
                    ...optimisticUser.following,
                    [key]: currentList.filter((uid: string) => uid !== targetId)
                };
            } else {
                // Follow
                optimisticUser.following = {
                    ...optimisticUser.following,
                    [key]: [...currentList, targetId]
                };
            }
            // Dispatch update immediately
            dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: optimisticUser } });
        }

        // 2. Perform API Call in Background
        try {
            await apiService.toggleFollow(currentUser.id, targetId);
        } catch(error) {
            console.error("Failed to toggle follow:", error);
            // Revert on error
            dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: currentUser } });
            alert("Failed to update follow status.");
        }
    }, [currentUser, allUsers, dispatch]);

    const createPost = useCallback(async (postData: { text: string; imageFile?: File; imageUrl?: string; videoFile?: File; videoUrl?: string; videoThumbnailUrl?: string; link?: LinkAttachment }, roleOverride?: UserRole) => {
        const roleToUse = roleOverride || userRole;
        if (!currentUser || !roleToUse) return;

        try {
            const moderationResult = await moderatePostContent(postData.text);
            if (!moderationResult.isSafe) {
                alert(`Post cannot be created: ${moderationResult.reason}`);
                return;
            }

            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = postData.text.match(urlRegex);
            let finalPostData: { text: string; image_url?: string; video_url?: string; video_thumbnail_url?: string; link?: LinkAttachment } = { 
                text: postData.text,
                link: postData.link,
                video_thumbnail_url: postData.videoThumbnailUrl
            };

            if (postData.imageFile) {
                try {
                    const uploaded = await apiService.uploadPostAttachment(currentUser.id, postData.imageFile);
                    finalPostData.image_url = uploaded.url;
                } catch (err) {
                    console.error("Failed to upload image:", err);
                    alert("Failed to upload image. Post was not created.");
                    return;
                }
            } else if (postData.imageUrl) {
                finalPostData.image_url = postData.imageUrl;
            }

            if (postData.videoFile) {
                try {
                    const uploaded = await apiService.uploadPostAttachment(currentUser.id, postData.videoFile);
                    finalPostData.video_url = uploaded.url;
                } catch (err) {
                    console.error("Failed to upload video:", err);
                    alert("Failed to upload video. Post was not created.");
                    return;
                }
            } else if (postData.videoUrl) {
                 finalPostData.video_url = postData.videoUrl;
            }

            if (urls && urls[0] && !finalPostData.image_url && !finalPostData.video_url) {
                const metadata = await fetchLinkMetadata(urls[0]);
                if (metadata) {
                    finalPostData.link = metadata;
                }
            }

            const { updatedAuthor } = await apiService.createPost(finalPostData, currentUser, roleToUse);
            const updatedUsers = allUsers.map(u => u.id === updatedAuthor.id ? { ...u, ...updatedAuthor } : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
        } catch(error) {
            console.error("Failed to create post:", error);
            alert("Failed to create post. Please try again.");
        }
    }, [currentUser, userRole, allUsers, dispatch]);
    
    const likePost = useCallback(async (postId: string) => {
        if (!currentUser) return;
        const author = allUsers.find(u => (u.posts || []).some(p => p.id === postId));
        if (!author) return;

        try {
            const updatedAuthor = await apiService.likePost(postId, currentUser.id, author);
            const updatedUsers = allUsers.map(u => u.id === author.id ? { ...u, ...updatedAuthor } : u);
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
            const updatedUsers = allUsers.map(u => u.id === postAuthor.id ? { ...u, ...updatedAuthor } : u);
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
