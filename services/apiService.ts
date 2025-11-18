import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData } from '../types';
// FIX: Added RankingTier to imports to resolve a reference error.
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier } from '../types';
import { getSupabase } from '../lib/supabase';
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


// --- DATA MUTATIONS (POST, PUT, DELETE Requests) ---

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

/**
 * Uploads a mixing sample file to Supabase Storage.
 * @param file The audio file (MP3, WAV) to upload.
 * @param engineerId The ID of the engineer uploading the file.
 * @returns The public URL of the uploaded file.
 */
export const uploadMixingSampleFile = async (file: File, engineerId: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = `public/${engineerId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('mixing-samples')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading mixing sample file:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('mixing-samples')
        .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
        throw new Error("Could not get public URL for uploaded file.");
    }

    return data.publicUrl;
};

export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | null> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.error("Supabase not initialized");
        throw new Error("Supabase not initialized");
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
    });

    if (authError) {
        console.error("Supabase sign up error:", authError.message);
        throw authError;
    }

    if (!authData.user) {
        throw new Error("User not created in Supabase Auth.");
    }
    
    let tableName = '';
    let newUserScaffold: any = {};
    const baseData = {
        id: authData.user.id,
        name: userData.name,
        email: authData.user.email,
        image_url: userData.image_url || USER_SILHOUETTE_URL,
        followers: 0,
        following: { stoodioz: [], engineers: [], artists: ["artist-aria-cantata"], producers: [] },
        follower_ids: [],
        coordinates: { lat: 34.0522, lon: -118.2437 },
        wallet_balance: 0,
        wallet_transactions: [],
        posts: [],
        links: [],
        isOnline: true,
        rating_overall: 0,
        sessions_completed: 0,
        ranking_tier: RankingTier.Provisional,
        is_on_streak: false,
        on_time_rate: 100,
        completion_rate: 0,
        repeat_hire_rate: 0,
        strength_tags: [],
        local_rank_text: 'Just getting started!',
        purchased_masterclass_ids: [],
    };
    
    switch (role) {
        case UserRoleEnum.ARTIST:
            tableName = 'artists';
            newUserScaffold = { ...baseData, bio: userData.bio, isSeekingSession: false, showOnMap: false };
            break;
        case UserRoleEnum.ENGINEER:
            tableName = 'engineers';
            newUserScaffold = { ...baseData, bio: userData.bio, specialties: [], mixingSamples: [], isAvailable: true, showOnMap: true, displayExactLocation: false };
            break;
        case UserRoleEnum.PRODUCER:
            tableName = 'producers';
            newUserScaffold = { ...baseData, bio: userData.bio, genres: [], instrumentals: [], isAvailable: true, showOnMap: true };
            break;
        case UserRoleEnum.STOODIO:
            tableName = 'stoodioz';
            newUserScaffold = { ...baseData, description: userData.description, location: userData.location, businessAddress: userData.businessAddress, hourlyRate: 100, engineerPayRate: 50, amenities: [], availability: [], photos: [userData.image_url || USER_SILHOUETTE_URL], rooms: [], verificationStatus: VerificationStatus.UNVERIFIED, showOnMap: true };
            break;
        default:
            throw new Error(`Invalid role: ${role}`);
    }

    const { data: profileData, error: profileError } = await supabase
        .from(tableName)
        .insert([newUserScaffold])
        .select()
        .single();

    if (profileError) {
        console.error(`Error inserting profile into ${tableName}:`, profileError.message);
        throw profileError;
    }

    return profileData as Artist | Engineer | Stoodio | Producer;
};

export const updateUser = async (userId: string, tableName: string, updates: Partial<Artist | Engineer | Stoodio | Producer>): Promise<any> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    
    if (error) {
        console.error(`Error updating user ${userId} in ${tableName}:`, error);
        throw error;
    }
    return data;
};

export const createCheckoutSessionForBooking = async (
    bookingRequest: BookingRequest,
    stoodioId: string | undefined,
    userId: string,
    userRole: UserRole
): Promise<{ sessionId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { bookingRequest, stoodioId, userId, userRole },
    });

    if (error) throw error;
    return data;
};

export const createCheckoutSessionForSubscription = async (planId: SubscriptionPlan, userId: string): Promise<{ sessionId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { data, error } = await supabase.functions.invoke('create-subscription-session', {
        body: { planId, userId },
    });

    if (error) throw error;
    return data;
};

export const createCheckoutSessionForWallet = async (amount: number, userId: string): Promise<{ sessionId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { data, error } = await supabase.functions.invoke('create-add-funds-session', {
        body: { amount, userId },
    });

    if (error) throw error;
    return data;
};

export const initiatePayout = async (amount: number, userId: string): Promise<{ success: boolean }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { data, error } = await supabase.functions.invoke('request-payout', {
        body: { amount, userId },
    });
    
    if (error) throw error;
    return data;
};

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
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: BookingStatus.COMPLETED })
        .eq('id', booking.id)
        .select('*, stoodio:stoodioz(*), artist:artists(*), engineer:engineers(*), producer:producers(*)')
        .single();
    if (error) throw error;
    return { updatedBooking: data as Booking };
};

export const cancelBooking = async (booking: Booking): Promise<{ updatedBooking: Booking }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { data, error } = await supabase
        .from('bookings')
        .update({ status: BookingStatus.CANCELLED })
        .eq('id', booking.id)
        .select('*, stoodio:stoodioz(*), artist:artists(*), engineer:engineers(*), producer:producers(*)')
        .single();
    if (error) throw error;
    return { updatedBooking: data as Booking };
};

export const addTip = async (booking: Booking, tipAmount: number): Promise<{ sessionId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { data, error } = await supabase.functions.invoke('create-tip-session', {
        body: { tipAmount, bookingId: booking.id, recipientId: booking.engineer?.id },
    });

    if (error) throw error;
    return data;
};

const getTableNameFromRole = (role: UserRole | 'stoodio' | 'engineer' | 'artist' | 'producer' | null): string => {
    if (!role) throw new Error("Invalid role provided");
    switch (role) {
        case 'ARTIST': return 'artists';
        case 'ENGINEER': return 'engineers';
        case 'PRODUCER': return 'producers';
        case 'STOODIO': return 'stoodioz';
        case 'artist': return 'artists';
        case 'engineer': return 'engineers';
        case 'producer': return 'producers';
        case 'stoodio': return 'stoodioz';
        default: throw new Error(`Unknown role: ${role}`);
    }
};

export const toggleFollow = async (currentUser: any, targetUser: any, targetType: 'artist' | 'engineer' | 'stoodio' | 'producer', isFollowing: boolean): Promise<{ updatedCurrentUser: any; updatedTargetUser: any; }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const listKey = `${targetType}s`;
    
    const newFollowing = { ...currentUser.following };
    if (isFollowing) {
        newFollowing[listKey] = (currentUser.following[listKey] || []).filter((id: string) => id !== targetUser.id);
    } else {
        newFollowing[listKey] = [...(currentUser.following[listKey] || []), targetUser.id];
    }
    const { data: updatedCurrentUser, error: currentUserError } = await supabase.from(getTableNameFromRole(currentUser.isAdmin ? UserRoleEnum.STOODIO : (currentUser.specialties ? UserRoleEnum.ENGINEER : (currentUser.instrumentals ? UserRoleEnum.PRODUCER : UserRoleEnum.ARTIST)))).update({ following: newFollowing }).eq('id', currentUser.id).select().single();
    if(currentUserError) throw currentUserError;

    const newFollowerIds = isFollowing
        ? (targetUser.follower_ids || []).filter((id: string) => id !== currentUser.id)
        : [...(targetUser.follower_ids || []), currentUser.id];
    const { data: updatedTargetUser, error: targetUserError } = await supabase.from(getTableNameFromRole(targetType)).update({ follower_ids: newFollowerIds, followers: newFollowerIds.length }).eq('id', targetUser.id).select().single();
    if(targetUserError) throw targetUserError;

    return { updatedCurrentUser, updatedTargetUser };
};

export const createPost = async (postData: { text: string; image_url?: string; link?: any }, author: any, authorType: UserRole): Promise<any> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

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
    const { data, error } = await supabase.from(getTableNameFromRole(authorType)).update({ posts: newPosts }).eq('id', author.id).select().single();
    if (error) throw error;
    return data;
};

export const likePost = async (postId: string, userId: string, author: any): Promise<any> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const postToUpdate = (author.posts || []).find((p: Post) => p.id === postId);
    if (!postToUpdate) return author;

    const newLikes = postToUpdate.likes.includes(userId)
        ? postToUpdate.likes.filter((id: string) => id !== userId)
        : [...postToUpdate.likes, userId];

    const updatedPosts = author.posts.map((p: Post) => p.id === postId ? { ...p, likes: newLikes } : p);
    
    const { data, error } = await supabase.from(getTableNameFromRole(author.authorType || getRoleFromUser(author))).update({ posts: updatedPosts }).eq('id', author.id).select().single();
    if (error) throw error;
    return data;
};

export const commentOnPost = async (postId: string, commentText: string, commentAuthor: any, postAuthor: any): Promise<any> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const newComment: Comment = { 
        id: `comment-${Date.now()}`, 
        authorId: commentAuthor.id, 
        authorName: commentAuthor.name, 
        author_image_url: commentAuthor.image_url, 
        text: commentText, 
        timestamp: new Date().toISOString() 
    };

    const updatedPosts = postAuthor.posts.map((p: Post) => 
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    );
    
    const { data, error } = await supabase.from(getTableNameFromRole(postAuthor.authorType || getRoleFromUser(postAuthor))).update({ posts: updatedPosts }).eq('id', postAuthor.id).select().single();
    if(error) throw error;
    return data;
};

const getRoleFromUser = (user: any): UserRole => {
    if (user.amenities) return UserRoleEnum.STOODIO;
    if (user.specialties) return UserRoleEnum.ENGINEER;
    if (user.instrumentals) return UserRoleEnum.PRODUCER;
    return UserRoleEnum.ARTIST;
};


export const respondToBooking = async (booking: Booking, action: 'accept' | 'deny', engineer: Engineer): Promise<{ updatedBooking: Booking }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");

    // FIX: Replaced non-existent BookingStatus.DENIED with BookingStatus.CANCELLED.
    const status = action === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED;
    const engineer_id = action === 'accept' ? engineer.id : null;

    const { data, error } = await supabase.from('bookings').update({ status: status, engineer_id: engineer_id }).eq('id', booking.id).select('*, stoodio:stoodioz(*), artist:artists(*), engineer:engineers(*), producer:producers(*)').single();
    if (error) throw error;
    return { updatedBooking: data as Booking };
};

export const acceptJob = async (booking: Booking, engineer: Engineer): Promise<{ updatedBooking: Booking }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { data, error } = await supabase.from('bookings').update({ status: BookingStatus.CONFIRMED, engineer_id: engineer.id, posted_by: null }).eq('id', booking.id).select('*, stoodio:stoodioz(*), artist:artists(*), engineer:engineers(*), producer:producers(*)').single();
    if (error) throw error;
    return { updatedBooking: data as Booking };
};

export const submitForVerification = async (stoodioId: string, verificationData: { googleBusinessProfileUrl: string; websiteUrl: string }): Promise<Partial<Stoodio>> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const updates = { ...verificationData, verificationStatus: VerificationStatus.PENDING };
    const { data, error } = await supabase.from('stoodioz').update(updates).eq('id', stoodioId).select().single();
    if (error) throw error;
    return data;
};

export const fetchAnalyticsData = async (userId: string, userRole: UserRole, days: number = 30): Promise<AnalyticsData> => {
    await new Promise(res => setTimeout(res, 200));
    
    const isArtist = userRole === UserRoleEnum.ARTIST;

    return {
        kpis: {
            totalRevenue: 0,
            profileViews: 0,
            newFollowers: 0,
            bookings: 0,
        },
        revenueOverTime: [],
        engagementOverTime: [],
        revenueSources: isArtist ? [
            { name: 'Studio Sessions', revenue: 0 },
            { name: 'Masterclasses', revenue: 0 },
            { name: 'Tips Given', revenue: 0 },
        ] : [
            { name: 'Session Payouts', revenue: 0 },
            { name: 'Masterclass Sales', revenue: 0 },
            { name: 'Tips Received', revenue: 0 },
        ],
    };
};