import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum } from '../types';
import { getSupabase } from '../lib/supabase';
import { subDays, format } from 'date-fns';
import { USER_SILHOUETTE_URL } from '../constants';

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

export const fetchStoodioz = (): Promise<Stoodio[]> => fetchData<Stoodio>('stoodioz', '*, rooms(*), in_house_engineers(*)');
export const fetchArtists = (): Promise<Artist[]> => fetchData<Artist>('artists', '*');
export const fetchEngineers = (): Promise<Engineer[]> => fetchData<Engineer>('engineers', '*, mixing_samples(*)');
export const fetchProducers = (): Promise<Producer[]> => fetchData<Producer>('producers', '*');
export const fetchReviews = (): Promise<Review[]> => fetchData<Review>('reviews', '*');
export const fetchBookings = (): Promise<Booking[]> => fetchData<Booking>('bookings', '*, stoodio:stoodioz(*), artist:artists(*), engineer:engineers(*), producer:producers(*)');


// --- DATA MUTATIONS (Simulated POST, PUT, DELETE Requests) ---

/**
 * Uploads an instrumental file to Supabase Storage.
 * @param file The audio file (MP3, WAV) to upload.
 * @param producerId The ID of the producer uploading the file.
 * @returns The public URL of the uploaded file.
 */
export const uploadBeatFile = async (file: File, producerId: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = `public/${producerId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('instrumentals')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading beat file:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('instrumentals')
        .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
        throw new Error("Could not get public URL for uploaded file.");
    }

    return data.publicUrl;
};


export const findUserByCredentials = async (email: string, password: string): Promise<Artist | Engineer | Stoodio | Producer | null> => {
    const tables = ['artists', 'engineers', 'producers', 'stoodioz'];
    for (const table of tables) {
        const supabase = getSupabase();
        if (!supabase) return null;
        const { data, error } = await supabase.from(table).select('*').eq('email', email).eq('password', password).limit(1);
        if (error) {
            console.error(`Error finding user in ${table}:`, error);
            continue;
        }
        if (data && data.length > 0) {
            return data[0] as Artist | Engineer | Stoodio | Producer;
        }
    }
    return null;
};

export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | null> => {
    let tableName = '';
    let newUserScaffold: any = {};
    const baseData = {
        id: `${role.toLowerCase()}-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        imageUrl: USER_SILHOUETTE_URL,
        followers: 0,
        following: { stoodioz: [], engineers: [], artists: ["artist-aria-cantata"], producers: [] },
        followerIds: [],
        coordinates: { lat: 34.0522, lon: -118.2437 }, // LA
        walletBalance: 0,
        walletTransactions: [],
        posts: [],
        links: [],
        isOnline: true,
    };
    
    switch (role) {
        case 'ARTIST':
            tableName = 'artists';
            newUserScaffold = { ...baseData, bio: userData.bio, isSeekingSession: false, showOnMap: false };
            break;
        case 'ENGINEER':
            tableName = 'engineers';
            newUserScaffold = { ...baseData, bio: userData.bio, specialties: [], rating: 5, sessionsCompleted: 0, mixingSamples: [], isAvailable: true, showOnMap: true, displayExactLocation: false };
            break;
        case 'PRODUCER':
            tableName = 'producers';
            newUserScaffold = { ...baseData, bio: userData.bio, genres: [], rating: 5, instrumentals: [], isAvailable: true, showOnMap: true };
            break;
        case 'STOODIO':
            tableName = 'stoodioz';
            newUserScaffold = { ...baseData, description: userData.description, location: userData.location, hourlyRate: 100, engineerPayRate: 50, rating: 5, amenities: [], availability: [], photos: [baseData.imageUrl], rooms: [], verificationStatus: VerificationStatus.UNVERIFIED, showOnMap: true };
            break;
    }
    
    // This is a mock implementation
    return newUserScaffold;
};

export const updateUser = async (userId: string, updates: Partial<Artist | Engineer | Stoodio | Producer>): Promise<any> => {
    console.log(`Updating user ${userId} with`, updates);
    return { id: userId, ...updates }; 
};

/**
 * Creates a new booking record in the database and then initiates a Stripe checkout session.
 * @returns { sessionId: string } The ID for the Stripe Checkout session.
 */
export const createCheckoutSessionForBooking = async (
    bookingRequest: BookingRequest,
    stoodioId: string | undefined,
    userId: string,
    userRole: UserRole
): Promise<{ sessionId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    // This function now calls a Supabase Edge Function.
    // The Edge Function will handle creating the booking in the DB with a 'PENDING_PAYMENT' status,
    // then creating a Stripe Checkout session, and returning the session ID.
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { bookingRequest, stoodioId, userId, userRole },
    });

    if (error) throw error;
    return data;
};

/**
 * Creates a Stripe checkout session for adding funds to a user's wallet.
 * @returns { sessionId: string } The ID for the Stripe Checkout session.
 */
export const createCheckoutSessionForWallet = async (amount: number, userId: string): Promise<{ sessionId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    // This Edge Function will create a Stripe Checkout session for the specified amount
    // and include metadata to identify the user, so the webhook can update the correct wallet.
    const { data, error } = await supabase.functions.invoke('create-add-funds-session', {
        body: { amount, userId },
    });

    if (error) throw error;
    return data;
};

/**
 * Initiates a payout request from a user's wallet to their bank account.
 */
export const initiatePayout = async (amount: number, userId: string): Promise<{ success: boolean }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    // This Edge Function verifies the user's balance, then calls the Stripe API
    // to create a transfer to the user's connected bank account.
    const { data, error } = await supabase.functions.invoke('request-payout', {
        body: { amount, userId },
    });
    
    if (error) throw error;
    return data;
};

