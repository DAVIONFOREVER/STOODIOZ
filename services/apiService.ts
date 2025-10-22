import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment } from '../types';
import { BookingStatus, VerificationStatus } from '../types';
import { getSupabase } from '../lib/supabase';

// --- HELPER FUNCTIONS ---

/**
 * Transforms a snake_case object from Supabase to a camelCase object for the frontend.
 * This is a simple implementation and might need to be more robust for nested objects.
 */
const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/([-_][a-z])/ig, ($1) => {
                return $1.toUpperCase().replace('-', '').replace('_', '');
            });
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

/**
 * Transforms a camelCase object from the frontend to a snake_case object for Supabase.
 */
const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = toSnakeCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};


// --- DATA FETCHING (GET Requests) ---

const fetchData = async <T>(tableName: string): Promise<T[]> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { data, error } = await supabase.from(tableName).select('*');
    
    if (error) {
        console.error(`Supabase error in fetch${tableName}:`, error.message);
        throw error;
    }
    
    return toCamelCase(data || []) as T[];
};

export const fetchStoodioz = (): Promise<Stoodio[]> => fetchData<Stoodio>('stoodioz');
export const fetchArtists = (): Promise<Artist[]> => fetchData<Artist>('artists');
export const fetchEngineers = (): Promise<Engineer[]> => fetchData<Engineer>('engineers');
export const fetchProducers = (): Promise<Producer[]> => fetchData<Producer>('producers');
export const fetchReviews = (): Promise<Review[]> => fetchData<Review>('reviews');


// --- DATA MUTATIONS (POST, PUT, DELETE Requests) ---

export const createBooking = async (
    bookingRequest: BookingRequest,
    stoodio: Stoodio | undefined,
    currentUser: Artist | Engineer | Stoodio | Producer,
    userRole: UserRole,
    engineers: Engineer[],
    producers: Producer[]
): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

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
        id: `booking-${Date.now()}`, // Note: In a real app, the DB would generate this
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
    
    // In a real scenario, we would only insert IDs, not nested objects.
    // This simplified version assumes your table structure can handle this or you have triggers.
    const { error } = await supabase.from('bookings').insert([toSnakeCase(newBooking)]);
    if (error) throw error;
    
    return newBooking; // Return the frontend-optimistic object
};

export const endSession = async (booking: Booking): Promise<{ updatedBooking: Booking }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const updatedBooking = { ...booking, status: BookingStatus.COMPLETED };
    const { error } = await supabase.from('bookings').update({ status: BookingStatus.COMPLETED }).eq('id', booking.id);

    if (error) throw error;
    return { updatedBooking };
};

export const cancelBooking = async (booking: Booking): Promise<{ updatedBookings: Booking[] }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const updatedBooking = { ...booking, status: BookingStatus.CANCELLED };
    const { error } = await supabase.from('bookings').update({ status: BookingStatus.CANCELLED }).eq('id', booking.id);
    
    if (error) throw error;
    return { updatedBookings: [updatedBooking] };
};

export const addTip = async (booking: Booking, tipAmount: number): Promise<{ updatedBookings: Booking[] }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const updatedBooking = { ...booking, tip: tipAmount };
    const { error } = await supabase.from('bookings').update({ tip: tipAmount }).eq('id', booking.id);

    if (error) throw error;
    return { updatedBookings: [updatedBooking] };
};

export const toggleFollow = async (currentUser: any, targetId: string, targetType: 'artist' | 'engineer' | 'stoodio' | 'producer'): Promise<any[]> => {
    // This is a complex operation (updating two users).
    // For now, we only update the current user's following list.
    // A real implementation should use a database function (RPC) for atomicity.
    const supabase = getSupabase();
    if (!supabase || !currentUser.userRole) throw new Error("User or Supabase client not initialized.");
    
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

    const userTable = `${currentUser.userRole.toLowerCase()}s`;
    const { error } = await supabase.from(userTable).update({ following: newFollowing }).eq('id', currentUser.id);

    if (error) throw error;
    return [updatedUser];
};

export const createPost = async (postData: { text: string; imageUrl?: string; link?: any }, author: any, authorType: UserRole): Promise<any> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

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
    const updatedAuthor = { ...author, posts: newPosts };

    const userTable = `${authorType.toLowerCase()}s`;
    const { error } = await supabase.from(userTable).update({ posts: newPosts }).eq('id', author.id);

    if (error) throw error;
    return updatedAuthor;
};

export const likePost = async (postId: string, userId: string, author: any): Promise<any> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const postToUpdate = (author.posts || []).find((p: Post) => p.id === postId);
    if (!postToUpdate) return author;

    const newLikes = postToUpdate.likes.includes(userId)
        ? postToUpdate.likes.filter((id: string) => id !== userId)
        : [...postToUpdate.likes, userId];

    const updatedPosts = author.posts.map((p: Post) => p.id === postId ? { ...p, likes: newLikes } : p);
    const updatedAuthor = { ...author, posts: updatedPosts };

    const userTable = `${author.authorType.toLowerCase()}s`;
    const { error } = await supabase.from(userTable).update({ posts: updatedPosts }).eq('id', author.id);

    if (error) throw error;
    return updatedAuthor;
};

export const commentOnPost = async (postId: string, commentText: string, commentAuthor: any, postAuthor: any): Promise<any> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

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
    const updatedAuthor = { ...postAuthor, posts: updatedPosts };
    
    const userTable = `${postAuthor.authorType.toLowerCase()}s`;
    const { error } = await supabase.from(userTable).update({ posts: updatedPosts }).eq('id', postAuthor.id);

    if (error) throw error;
    return updatedAuthor;
};

export const respondToBooking = async (booking: Booking, action: 'accept' | 'deny', engineer: Engineer): Promise<{ updatedBooking: Booking }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const status = action === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
    const engineerId = action === 'accept' ? engineer.id : null;

    const { data, error } = await supabase
        .from('bookings')
        .update({ status, engineer_id: engineerId })
        .eq('id', booking.id)
        .select()
        .single();
    
    if (error) throw error;
    return { updatedBooking: { ...toCamelCase(data), engineer: action === 'accept' ? engineer : null } as Booking };
};

export const submitForVerification = async (stoodioId: string, verificationData: { googleBusinessProfileUrl: string; websiteUrl: string }): Promise<{ temporaryStoodio: Partial<Stoodio> }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const updates = {
        ...toSnakeCase(verificationData),
        verification_status: VerificationStatus.PENDING,
    };
    
    const { error } = await supabase.from('stoodioz').update(updates).eq('id', stoodioId);
    if (error) throw error;

    return { temporaryStoodio: { ...verificationData, verificationStatus: VerificationStatus.PENDING } };
};
