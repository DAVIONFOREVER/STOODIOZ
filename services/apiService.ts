
import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo, BaseUser } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier } from '../types';
import { getSupabase } from '../lib/supabase';
import { USER_SILHOUETTE_URL } from '../constants';
import { generateInvoicePDF } from '../lib/pdf';

// --- HELPER FUNCTIONS ---

// Timeout helper: Rejects if the promise doesn't resolve within ms
const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms/1000} seconds`)), ms));

// Robust upload function that fails gracefully
const uploadFile = async (file: File | Blob, bucket: string, path: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase not configured. Returning blob URL.");
        return URL.createObjectURL(file as Blob);
    }

    try {
        // Race the upload against a 15-second timeout to prevent freezing
        const uploadTask = supabase.storage.from(bucket).upload(path, file, { upsert: true });
        const result: any = await Promise.race([
            uploadTask,
            timeoutPromise(15000) // 15 second hard timeout
        ]);
        
        if (result.error) throw result.error;

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return publicUrl;
    } catch (error: any) {
        console.error(`Upload failed to ${bucket}/${path}:`, error);
        // CRITICAL FIX: Fallback to local object URL so the app flow doesn't break if storage is misconfigured
        return URL.createObjectURL(file as Blob);
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

export const uploadRoomPhoto = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/rooms/${Date.now()}.${ext}`;
    return uploadFile(file, 'rooms', path);
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

