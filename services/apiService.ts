import { getSupabase } from '../lib/supabase';
import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Transaction, Post, Comment, Review } from '../types';
import { BookingStatus, TransactionCategory, TransactionStatus, VerificationStatus } from '../types';
import { differenceInHours } from 'date-fns';

// --- DATA FETCHING (GET Requests) ---

const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        throw new Error(`Supabase error in ${context}: ${error.message}`);
    }
};

export const fetchStoodioz = async (): Promise<Stoodio[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('stoodioz').select('*');
    handleSupabaseError(error, 'fetchStoodioz');
    return data || [];
};

export const fetchArtists = async (): Promise<Artist[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('artists').select('*');
    handleSupabaseError(error, 'fetchArtists');
    return data || [];
};

export const fetchEngineers = async (): Promise<Engineer[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('engineers').select('*');
    handleSupabaseError(error, 'fetchEngineers');
    return data || [];
};

export const fetchProducers = async (): Promise<Producer[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('producers').select('*');
    handleSupabaseError(error, 'fetchProducers');
    return data || [];
};

export const fetchReviews = async (): Promise<Review[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('reviews').select('*');
    handleSupabaseError(error, 'fetchReviews');
    return data || [];
};

// --- DATA MUTATION ---

// Note: These mutations return the updated state objects for the client to use.
// In a real-world scenario with a more complex state management, you might just refetch data.

export const createBooking = async (
    bookingRequest: BookingRequest,
    stoodio: Stoodio | undefined,
    currentUser: Artist | Engineer | Stoodio | Producer,
    userRole: UserRole,
    engineers: Engineer[],
    producers: Producer[]
): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client is not configured. Cannot create booking.");
    
    let status = BookingStatus.PENDING;
    let engineer: Engineer | null = null;
    
    if (bookingRequest.mixingDetails?.type === 'REMOTE') {
         status = BookingStatus.PENDING_APPROVAL;
    } else {
        const isProducerBooking = !!bookingRequest.producerId;
        if (isProducerBooking) {
            status = BookingStatus.CONFIRMED;
        } else {
            if (bookingRequest.requestType === 'BRING_YOUR_OWN') status = BookingStatus.CONFIRMED;
            else if (bookingRequest.requestType === 'SPECIFIC_ENGINEER') status = BookingStatus.PENDING_APPROVAL;
            else status = BookingStatus.CONFIRMED; // Find available
        }
    }
    
    // In a real app, finding an available engineer would be a backend process.
    if (status === BookingStatus.CONFIRMED && bookingRequest.requestType === 'FIND_AVAILABLE') {
        engineer = engineers.find(e => e.isAvailable) || null;
    }

    const newBookingData: Omit<Booking, 'id'> = {
        ...bookingRequest,
        stoodio: stoodio,
        engineer: engineer,
        producer: bookingRequest.producerId ? producers.find(p => p.id === bookingRequest.producerId) || null : null,
        artist: userRole === 'ARTIST' ? (currentUser as Artist) : null,
        status: status,
        requestedEngineerId: bookingRequest.requestedEngineerId || null,
        bookedById: currentUser.id,
        bookedByRole: userRole,
        instrumentalsPurchased: bookingRequest.instrumentalsToPurchase || [],
        pullUpFee: bookingRequest.pullUpFee || 0,
    };
    
    // In a real Supabase setup, you'd insert just IDs for related entities.
    // Here we're inserting the whole object into a JSONB column to match the mock structure.
    const { data, error } = await supabase.from('bookings').insert(newBookingData).select().single();
    handleSupabaseError(error, 'createBooking');
    return data;
};

