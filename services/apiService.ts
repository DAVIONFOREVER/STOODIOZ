
import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo, BaseUser, MixingDetails } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier } from '../types';
import { getSupabase } from '../lib/supabase';
import { USER_SILHOUETTE_URL } from '../constants';
import { generateInvoicePDF } from '../lib/pdf';

// --- HELPER FUNCTIONS ---

const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms/1000} seconds`)), ms));

const uploadFile = async (file: File | Blob, bucket: string, path: string): Promise<string> => {
    const createLocalUrl = () => URL.createObjectURL(file as Blob);
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase not configured. Using local blob URL.");
        return createLocalUrl();
    }
    try {
        const uploadTask = supabase.storage.from(bucket).upload(path, file, { upsert: true });
        const result: any = await Promise.race([uploadTask, timeoutPromise(10000)]);
        if (result.error) {
            console.warn(`Supabase storage upload failed (${bucket}/${path}):`, result.error.message);
            return createLocalUrl();
        }
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        if (!publicUrl) return createLocalUrl();
        return publicUrl;
    } catch (error: any) {
        console.error(`Upload exception for ${bucket}/${path}:`, error);
        return createLocalUrl();
    }
};

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    return uploadFile(file, 'avatars', path);
};

export const uploadPostAttachment = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/posts/${Date.now()}.${ext}`;
    return uploadFile(file, 'posts', path);
};

export const uploadDocument = async (file: Blob, fileName: string, userId: string): Promise<string> => {
    const path = `${userId}/documents/${Date.now()}_${fileName}`;
    return uploadFile(file, 'documents', path);
};

export const uploadRoomPhoto = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/rooms/${Date.now()}.${ext}`;
    return uploadFile(file, 'avatars', path); // reusing avatars bucket or creating a new one 'rooms'
};

export const uploadBeatFile = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/beats/${Date.now()}.${ext}`;
    return uploadFile(file, 'audio', path);
};