export const uploadDocument = async (file: Blob, fileName: string, userId: string): Promise<string> => {
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${userId}/docs/${Date.now()}_${safeName}`;
    return uploadFile(file, 'documents', path);
};

const getTableFromRole = (role: UserRole): string => {
    switch (role) {
        case UserRoleEnum.ARTIST: return 'artists';
        case UserRoleEnum.ENGINEER: return 'engineers';
        case UserRoleEnum.PRODUCER: return 'producers';
        case UserRoleEnum.STOODIO: return 'stoodioz';
        default: return 'artists';
    }
};

const inferUserTable = (user: any): string => {
    if ('amenities' in user) return 'stoodioz';
    if ('specialties' in user) return 'engineers';
    if ('instrumentals' in user) return 'producers';
    return 'artists';
};

// --- INVOICE GENERATION ---
export const generateAndStoreInvoice = async (booking: Booking, buyer: BaseUser, seller: BaseUser) => {
    try {
        const pdfBytes = await generateInvoicePDF(booking, buyer, seller);
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const safeName = `invoice_${booking.id}_${Date.now()}.pdf`;
        const invoiceUrl = await uploadDocument(pdfBlob, safeName, buyer.id);

        const supabase = getSupabase();
        if (supabase) {
            await supabase
                .from('bookings')
                .update({ invoice_url: invoiceUrl })
                .eq('id', booking.id);
        }
        return invoiceUrl;
    } catch (error) {
        console.error("Failed to generate automatic invoice:", error);
        return null;
    }
};

// --- USER MANAGEMENT ---

export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    // 1. Sign Up
    const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
            data: { 
                role: role,
                name: userData.name
            }
        }
    });

    if (authError) throw authError;
    if (!authUser) return null;

    // 2. Upload Avatar (Robust handling)
    let avatarUrl = userData.image_url || USER_SILHOUETTE_URL;
    if (userData.imageFile) {
        try {
             // This will now timeout gracefully if storage is broken
             avatarUrl = await uploadAvatar(userData.imageFile, authUser.id);
        } catch (e) {
            console.error("Avatar upload failed, continuing with default/local URL:", e);
            // Ensure we have *some* URL so the profile image isn't broken
            if (userData.imageFile) {
                avatarUrl = URL.createObjectURL(userData.imageFile);
            }
        }
    }

    // 3. Create Profile Data
    const baseData = {
        id: authUser.id,
        email: authUser.email,
        name: userData.name,
        image_url: avatarUrl,
        completion_rate: 0,
        coordinates: { lat: 0, lon: 0 },
        followers: 0,
        following: { stoodioz: [], engineers: [], artists: ["artist-aria-cantata"], producers: [] },
        follower_ids: [],
        wallet_balance: 0,
        wallet_transactions: [],
        posts: [],
        links: [],
        is_online: true,
        rating_overall: 0, 
        sessions_completed: 0,
        ranking_tier: RankingTier.Provisional,
        is_on_streak: false,
        on_time_rate: 100,
        repeat_hire_rate: 0,
        strength_tags: [],
        local_rank_text: 'New Member',
        purchased_masterclass_ids: [],
    };

    let tableName = '';
    let specificData = {};

    switch (role) {
        case UserRoleEnum.ARTIST:
            tableName = 'artists';
            specificData = { bio: userData.bio, is_seeking_session: false, show_on_map: false };
            break;
        case UserRoleEnum.ENGINEER:
            tableName = 'engineers';
            specificData = { bio: userData.bio, specialties: [], mixing_samples: [], is_available: true, show_on_map: true, display_exact_location: false };
            break;
        case UserRoleEnum.PRODUCER:
            tableName = 'producers';
            specificData = { bio: userData.bio, genres: [], instrumentals: [], is_available: true, show_on_map: true };
            break;
        case UserRoleEnum.STOODIO:
            tableName = 'stoodioz';
            specificData = { 
                description: userData.description, 
                location: userData.location, 
                business_address: userData.business_address || userData.businessAddress, 
                hourly_rate: 100, 
                engineer_pay_rate: 50, 
                amenities: [], 
                availability: [], 
                photos: [avatarUrl], 
                rooms: [], 
                verification_status: 'UNVERIFIED', 
                show_on_map: true 
            };
            break;
    }

    // CRITICAL: Check if profile already exists to avoid unique constraint errors on retry
    const { data: existingProfile } = await supabase.from(tableName).select('id').eq('id', authUser.id).single();
    
    if (existingProfile) {
        console.log("Profile already exists, updating instead of inserting.");
        const { data: updatedProfile, error: updateError } = await supabase
            .from(tableName)
            .update({ ...baseData, ...specificData })
            .eq('id', authUser.id)
            .select()
            .single();
        if (updateError) throw updateError;
        return updatedProfile as any;
    }

    const { data: newProfile, error: profileError } = await supabase
        .from(tableName)
        .insert({ ...baseData, ...specificData })
        .select()
        .single();

    if (profileError) {
        console.error("Error inserting profile:", profileError);
        throw profileError;
    }

    return newProfile as any;
};

export const updateUser = async (userId: string, table: string, updates: any) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const toggleFollow = async (currentUser: any, targetUser: any, targetType: string, isFollowing: boolean) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const currentFollowing = { ...currentUser.following };
    const listKey = `${targetType}s` as keyof typeof currentFollowing;
    
    let newList = currentFollowing[listKey] || [];
    if (isFollowing) {
        newList = newList.filter((id: string) => id !== targetUser.id);
    } else {
        newList = [...newList, targetUser.id];
    }
    currentFollowing[listKey] = newList;

    let targetFollowers = targetUser.follower_ids || [];
    if (isFollowing) {
        targetFollowers = targetFollowers.filter((id: string) => id !== currentUser.id);
    } else {
        targetFollowers = [...targetFollowers, currentUser.id];
    }

    const { data: updatedCurrent } = await supabase
        .from(inferUserTable(currentUser))
        .update({ following: currentFollowing })
        .eq('id', currentUser.id)
        .select()
        .single();

    const { data: updatedTarget } = await supabase
        .from(inferUserTable(targetUser))
        .update({ 
            follower_ids: targetFollowers,
            followers: targetFollowers.length
        })
        .eq('id', targetUser.id)
        .select()
        .single();

    return { updatedCurrentUser: updatedCurrent, updatedTargetUser: updatedTarget };
};

export const submitForVerification = async (stoodioId: string, data: { googleBusinessProfileUrl: string, websiteUrl: string }) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: updatedStoodio, error } = await supabase
        .from('stoodioz')
        .update({ verification_status: VerificationStatus.PENDING })
        .eq('id', stoodioId)
        .select()
        .single();

    if (error) throw error;
    return updatedStoodio;
};

// --- BOOKINGS ---

export const createBooking = async (request: BookingRequest, stoodio: Stoodio, user: any, userRole: UserRole): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const bookingId = `bk-${Date.now()}`;
    const newBooking: Booking = {
        id: bookingId,
        ...request,
        status: userRole === UserRoleEnum.STOODIO ? BookingStatus.PENDING : BookingStatus.PENDING_APPROVAL,
        booked_by_id: user.id,
        booked_by_role: userRole,
        stoodio: stoodio,
        posted_by: userRole,
    };

    const { data, error } = await supabase
        .from('bookings')
        .insert(newBooking)
        .select()
        .single();
        
    if (error) throw error;
    return data as Booking;
};

export const cancelBooking = async (booking: Booking): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: BookingStatus.CANCELLED })
        .eq('id', booking.id)
        .select()
        .single();

    if (error) throw error;
    return data as Booking;
};

export const respondToBooking = async (booking: Booking, response: 'accept' | 'deny', responder: Engineer): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const status = response === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED;

    const { data, error } = await supabase
        .from('bookings')
        .update({ 
            status,
            engineer: response === 'accept' ? responder : booking.engineer
        })
        .eq('id', booking.id)
        .select()
        .single();

    if (error) throw error;
    return data as Booking;
};

export const acceptJob = async (booking: Booking, engineer: Engineer): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data, error } = await supabase
        .from('bookings')
        .update({ 
            status: BookingStatus.CONFIRMED,
            engineer: engineer,
            requested_engineer_id: engineer.id
        })
        .eq('id', booking.id)
        .select()
        .single();

    if (error) throw error;

    if (data && booking.stoodio) {
        await generateAndStoreInvoice(data, booking.stoodio, engineer);
    }

    return data as Booking;
};

export const endSession = async (booking: Booking): Promise<{ updatedBooking: Booking }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: BookingStatus.COMPLETED })
        .eq('id', booking.id)
        .select()
        .single();

    if (error) throw error;
    return { updatedBooking: data as Booking };
};

// --- FINANCIALS (MOCKED STRIPE) ---

export const createCheckoutSessionForBooking = async (bookingRequest: BookingRequest, stoodioId: string | undefined, userId: string, userRole: UserRole) => {
    return { sessionId: 'mock_session_id_' + Date.now() };
};

export const createCheckoutSessionForWallet = async (amount: number, userId: string) => {
    return { sessionId: 'mock_wallet_session_' + Date.now() };
};

export const createCheckoutSessionForSubscription = async (planId: SubscriptionPlan, userId: string) => {
    return { sessionId: 'mock_sub_session_' + Date.now() };
};

export const initiatePayout = async (amount: number, userId: string) => {
    return { success: true };
};

export const addTip = async (booking: Booking, amount: number) => {
    return { sessionId: 'mock_tip_session_' + Date.now() };
};

export const purchaseBeat = async (instrumental: Instrumental, type: 'lease' | 'exclusive', buyer: any, producer: Producer, userRole: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");
    
    const price = type === 'lease' ? instrumental.price_lease : instrumental.price_exclusive;
    
    const transaction: Transaction = {
        id: `txn-${Date.now()}`,
        date: new Date().toISOString(),
        description: `Beat Purchase: ${instrumental.title} (${type})`,
        amount: -price,
        category: TransactionCategory.BEAT_PURCHASE,
        status: TransactionStatus.COMPLETED,
        related_user_name: producer.name
    };

    const booking: Booking = {
        id: `bk-beat-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        start_time: 'N/A',
        duration: 0,
        total_cost: price,
        status: BookingStatus.COMPLETED,
        booked_by_id: buyer.id,
        booked_by_role: userRole,
        request_type: BookingRequestType.BEAT_PURCHASE,
        engineer_pay_rate: 0,
        producer: producer,
        instrumentals_purchased: [instrumental]
    };

    const { data: newBooking, error: bookingError } = await supabase.from('bookings').insert(booking).select().single();
    if (bookingError) throw bookingError;

    const currentTransactions = buyer.wallet_transactions || [];
    const updatedTransactions = [...currentTransactions, transaction];

    const { error: userError } = await updateUser(buyer.id, inferUserTable(buyer), { 
        wallet_balance: buyer.wallet_balance - price,
        wallet_transactions: updatedTransactions
    });

    if (userError) throw userError;

    if (newBooking) {
        await generateAndStoreInvoice(newBooking, buyer, producer);
        const { data: finalBooking } = await supabase.from('bookings').select('*').eq('id', newBooking.id).single();
        return { updatedBooking: finalBooking as Booking };
    }

    return { updatedBooking: newBooking as Booking };
};

