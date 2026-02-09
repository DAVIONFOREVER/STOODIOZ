
import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useProfile } from './useProfile';
import { moderatePostContent, fetchLinkMetadata } from '../services/geminiService';
import * as apiService from '../services/apiService';
import { logBackgroundError } from '../utils/backgroundLogger';
import type { LinkAttachment } from '../types';
import { UserRole } from '../types';
import { ARIA_EMAIL } from '../constants';

export const useSocial = () => {
    const dispatch = useAppDispatch();
    const { refreshCurrentUser } = useProfile();
    const { currentUser, userRole, notifications, artists, engineers, producers, stoodioz, labels } = useAppState();

    const allUsers = useMemo(
        () => [...artists, ...engineers, ...producers, ...stoodioz, ...labels],
        [artists, engineers, producers, stoodioz, labels]
    );
    
    const toggleFollow = useCallback(async (type: 'stoodio' | 'engineer' | 'artist' | 'producer' | 'label', id: string) => {
        if (!currentUser) return;
        
        // 1. OPTIMISTIC UPDATE: Calculate new state immediately
        const targetUser = allUsers.find(u => u.id === id || u.profile_id === id);
        const targetId = String(targetUser?.profile_id || id || targetUser?.id || '');
        if (!targetId) return;
        
        const defaultFollowing = { artists: [], engineers: [], producers: [], stoodioz: [], labels: [] };
        const followingState = (currentUser as any).following || defaultFollowing;
        const key = `${type}s` as keyof typeof defaultFollowing;
        const isFollowing = (followingState[key] || []).includes(targetId);
        const isAria = targetUser?.email === ARIA_EMAIL;
        if (isAria && isFollowing) {
            alert('Aria is always followed.');
            return;
        }

        // Create optimistic copy
        const optimisticUser = { ...currentUser };
        const currentList = followingState[key] || [];
        
        optimisticUser.following = {
            ...defaultFollowing,
            ...followingState,
            [key]: isFollowing
                ? currentList.filter((uid: string) => uid !== targetId)
                : [...currentList, targetId]
        };
        // Dispatch update immediately
        dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: optimisticUser } });

        // 2. Perform API Call in Background
        try {
            const myProfileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            const result = await apiService.toggleFollow(myProfileId, targetId);
            // 3. Update the followed user (User 2) in state so their follower count/list updates immediately
            if (targetUser && result) {
                const prevIds = (targetUser as any).follower_ids || [];
                const prevCount = (targetUser as any).followers ?? prevIds.length;
                const myId = myProfileId;
                const updatedTarget = { ...targetUser } as any;
                if (result.following) {
                    updatedTarget.follower_ids = prevIds.includes(myId) ? prevIds : [...prevIds, myId];
                    updatedTarget.followers = prevCount + (prevIds.includes(myId) ? 0 : 1);
                } else {
                    updatedTarget.follower_ids = prevIds.filter((id: string) => id !== myId);
                    updatedTarget.followers = Math.max(0, prevCount - (prevIds.includes(myId) ? 1 : 0));
                }
                dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: [updatedTarget] } });
            }
            // 4. Refetch current user so follow state persists (refreshCurrentUser now fetches follow data from server)
            if (result && refreshCurrentUser) refreshCurrentUser();
        } catch(error) {
            console.error("Failed to toggle follow:", error);
            // Revert on error
            dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: currentUser } });
            alert("Failed to update follow status.");
        }
    }, [currentUser, allUsers, dispatch, refreshCurrentUser]);

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

            const profileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            if (postData.imageFile) {
                try {
                    const uploaded = await apiService.uploadPostAttachment(profileId, postData.imageFile);
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
                    const uploaded = await apiService.uploadPostAttachment(profileId, postData.videoFile);
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

            const { updatedAuthor } = await apiService.createPostWithAuthor(finalPostData, currentUser, roleToUse);
            const updatedUsers = allUsers.map(u => u.id === updatedAuthor.id || u.profile_id === updatedAuthor.profile_id ? { ...u, ...updatedAuthor } : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
        } catch(error) {
            console.error("Failed to create post:", error);
            logBackgroundError('useSocial.createPost', 'create post failed', error);
            alert("Failed to create post. Please try again.");
        }
    }, [currentUser, userRole, allUsers, dispatch]);
    
    const likePost = useCallback(async (postId: string) => {
        if (!currentUser) return;
        const author = allUsers.find(u => (u.posts || []).some((p: any) => p.id === postId));
        if (!author) return;

        try {
            const profileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            await apiService.likePost(postId, profileId);
            // Keep author in list; like count can refresh on next feed load
            const updatedAuthor = { ...author };
            const updatedUsers = allUsers.map(u => u.id === author.id || u.profile_id === author.profile_id ? { ...u, ...updatedAuthor } : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
        } catch(error) {
            console.error("Failed to like post:", error);
        }
    }, [currentUser, allUsers, dispatch]);
    
    const commentOnPost = useCallback(async (postId: string, text: string) => {
        if (!currentUser) return;
        const postAuthor = allUsers.find(u => (u.posts || []).some((p: any) => p.id === postId));
        if (!postAuthor) return;

        try {
            const profileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            await apiService.commentOnPost(postId, profileId, text);
            const updatedUsers = allUsers.map(u => u.id === postAuthor.id || u.profile_id === postAuthor.profile_id ? { ...u, ...postAuthor } : u);
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