// Helper function to update a user's wallet and return the updated user object
const updateUserWallet = async (userId: string, userTable: string, transaction: Omit<Transaction, 'id'>): Promise<any> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client is not configured. Cannot update wallet.");

    const { data: user, error: fetchError } = await supabase.from(userTable).select('walletBalance, walletTransactions').eq('id', userId).single();
    if (fetchError || !user) throw fetchError || new Error('User not found');
    
    const newTransaction = { ...transaction, id: `txn-${Date.now()}` };
    const newBalance = user.walletBalance + transaction.amount;
    const newTransactions = [newTransaction, ...(user.walletTransactions || [])];

    const { data: updatedUser, error: updateError } = await supabase
        .from(userTable)
        .update({ walletBalance: newBalance, walletTransactions: newTransactions })
        .eq('id', userId)
        .select()
        .single();
    
    if (updateError) throw updateError;
    return updatedUser;
};

// This function is NOT transactional and is for demonstration. In a real app, use a Postgres function (RPC).
export const endSession = async (bookingId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client is not configured. Cannot end session.");

    const { data: booking, error: bookingError } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (bookingError || !booking) throw bookingError || new Error('Booking not found');

    // 1. Mark booking as completed
    const { data: updatedBooking, error: updateBookingError } = await supabase.from('bookings').update({ status: BookingStatus.COMPLETED }).eq('id', bookingId).select().single();
    if (updateBookingError) throw updateBookingError;

    // 2. Process payments (debit booker, credit studio/engineer)
    const now = new Date().toISOString();

    // Debit Booker
    const bookerTable = `${booking.bookedByRole.toLowerCase()}s`;
    const paymentTx = { description: `Session Payment`, amount: -booking.totalCost, date: now, category: TransactionCategory.SESSION_PAYMENT, status: TransactionStatus.COMPLETED, relatedBookingId: booking.id };
    await updateUserWallet(booking.bookedById, bookerTable, paymentTx);
    
    // Credit Stoodio
    if (booking.stoodio && booking.room) {
        const stoodioPayout = booking.room.hourlyRate * booking.duration;
        const stoodioPayoutTx = { description: `Payout from session`, amount: stoodioPayout, date: now, category: TransactionCategory.SESSION_PAYOUT, status: TransactionStatus.COMPLETED, relatedBookingId: booking.id };
        await updateUserWallet(booking.stoodio.id, 'stoodioz', stoodioPayoutTx);
    }
    
    // Credit Engineer
    if (booking.engineer) {
        const engineerPayout = booking.engineerPayRate * booking.duration;
        const engineerPayoutTx = { description: `Payout from session`, amount: engineerPayout, date: now, category: TransactionCategory.SESSION_PAYOUT, status: TransactionStatus.COMPLETED, relatedBookingId: booking.id };
        await updateUserWallet(booking.engineer.id, 'engineers', engineerPayoutTx);
    }
    
    return { updatedBooking };
};


// Other mutation functions would follow a similar pattern:
// 1. Fetch the relevant record(s).
// 2. Perform the logic.
// 3. Update the record(s) in Supabase.
// 4. Return the updated data.

export const cancelBooking = async (bookingId: string): Promise<any> => {
     const supabase = getSupabase();
     if (!supabase) throw new Error("Supabase client is not configured. Cannot cancel booking.");
     const { data, error } = await supabase.from('bookings').update({ status: BookingStatus.CANCELLED }).eq('id', bookingId).select();
     handleSupabaseError(error, 'cancelBooking');
     // A real implementation would also handle refunds here, likely via an RPC call.
     return { updatedBookings: data };
};

export const addTip = async (bookingId: string, tipAmount: number): Promise<any> => {
     const supabase = getSupabase();
     if (!supabase) throw new Error("Supabase client is not configured. Cannot add tip.");
     const { data, error } = await supabase.from('bookings').update({ tip: tipAmount }).eq('id', bookingId).select();
     handleSupabaseError(error, 'addTip');
     // A real implementation would also move funds here, likely via an RPC call.
     return { updatedBookings: data };
};