// --- SOCIAL ---

export const fetchGlobalFeed = async (limit: number = 10, beforeTimestamp?: string): Promise<Post[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    let query = supabase
        .from('posts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (beforeTimestamp) {
        query = query.lt('timestamp', beforeTimestamp);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching feed:", error);
        return [];
    }

    return (data || []).map((row: any) => ({
        id: row.id,
        authorId: row.author_id,
        authorType: row.author_type,
        text: row.text,
        image_url: row.image_url,
        video_url: row.video_url,
        video_thumbnail_url: row.video_thumbnail_url,
        link: row.link,
        timestamp: row.timestamp,
        likes: row.likes || [],
        comments: row.comments || []
    }));
};

export const createPost = async (postData: any, user: any, userRole: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const postForDb = {
        id: `post-${Date.now()}`,
        author_id: user.id,
        author_type: userRole,
        text: postData.text,
        image_url: postData.image_url,
        video_url: postData.video_url,
        video_thumbnail_url: postData.video_thumbnail_url,
        link: postData.link,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
    };

    // Primary Insert to POSTS table
    const { error: dbError } = await supabase.from('posts').insert(postForDb);
    if (dbError) console.error("Error inserting into posts table:", dbError);

    // Update user profile posts for backward compatibility
    // This ensures older logic or profile-specific views still work until fully refactored
    const newPost: Post = {
        id: postForDb.id,
        authorId: user.id,
        authorType: userRole,
        text: postData.text,
        image_url: postData.image_url,
        video_url: postData.video_url,
        video_thumbnail_url: postData.video_thumbnail_url,
        link: postData.link,
        timestamp: postForDb.timestamp,
        likes: [],
        comments: []
    };

    const currentPosts = user.posts || [];
    const updatedPosts = [newPost, ...currentPosts];
    const table = getTableFromRole(userRole);

    const { data: updatedUser, error } = await supabase
        .from(table)
        .update({ posts: updatedPosts })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error("Warning: Failed to update user profile with new post, but post was likely created in global feed.", error);
        // Return updated structure for optimistic UI update even if profile sync failed
        return { ...user, posts: updatedPosts }; 
    }
    
    return updatedUser;
};