// FIX: Added 'createBooking' function to handle non-payment booking creations like job postings.
export const createBooking = async (
    bookingRequest: BookingRequest,
    stoodio: Stoodio | undefined,
    bookedByUser: Artist | Engineer | Stoodio | Producer,
    bookedByRole: UserRole,
): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    let status = bookingRequest.requestType === BookingRequestType.SPECIFIC_ENGINEER ? BookingStatus.PENDING_APPROVAL : BookingStatus.PENDING;

    const newBookingData: any = {
        date: bookingRequest.date,
        start_time: bookingRequest.startTime,
        duration: bookingRequest.duration,
        total_cost: bookingRequest.totalCost,
        status: status,
        booked_by_id: bookedByUser.id,
        booked_by_role: bookedByRole,
        request_type: bookingRequest.requestType,
        engineer_pay_rate: bookingRequest.engineerPayRate,
        mixing_details: bookingRequest.mixingDetails,
        stoodio_id: stoodio?.id,
        artist_id: bookedByRole === UserRoleEnum.ARTIST ? bookedByUser.id : null,
        requested_engineer_id: bookingRequest.requestedEngineerId,
        producer_id: bookingRequest.producerId,
        posted_by: bookedByRole === UserRoleEnum.STOODIO ? UserRoleEnum.STOODIO : undefined,
    };

    const { data, error } = await supabase
        .from('bookings')
        .insert([newBookingData])
        .select('*, stoodio:stoodioz(*), artist:artists(*), engineer:engineers(*), producer:producers(*)')
        .single();
    
    if (error) {
        console.error("Error creating booking:", error.message);
        throw error;
    }

    return data as Booking;
};


export const endSession = async (booking: Booking): Promise<{ updatedBooking: Booking }> => {
    const updatedBooking = { ...booking, status: BookingStatus.COMPLETED };
    return { updatedBooking };
};

export const cancelBooking = async (booking: Booking): Promise<{ updatedBookings: Booking[] }> => {
    const updatedBooking = { ...booking, status: BookingStatus.CANCELLED };
    return { updatedBookings: [updatedBooking] };
};

export const addTip = async (booking: Booking, tipAmount: number): Promise<{ sessionId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    // Create a checkout session specifically for the tip.
    // The webhook will handle associating the tip with the booking and updating balances.
    const { data, error } = await supabase.functions.invoke('create-tip-session', {
        body: { tipAmount, bookingId: booking.id, recipientId: booking.engineer?.id },
    });

    if (error) throw error;
    return data;
};

export const toggleFollow = async (currentUser: any, targetId: string, targetType: 'artist' | 'engineer' | 'stoodio' | 'producer', allUsers: any[]): Promise<{ updatedCurrentUser: any; updatedTargetUser: any; }> => {
    const listKey = `${targetType}s`;
    const isFollowing = (currentUser.following[listKey] || []).includes(targetId);
    
    let newFollowingList;
    if (isFollowing) {
        newFollowingList = (currentUser.following[listKey] || []).filter((id: string) => id !== targetId);
    } else {
        newFollowingList = [...(currentUser.following[listKey] || []), targetId];
    }
    const updatedCurrentUser = { ...currentUser, following: { ...currentUser.following, [listKey]: newFollowingList } };
    
    const targetUser = allUsers.find(u => u.id === targetId);
    if (!targetUser) return { updatedCurrentUser, updatedTargetUser: null };

    let newFollowerIds;
    if (isFollowing) {
        newFollowerIds = (targetUser.followerIds || []).filter((id: string) => id !== currentUser.id);
    } else {
        newFollowerIds = [...(targetUser.followerIds || []), currentUser.id];
    }
    const updatedTargetUser = { ...targetUser, followerIds: newFollowerIds, followers: newFollowerIds.length };

    return { updatedCurrentUser, updatedTargetUser };
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

export const submitForVerification = async (stoodioId: string, verificationData: { googleBusinessProfileUrl: string; websiteUrl: string }): Promise<Partial<Stoodio>> => {
    return { ...verificationData, verificationStatus: VerificationStatus.PENDING };
};

export const approveVerification = async (stoodioId: string): Promise<Partial<Stoodio>> => {
    return { verificationStatus: VerificationStatus.VERIFIED };
};

export const fetchAnalyticsData = async (userId: string, days: number = 30): Promise<AnalyticsData> => {
    await new Promise(res => setTimeout(res, 800));
    const revenueOverTime = [];
    const engagementOverTime = [];
    let totalRevenue = 0;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateString = format(date, 'yyyy-MM-dd');
        const dailyRevenue = Math.random() * 300;
        totalRevenue += dailyRevenue;
        revenueOverTime.push({ date: dateString, revenue: parseFloat(dailyRevenue.toFixed(2)) });
        engagementOverTime.push({ date: dateString, views: Math.floor(Math.random() * 150) + 20, followers: Math.floor(Math.random() * 5), likes: Math.floor(Math.random() * 30) });
    }

    return {
        kpis: {
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            profileViews: Math.floor(Math.random() * 2000) + 500,
            newFollowers: Math.floor(Math.random() * 50) + 10,
            bookings: Math.floor(Math.random() * 20) + 5,
        },
        revenueOverTime,
        engagementOverTime,
        revenueSources: [
            { name: 'Studio Bookings', revenue: totalRevenue * 0.6 },
            { name: 'Beat Sales', revenue: totalRevenue * 0.3 },
            { name: 'Tips', revenue: totalRevenue * 0.1 },
        ]
    };
};