export const toggleFollow = async (currentUser: any, targetId: string, targetType: string): Promise<any> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client is not configured. Cannot toggle follow.");
    // This is complex without an RPC call. We'll just update the current user for now.
    const listKey = `${targetType}s`;
    const isFollowing = currentUser.following[listKey].includes(targetId);
    let newFollowingList;
    if (isFollowing) {
        newFollowingList = currentUser.following[listKey].filter((id: string) => id !== targetId);
    } else {
        newFollowingList = [...currentUser.following[listKey], targetId];
    }
    const newFollowing = { ...currentUser.following, [listKey]: newFollowingList };
    const userTable = `${currentUser.role.toLowerCase()}s`;
    const { data, error } = await supabase.from(userTable).update({ following: newFollowing }).eq('id', currentUser.id).select();
    handleSupabaseError(error, 'toggleFollow');
    // A real implementation would also update the target user's followers count.
    return data;
};

// Functions for creating posts, liking, commenting, etc. would also be implemented here
// by fetching the user/post, updating the JSONB field, and saving it back.
export const createPost = async (postData: any, author: any, authorType: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client is not configured. Cannot create post.");
    const newPost = { ...postData, id: `post-${Date.now()}`, authorId: author.id, authorType, timestamp: new Date().toISOString(), likes: [], comments: [] };
    const newPosts = [newPost, ...(author.posts || [])];
    const userTable = `${authorType.toLowerCase()}s`;
    const { data, error } = await supabase.from(userTable).update({ posts: newPosts }).eq('id', author.id).select().single();
    handleSupabaseError(error, 'createPost');
    return data;
};

export const likePost = async (postId: string, userId: string, authorId: string, authorType: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client is not configured. Cannot like post.");
    const userTable = `${authorType.toLowerCase()}s`;
    const { data: author, error: fetchError } = await supabase.from(userTable).select('posts').eq('id', authorId).single();
    if(fetchError || !author) throw fetchError || new Error('Author not found');

    const updatedPosts = author.posts.map((p: Post) => {
        if (p.id === postId) {
            const newLikes = p.likes.includes(userId) ? p.likes.filter(id => id !== userId) : [...p.likes, userId];
            return { ...p, likes: newLikes };
        }
        return p;
    });

    const { data, error } = await supabase.from(userTable).update({ posts: updatedPosts }).eq('id', authorId).select().single();
    handleSupabaseError(error, 'likePost');
    return data;
};

export const commentOnPost = async (postId: string, commentText: string, author: any, authorId: string, authorType: UserRole) => {
     const supabase = getSupabase();
     if (!supabase) throw new Error("Supabase client is not configured. Cannot comment on post.");
     const userTable = `${authorType.toLowerCase()}s`;
     const { data: postAuthor, error: fetchError } = await supabase.from(userTable).select('posts').eq('id', authorId).single();
     if(fetchError || !postAuthor) throw fetchError || new Error('Author not found');

    const newComment = { id: `comment-${Date.now()}`, authorId: author.id, authorName: author.name, authorImageUrl: author.imageUrl, text: commentText, timestamp: new Date().toISOString() };
    const updatedPosts = postAuthor.posts.map((p: Post) => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p);

    const { data, error } = await supabase.from(userTable).update({ posts: updatedPosts }).eq('id', authorId).select().single();
    handleSupabaseError(error, 'commentOnPost');
    return data;
};


export const respondToBooking = async (bookingId: string, action: 'accept' | 'deny', engineer: Engineer) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client is not configured. Cannot respond to booking.");
    const status = action === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
    const update = action === 'accept' ? { status, engineer } : { status, requestedEngineerId: null };
    const { data, error } = await supabase.from('bookings').update(update).eq('id', bookingId).select().single();
    handleSupabaseError(error, 'respondToBooking');
    return { updatedBooking: data };
};


export const submitForVerification = async (stoodioId: string, verificationData: { googleBusinessProfileUrl: string; websiteUrl: string }) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client is not configured. Cannot submit for verification.");
    const { data, error } = await supabase.from('stoodioz').update({ ...verificationData, verificationStatus: VerificationStatus.PENDING }).eq('id', stoodioId).select().single();
    handleSupabaseError(error, 'submitForVerification');
    return { temporaryStoodio: data };
};