export const likePost = async (postId: string, userId: string, author: any) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: postData } = await supabase.from('posts').select('likes').eq('id', postId).single();

    if (postData) {
        let newLikes = postData.likes || [];
        if (newLikes.includes(userId)) {
            newLikes = newLikes.filter((id: string) => id !== userId);
        } else {
            newLikes = [...newLikes, userId];
        }
        await supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
    }

    // Legacy update logic for profile compatibility
    const posts = author.posts || [];
    const postIndex = posts.findIndex((p: Post) => p.id === postId);
    if (postIndex === -1) return author;

    const post = posts[postIndex];
    const isLiked = post.likes.includes(userId);
    let legacyLikes = isLiked ? post.likes.filter((id: string) => id !== userId) : [...post.likes, userId];

    const updatedPost = { ...post, likes: legacyLikes };
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = updatedPost;

    const table = inferUserTable(author);
    
    // Fire and forget update to user profile to keep sync
    supabase.from(table).update({ posts: updatedPosts }).eq('id', author.id).then(() => {});

    return { ...author, posts: updatedPosts };
};

export const commentOnPost = async (postId: string, text: string, commenter: any, author: any) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const newComment: Comment = {
        id: `comment-${Date.now()}`,
        authorId: commenter.id,
        authorName: commenter.name,
        author_image_url: commenter.image_url,
        text: text,
        timestamp: new Date().toISOString()
    };

    const { data: postData } = await supabase.from('posts').select('comments').eq('id', postId).single();
    if (postData) {
        const currentComments = postData.comments || [];
        await supabase.from('posts').update({ comments: [...currentComments, newComment] }).eq('id', postId);
    }

    const posts = author.posts || [];
    const postIndex = posts.findIndex((p: Post) => p.id === postId);
    if (postIndex === -1) return author;

    const post = posts[postIndex];
    const updatedPost = { ...post, comments: [...post.comments, newComment] };
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = updatedPost;

    const table = inferUserTable(author);
    
    // Fire and forget update to user profile
    supabase.from(table).update({ posts: updatedPosts }).eq('id', author.id).then(() => {});

    return { ...author, posts: updatedPosts };
};

// --- CONTENT MANAGEMENT ---

export const upsertRoom = async (room: Room, stoodioId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: studio } = await supabase.from('stoodioz').select('rooms').eq('id', stoodioId).single();
    const currentRooms: Room[] = studio?.rooms || [];
    const roomIndex = currentRooms.findIndex(r => r.id === room.id);
    let updatedRooms = [...currentRooms];

    if (roomIndex >= 0) updatedRooms[roomIndex] = room;
    else updatedRooms.push(room);

    const { data: updatedStudio, error } = await supabase.from('stoodioz').update({ rooms: updatedRooms }).eq('id', stoodioId).select().single();
    if (error) throw error;
    return updatedStudio;
};

