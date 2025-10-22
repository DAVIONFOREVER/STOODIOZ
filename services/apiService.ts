import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment } from '../types';
import { BookingStatus, VerificationStatus } from '../types';
import { getSupabase } from '../lib/supabase';

// --- DATA FETCHING (GET Requests) ---

const fetchData = async <T>(tableName: string, query: string = '*'): Promise<T[]> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.error("Supabase client is not initialized.");
        return [];
    }
    try {
        const { data, error } = await supabase.from(tableName).select(query);
        if (error) {
            console.error(`Error fetching from ${tableName}:`, error.message);
            throw error;
        }
        return data as T[];
    } catch (error: any) {
        console.error(`API service error for ${tableName}:`, error.message);
        return [];
    }
};

// Fetch main data and related nested data.
// - Use plural table names for main entities (e.g., 'stoodioz', 'reviews').
// - Use plural table names for related entities (e.g., 'rooms', 'instrumentals') for convention.
// - Explicitly define relationships (e.g., 'posts!artist_id(*)') to resolve ambiguity or non-conventional FK names.
export const fetchStoodioz = (): Promise<Stoodio[]> => fetchData<Stoodio>('stoodioz', '*, rooms!stoodio_id(*), in_house_engineers!stoodio_id(*)');
export const fetchArtists = (): Promise<Artist[]> => fetchData<Artist>('artists', '*, posts!artist_id(*)');
export const fetchEngineers = (): Promise<Engineer[]> => fetchData<Engineer>('engineers', '*, posts!engineer_id(*), mixing_samples!engineer_id(*)');
export const fetchProducers = (): Promise<Producer[]> => fetchData<Producer>('producers', '*, posts!producer_id(*), instrumentals!producer_id(*)');
export const fetchReviews = (): Promise<Review[]> => fetchData<Review>('reviews', '*');


// --- DATA MUTATIONS (Simulated POST, PUT, DELETE Requests) ---

export const createBooking = async (
    bookingRequest: BookingRequest,
    stoodio: Stoodio | undefined,
    currentUser: Artist | Engineer | Stoodio | Producer,
    userRole: UserRole,
    engineers: Engineer[],
    producers: Producer[]
): Promise<Booking> => {
    // This logic mimics the original mock to determine status and assign engineers for "Find Available"
    let status = BookingStatus.PENDING;
    let engineer: Engineer | null = null;

    if (bookingRequest.mixingDetails?.type === 'REMOTE') {
         status = BookingStatus.PENDING_APPROVAL;
    } else {
        if (bookingRequest.requestType === 'BRING_YOUR_OWN' || !!bookingRequest.producerId) status = BookingStatus.CONFIRMED;
        else if (bookingRequest.requestType === 'SPECIFIC_ENGINEER') status = BookingStatus.PENDING_APPROVAL;
        else status = BookingStatus.CONFIRMED;
    }
    
    if (status === BookingStatus.CONFIRMED && bookingRequest.requestType === 'FIND_AVAILABLE') {
        engineer = engineers.find(e => e.isAvailable) || null;
    }

    const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        ...bookingRequest,
        stoodio,
        engineer,
        producer: bookingRequest.producerId ? producers.find(p => p.id === bookingRequest.producerId) || null : null,
        artist: userRole === 'ARTIST' ? (currentUser as Artist) : null,
        status,
        requestedEngineerId: bookingRequest.requestedEngineerId || null,
        bookedById: currentUser.id,
        bookedByRole: userRole,
    };
    
    // In a real app, this would be an API call. Here we just return the new object.
    return newBooking;
};

export const endSession = async (booking: Booking): Promise<{ updatedBooking: Booking }> => {
    const updatedBooking = { ...booking, status: BookingStatus.COMPLETED };
    return { updatedBooking };
};

export const cancelBooking = async (booking: Booking): Promise<{ updatedBookings: Booking[] }> => {
    const updatedBooking = { ...booking, status: BookingStatus.CANCELLED };
    return { updatedBookings: [updatedBooking] };
};

export const addTip = async (booking: Booking, tipAmount: number): Promise<{ updatedBookings: Booking[] }> => {
    const updatedBooking = { ...booking, tip: tipAmount };
    return { updatedBookings: [updatedBooking] };
};

export const toggleFollow = async (currentUser: any, targetId: string, targetType: 'artist' | 'engineer' | 'stoodio' | 'producer'): Promise<any[]> => {
    const listKey = `${targetType}s`;
    const isFollowing = (currentUser.following[listKey] || []).includes(targetId);
    
    let newFollowingList;
    if (isFollowing) {
        newFollowingList = (currentUser.following[listKey] || []).filter((id: string) => id !== targetId);
    } else {
        newFollowingList = [...(currentUser.following[listKey] || []), targetId];
    }
    
    const newFollowing = { ...currentUser.following, [listKey]: newFollowingList };
    const updatedUser = { ...currentUser, following: newFollowing };

    return [updatedUser];
};

export const createPost = async (postData: { text: string; imageUrl?: string; link?: any }, author: any, authorType: UserRole): Promise<any> => {
    const newPost: Post = { 
        id: `post-${Date.now()}`,
        authorId: author.id, 
        authorType, 
        timestamp: new Date().toISOString(), 
        likes: [], 
        comments: [],
        ...postData, 
    };

    const newPosts = [newPost, ...(author.posts || [])];
    return { ...author, posts: newPosts };
};

export const likePost = async (postId: string, userId: string, author: any): Promise<any> => {
    const postToUpdate = (author.posts || []).find((p: Post) => p.id === postId);
    if (!postToUpdate) return author;

    const newLikes = postToUpdate.likes.includes(userId)
        ? postToUpdate.likes.filter((id: string) => id !== userId)
        : [...postToUpdate.likes, userId];

    const updatedPosts = author.posts.map((p: Post) => p.id === postId ? { ...p, likes: newLikes } : p);
    return { ...author, posts: updatedPosts };
};

export const commentOnPost = async (postId: string, commentText: string, commentAuthor: any, postAuthor: any): Promise<any> => {
    const newComment: Comment = { 
        id: `comment-${Date.now()}`, 
        authorId: commentAuthor.id, 
        authorName: commentAuthor.name, 
        authorImageUrl: commentAuthor.imageUrl, 
        text: commentText, 
        timestamp: new Date().toISOString() 
    };

    const updatedPosts = postAuthor.posts.map((p: Post) => 
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    );
    return { ...postAuthor, posts: updatedPosts };
};

export const respondToBooking = async (booking: Booking, action: 'accept' | 'deny', engineer: Engineer): Promise<{ updatedBooking: Booking }> => {
    const status = action === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
    const updatedBooking = { ...booking, status, engineer: action === 'accept' ? engineer : null };
    return { updatedBooking };
};

export const submitForVerification = async (stoodioId: string, verificationData: { googleBusinessProfileUrl: string; websiteUrl: string }): Promise<{ temporaryStoodio: Partial<Stoodio> }> => {
    // Simulate the API call, return a pending status for optimistic UI update.
    return { temporaryStoodio: { ...verificationData, verificationStatus: VerificationStatus.PENDING } };
};