export const uploadMixingSampleFile = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/samples/${Date.now()}.${ext}`;
    return uploadFile(file, 'audio', path);
};

// --- USER MANAGEMENT ---

export const getAllPublicUsers = async (): Promise<{
    artists: Artist[],
    engineers: Engineer[],
    producers: Producer[],
    stoodioz: Stoodio[]
}> => {
    const supabase = getSupabase();
    if (!supabase) return { artists: [], engineers: [], producers: [], stoodioz: [] };

    const [artists, engineers, producers, stoodioz] = await Promise.all([
        supabase.from('artists').select('*'),
        supabase.from('engineers').select('*, mixing_samples(*)'),
        supabase.from('producers').select('*, instrumentals(*)'),
        supabase.from('stoodioz').select('*, rooms(*), in_house_engineers(*)')
    ]);

    return {
        artists: (artists.data as Artist[]) || [],
        engineers: (engineers.data as Engineer[]) || [],
        producers: (producers.data as Producer[]) || [],
        stoodioz: (stoodioz.data as Stoodio[]) || []
    };
};

export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | null> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");

    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No user returned from signup");

    // 2. Upload Image if provided
    let imageUrl = userData.image_url || USER_SILHOUETTE_URL;
    if (userData.imageFile) {
        imageUrl = await uploadAvatar(userData.imageFile, authData.user.id);
    }

    // 3. Create Profile Record
    const profileData = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        image_url: imageUrl,
        ...(role === 'ARTIST' && { bio: userData.bio }),
        ...(role === 'ENGINEER' && { bio: userData.bio, specialties: [] }),
        ...(role === 'PRODUCER' && { bio: userData.bio, genres: [] }),
        ...(role === 'STOODIO' && { 
            description: userData.description, 
            location: userData.location, 
            business_address: userData.businessAddress, 
            amenities: [], 
            rooms: [] 
        }),
        created_at: new Date().toISOString(),
    };

    const tableMap = {
        'ARTIST': 'artists',
        'ENGINEER': 'engineers',
        'PRODUCER': 'producers',
        'STOODIO': 'stoodioz'
    };

    const { data, error } = await supabase
        .from(tableMap[role])
        .insert(profileData)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateUser = async (userId: string, table: string, updates: any) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
};

// --- BOOKINGS ---

export const createBooking = async (request: BookingRequest, stoodio: Stoodio, booker: any, bookerRole: UserRole): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");

    const bookingData = {
        date: request.date,
        start_time: request.start_time,
        duration: request.duration,
        total_cost: request.total_cost,
        status: BookingStatus.CONFIRMED, // For MVP, auto-confirm
        booked_by_id: booker.id,
        booked_by_role: bookerRole,
        request_type: request.request_type,
        engineer_pay_rate: request.engineer_pay_rate,
        stoodio_id: stoodio.id,
        room_id: request.room?.id,
        artist_id: bookerRole === 'ARTIST' ? booker.id : undefined,
        // Map other fields...
        created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();
    if (error) throw error;
    
    // If PDF generation is needed, it typically happens here or in a trigger
    return data;
};

export const createCheckoutSessionForBooking = async (bookingRequest: BookingRequest, stoodioId: string | undefined, userId: string, userRole: UserRole) => {
    // Mock Stripe Session
    return { sessionId: 'mock_session_id' };
};

export const cancelBooking = async (booking: Booking) => {
    const supabase = getSupabase();
    if (!supabase) return booking;
    const { data, error } = await supabase.from('bookings').update({ status: BookingStatus.CANCELLED }).eq('id', booking.id).select().single();
    if (error) throw error;
    return data;
};

// --- SOCIAL ---

export const fetchGlobalFeed = async (limit: number, beforeTimestamp?: string): Promise<Post[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(limit);
    if (beforeTimestamp) {
        query = query.lt('created_at', beforeTimestamp);
    }
    const { data, error } = await query;
    if (error) {
        console.error("Fetch feed error", error);
        return [];
    }
    return (data || []).map((p: any) => ({
        id: p.id,
        authorId: p.author_id,
        authorType: p.author_type,
        text: p.text,
        image_url: p.image_url,
        video_url: p.video_url,
        video_thumbnail_url: p.video_thumbnail_url,
        link: p.link,
        timestamp: p.created_at,
        likes: p.likes || [],
        comments: p.comments || []
    }));
};

export const fetchUserPosts = async (userId: string): Promise<Post[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('posts').select('*').eq('author_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map((p: any) => ({
        id: p.id,
        authorId: p.author_id,
        authorType: p.author_type,
        text: p.text,
        image_url: p.image_url,
        video_url: p.video_url,
        video_thumbnail_url: p.video_thumbnail_url,
        link: p.link,
        timestamp: p.created_at,
        likes: p.likes || [],
        comments: p.comments || []
    }));
};

export const createPost = async (postData: any, author: any, authorType: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No DB");
    
    const newPost = {
        author_id: author.id,
        author_type: authorType,
        text: postData.text,
        image_url: postData.image_url,
        video_url: postData.video_url,
        video_thumbnail_url: postData.video_thumbnail_url,
        link: postData.link,
        likes: [],
        comments: [], // This field might not exist in SQL if we use a separate table, but assuming for now based on schema prompt
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('posts').insert(newPost).select().single();
    if (error) throw error;
    return { updatedAuthor: author }; // Optimistic return
};

export const likePost = async (postId: string, userId: string, author: any) => {
    const supabase = getSupabase();
    if (!supabase) return { updatedAuthor: author };
    
    // Fetch current likes
    const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
    if (!post) return { updatedAuthor: author };

    let likes = post.likes || [];
    if (likes.includes(userId)) {
        likes = likes.filter((id: string) => id !== userId);
    } else {
        likes.push(userId);
    }

    await supabase.from('posts').update({ likes }).eq('id', postId);
    return { updatedAuthor: author };
};

export const commentOnPost = async (postId: string, text: string, commenter: any, postAuthor: any) => {
    // Since comments are a separate table in schema but app uses embedded for optimistic UI...
    // Implementation assumes we insert into comments table
    const supabase = getSupabase();
    if (!supabase) return { updatedAuthor: postAuthor };

    await supabase.from('comments').insert({
        post_id: postId,
        author_id: commenter.id,
        author_name: commenter.name,
        author_image_url: commenter.image_url,
        text
    });
    return { updatedAuthor: postAuthor };
};

export const toggleFollow = async (currentUser: any, targetUser: any, type: string, isFollowing: boolean) => {
    const supabase = getSupabase();
    if (!supabase) return { updatedCurrentUser: currentUser, updatedTargetUser: targetUser };

    // Logic to update 'following' array on currentUser and 'followers' count/array on targetUser
    // This requires complex array manipulation in SQL or 2 reads + 2 writes.
    // Simplified: assume success
    return { updatedCurrentUser: currentUser, updatedTargetUser: targetUser };
};

// --- OTHER ---

export const createCheckoutSessionForWallet = async (amount: number, userId: string) => {
    return { sessionId: 'mock_wallet_session' };
};

export const initiatePayout = async (amount: number, userId: string) => {
    return { success: true };
};

export const createCheckoutSessionForSubscription = async (planId: string, userId: string) => {
    return { sessionId: 'mock_sub_session' };
};

export const purchaseBeat = async (beat: Instrumental, type: 'lease' | 'exclusive', buyer: any, producer: Producer, role: UserRole) => {
    // Create a booking/transaction record
    const bookingData = {
        date: new Date().toISOString(),
        start_time: 'N/A',
        duration: 0,
        total_cost: type === 'lease' ? beat.price_lease : beat.price_exclusive,
        status: BookingStatus.COMPLETED,
        booked_by_id: buyer.id,
        booked_by_role: role,
        request_type: BookingRequestType.BEAT_PURCHASE,
        producer_id: producer.id,
        instrumentals_purchased: [beat],
    };
    
    // Mock DB insertion
    const booking = { id: `bk-beat-${Date.now()}`, ...bookingData };
    return { updatedBooking: booking as unknown as Booking };
};

export const respondToBooking = async (booking: Booking, action: 'accept' | 'deny', engineer: Engineer) => {
    const status = action === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED;
    const supabase = getSupabase();
    if(supabase) {
        const { data } = await supabase.from('bookings').update({ status }).eq('id', booking.id).select().single();
        return data || { ...booking, status };
    }
    return { ...booking, status };
};

export const acceptJob = async (booking: Booking, engineer: Engineer) => {
    const supabase = getSupabase();
    if(supabase) {
        const { data } = await supabase.from('bookings').update({ 
            status: BookingStatus.CONFIRMED,
            engineer_id: engineer.id
        }).eq('id', booking.id).select().single();
        return data || { ...booking, status: BookingStatus.CONFIRMED, engineer };
    }
    return { ...booking, status: BookingStatus.CONFIRMED, engineer };
};

export const endSession = async (booking: Booking) => {
    const supabase = getSupabase();
    if(supabase) {
        const { data } = await supabase.from('bookings').update({ status: BookingStatus.COMPLETED }).eq('id', booking.id).select().single();
        return { updatedBooking: data || { ...booking, status: BookingStatus.COMPLETED } };
    }
    return { updatedBooking: { ...booking, status: BookingStatus.COMPLETED } };
};

export const addTip = async (booking: Booking, amount: number) => {
    return { sessionId: 'mock_tip_session' };
};

export const fetchAnalyticsData = async (userId: string, role: UserRole, days: number): Promise<AnalyticsData> => {
    // Mock data
    return {
        kpis: { totalRevenue: 1500, profileViews: 300, newFollowers: 12, bookings: 5 },
        revenueOverTime: [],
        engagementOverTime: [],
        revenueSources: []
    };
};

export const submitForVerification = async (stoodioId: string, data: any) => {
    const supabase = getSupabase();
    if(supabase) {
        await supabase.from('stoodioz').update({ verification_status: VerificationStatus.PENDING }).eq('id', stoodioId);
    }
    return { verification_status: VerificationStatus.PENDING };
};

export const upsertRoom = async (room: Room, stoodioId: string) => {
    const supabase = getSupabase();
    if(supabase) {
        const { data, error } = await supabase.from('rooms').upsert({
            ...room,
            stoodio_id: stoodioId
        }).select().single();
        if(error) throw error;
        return data;
    }
};

export const deleteRoom = async (roomId: string) => {
    const supabase = getSupabase();
    if(supabase) await supabase.from('rooms').delete().eq('id', roomId);
};

export const upsertInHouseEngineer = async (info: InHouseEngineerInfo, stoodioId: string) => {
    const supabase = getSupabase();
    if(supabase) {
        await supabase.from('in_house_engineers').upsert({
            stoodio_id: stoodioId,
            engineer_id: info.engineer_id,
            pay_rate: info.pay_rate
        });
    }
};

export const deleteInHouseEngineer = async (engineerId: string, stoodioId: string) => {
    const supabase = getSupabase();
    if(supabase) await supabase.from('in_house_engineers').delete().match({ stoodio_id: stoodioId, engineer_id: engineerId });
};

export const upsertInstrumental = async (inst: Instrumental, producerId: string) => {
    const supabase = getSupabase();
    if(supabase) {
        await supabase.from('instrumentals').upsert({
            ...inst,
            producer_id: producerId
        });
    }
};

export const deleteInstrumental = async (instId: string) => {
    const supabase = getSupabase();
    if(supabase) await supabase.from('instrumentals').delete().eq('id', instId);
};

export const upsertMixingSample = async (sample: MixingSample, engineerId: string) => {
    const supabase = getSupabase();
    if(supabase) {
        await supabase.from('mixing_samples').upsert({
            ...sample,
            engineer_id: engineerId
        });
    }
};

export const deleteMixingSample = async (sampleId: string) => {
    const supabase = getSupabase();
    if(supabase) await supabase.from('mixing_samples').delete().eq('id', sampleId);
};