export const deleteRoom = async (roomId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: studio } = await supabase.from('stoodioz').select('rooms').eq('id', user.id).single();
    const updatedRooms = (studio?.rooms || []).filter((r: Room) => r.id !== roomId);

    const { error } = await supabase.from('stoodioz').update({ rooms: updatedRooms }).eq('id', user.id);
    if (error) throw error;
};

export const upsertInstrumental = async (instrumental: Instrumental, producerId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: producer } = await supabase.from('producers').select('instrumentals').eq('id', producerId).single();
    const currentBeats: Instrumental[] = producer?.instrumentals || [];
    const index = currentBeats.findIndex(i => i.id === instrumental.id);
    let updatedBeats = [...currentBeats];

    if (index >= 0) updatedBeats[index] = instrumental;
    else updatedBeats.push(instrumental);

    const { error } = await supabase.from('producers').update({ instrumentals: updatedBeats }).eq('id', producerId);
    if (error) throw error;
};

export const deleteInstrumental = async (instrumentalId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: producer } = await supabase.from('producers').select('instrumentals').eq('id', user.id).single();
    const updatedBeats = (producer?.instrumentals || []).filter((i: Instrumental) => i.id !== instrumentalId);

    const { error } = await supabase.from('producers').update({ instrumentals: updatedBeats }).eq('id', user.id);
    if (error) throw error;
};

export const upsertMixingSample = async (sample: MixingSample, engineerId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: engineer } = await supabase.from('engineers').select('mixing_samples').eq('id', engineerId).single();
    const currentSamples: MixingSample[] = engineer?.mixing_samples || [];
    const index = currentSamples.findIndex(s => s.id === sample.id);
    let updatedSamples = [...currentSamples];

    if (index >= 0) updatedSamples[index] = sample;
    else updatedSamples.push(sample);

    const { error } = await supabase.from('engineers').update({ mixing_samples: updatedSamples }).eq('id', engineerId);
    if (error) throw error;
};

export const deleteMixingSample = async (sampleId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: engineer } = await supabase.from('engineers').select('mixing_samples').eq('id', user.id).single();
    const updatedSamples = (engineer?.mixing_samples || []).filter((s: MixingSample) => s.id !== sampleId);

    const { error } = await supabase.from('engineers').update({ mixing_samples: updatedSamples }).eq('id', user.id);
    if (error) throw error;
};

export const upsertInHouseEngineer = async (info: InHouseEngineerInfo, stoodioId: string) => {
     const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: studio } = await supabase.from('stoodioz').select('in_house_engineers').eq('id', stoodioId).single();
    const currentEngineers: InHouseEngineerInfo[] = studio?.in_house_engineers || [];
    const index = currentEngineers.findIndex(e => e.engineer_id === info.engineer_id);
    let updatedEngineers = [...currentEngineers];

    if (index >= 0) updatedEngineers[index] = info;
    else updatedEngineers.push(info);

    const { error } = await supabase.from('stoodioz').update({ in_house_engineers: updatedEngineers }).eq('id', stoodioId);
    if (error) throw error;
};

export const deleteInHouseEngineer = async (engineerId: string, stoodioId: string) => {
     const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: studio } = await supabase.from('stoodioz').select('in_house_engineers').eq('id', stoodioId).single();
    const updatedEngineers = (studio?.in_house_engineers || []).filter((e: InHouseEngineerInfo) => e.engineer_id !== engineerId);

    const { error } = await supabase.from('stoodioz').update({ in_house_engineers: updatedEngineers }).eq('id', stoodioId);
    if (error) throw error;
};

export const fetchAnalyticsData = async (userId: string, userRole: UserRole, days: number): Promise<AnalyticsData> => {
    const emptyData: AnalyticsData = {
        kpis: { totalRevenue: 0, profileViews: 0, newFollowers: 0, bookings: 0 },
        revenueOverTime: Array.from({ length: 10 }, (_, i) => ({ date: new Date(Date.now() - i * 86400000).toISOString(), revenue: 0 })).reverse(),
        engagementOverTime: Array.from({ length: 10 }, (_, i) => ({ date: new Date(Date.now() - i * 86400000).toISOString(), views: 0, followers: 0, likes: 0 })).reverse(),
        revenueSources: [{ name: 'Bookings', revenue: 0 }, { name: 'Tips', revenue: 0 }, { name: 'Mixing', revenue: 0 }]
    };
    return emptyData;
};
