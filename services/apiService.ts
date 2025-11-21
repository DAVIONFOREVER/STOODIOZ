
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
        // Race the upload against a 60-second timeout (increased from 15s) to prevent freezing on slow connections
        const uploadTask = supabase.storage.from(bucket).upload(path, file, { upsert: true });
        const result: any = await Promise.race([
            uploadTask,
            timeoutPromise(60000) // 60 second hard timeout
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
                rooms: [], 
                verification_status: VerificationStatus.UNVERIFIED, 
                photos: [], 
                in_house_engineers: [],
                show_on_map: true
            };
            break;
    }

    const { data, error } = await supabase.from(tableName).insert([{ ...baseData, ...specificData }]).select().single();
    
    if (error) throw error;
    return data as Artist | Engineer | Stoodio | Producer;
};

export const updateUser = async (userId: string, table: string, updates: Partial<any>) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
};

// --- POSTS & FEEDS ---

export const createPost = async (postData: any, user: any, userRole: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const newPost = {
        id: `post-${Date.now()}`,
        author_id: user.id,
        author_type: userRole,
        text: postData.text || '',
        image_url: postData.image_url || null,
        video_url: postData.video_url || null,
        video_thumbnail_url: postData.video_thumbnail_url || null,
        link: postData.link || null,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
    };

    // 1. Insert into global feed table
    // Using 'select' to ensure we get the return data, which helps confirm the insert worked
    const { error: insertError } = await supabase.from('posts').insert([newPost]).select();
    
    if (insertError) {
        console.error("Error creating post in public.posts:", insertError);
        // Fallback: Continue to update profile so at least the user sees it
    }

    // 2. Update user's profile posts array (legacy support/dashboard view)
    const currentPosts = user.posts || [];
    const updatedPosts = [newPost, ...currentPosts];
    const table = getTableFromRole(userRole);
    
    const { error: profileError } = await supabase.from(table).update({ posts: updatedPosts }).eq('id', user.id);
    if (profileError) {
        console.error("Error updating user profile with post:", profileError);
    }

    return { updatedAuthor: { ...user, posts: updatedPosts }, newPost };
};

export const fetchGlobalFeed = async (limit = 20, beforeTimestamp?: string): Promise<Post[]> => {
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
    
    // Map DB columns to Post type
    return (data || []).map(row => ({
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

export const fetchUserPosts = async (userId: string): Promise<Post[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', userId)
        .order('timestamp', { ascending: false });

    if (error) {
        console.error("Error fetching user posts:", error);
        return [];
    }

    return (data || []).map(row => ({
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

export const likePost = async (postId: string, userId: string, postAuthor: any) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    // 1. Fetch the post to get current likes
    const { data: postData, error: fetchError } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single();

    if (fetchError) throw fetchError;

    let likes = postData.likes || [];
    if (likes.includes(userId)) {
        likes = likes.filter((id: string) => id !== userId);
    } else {
        likes.push(userId);
    }

    // 2. Update global posts table
    await supabase.from('posts').update({ likes }).eq('id', postId);

    // 3. Update author's profile posts array (legacy support)
    const table = inferUserTable(postAuthor);
    const currentPosts = postAuthor.posts || [];
    const updatedPosts = currentPosts.map((p: Post) => 
        p.id === postId ? { ...p, likes } : p
    );
    await supabase.from(table).update({ posts: updatedPosts }).eq('id', postAuthor.id);

    return { ...postAuthor, posts: updatedPosts };
};

export const commentOnPost = async (postId: string, text: string, commenter: any, postAuthor: any) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const newComment: Comment = {
        id: `comment-${Date.now()}`,
        authorId: commenter.id,
        authorName: commenter.name,
        author_image_url: commenter.image_url,
        text,
        timestamp: new Date().toISOString()
    };

    // 1. Fetch current comments
    const { data: postData, error: fetchError } = await supabase
        .from('posts')
        .select('comments')
        .eq('id', postId)
        .single();

    if (fetchError) throw fetchError;

    const comments = postData.comments || [];
    comments.push(newComment); // JSONB column stores array of objects

    // 2. Update global posts table
    await supabase.from('posts').update({ comments }).eq('id', postId);

    // 3. Update author's profile (legacy)
    const table = inferUserTable(postAuthor);
    const currentPosts = postAuthor.posts || [];
    const updatedPosts = currentPosts.map((p: Post) => 
        p.id === postId ? { ...p, comments } : p
    );
    await supabase.from(table).update({ posts: updatedPosts }).eq('id', postAuthor.id);

    return { ...postAuthor, posts: updatedPosts };
};

// --- SPECIFIC UPDATES ---

export const toggleFollow = async (currentUser: any, targetUser: any, targetType: string, isFollowing: boolean) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const currentTable = inferUserTable(currentUser);
    const targetTable = inferUserTable(targetUser);

    // 1. Update Current User's "following" list (User owns this row, standard RLS applies)
    let newFollowing = { ...currentUser.following };
    const targetListKey = `${targetType}s` as keyof typeof newFollowing; // e.g., 'artists', 'engineers'
    let list = newFollowing[targetListKey] || [];

    if (isFollowing) {
        list = list.filter((id: string) => id !== targetUser.id);
    } else {
        list.push(targetUser.id);
    }
    newFollowing[targetListKey] = list;

    await supabase.from(currentTable).update({ following: newFollowing }).eq('id', currentUser.id);

    // 2. Update Target User's "followers" count and "follower_ids" list
    // We use an RPC function to bypass RLS on the target table, as users cannot update other users' rows directly.
    let newFollowerIds = targetUser.follower_ids || [];
    if (isFollowing) {
        newFollowerIds = newFollowerIds.filter((id: string) => id !== currentUser.id);
    } else {
        newFollowerIds.push(currentUser.id);
    }
    const newFollowersCount = newFollowerIds.length;

    // Call RPC to update target securely
    const { error: rpcError } = await supabase.rpc('update_target_followers', {
        table_name: targetTable,
        target_id: targetUser.id,
        new_follower_ids: newFollowerIds,
        new_count: newFollowersCount
    });

    if (rpcError) {
        console.error("RPC update_target_followers failed:", rpcError);
        // If RPC fails, UI might be out of sync for the target user's count, but main functionality (following) works for current user.
    }

    return {
        updatedCurrentUser: { ...currentUser, following: newFollowing },
        updatedTargetUser: { ...targetUser, followers: newFollowersCount, follower_ids: newFollowerIds }
    };
};

export const upsertInstrumental = async (instrumental: Instrumental, producerId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    // 1. Fetch current producer to get the existing array
    const { data: producer, error: fetchError } = await supabase
        .from('producers')
        .select('instrumentals')
        .eq('id', producerId)
        .single();

    if (fetchError) throw fetchError;

    let instrumentals = (producer.instrumentals as Instrumental[]) || [];
    
    // 2. Check if updating existing or adding new
    const existingIndex = instrumentals.findIndex(i => i.id === instrumental.id);
    
    if (existingIndex >= 0) {
        // Update existing
        instrumentals[existingIndex] = instrumental;
    } else {
        // Add new
        instrumentals.push(instrumental);
    }

    // 3. Save the entire array back to the JSONB column
    const { error: updateError } = await supabase
        .from('producers')
        .update({ instrumentals })
        .eq('id', producerId);

    if (updateError) throw updateError;
    return instrumentals;
};

export const deleteInstrumental = async (instrumentalId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Fetch current
    const { data: producer, error: fetchError } = await supabase
        .from('producers')
        .select('instrumentals')
        .eq('id', user.id)
        .single();

    if (fetchError) throw fetchError;

    let instrumentals = (producer.instrumentals as Instrumental[]) || [];
    const filtered = instrumentals.filter(i => i.id !== instrumentalId);

    // 2. Update
    const { error: updateError } = await supabase
        .from('producers')
        .update({ instrumentals: filtered })
        .eq('id', user.id);

    if (updateError) throw updateError;
};

export const upsertMixingSample = async (sample: MixingSample, engineerId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    // 1. Fetch current
    const { data: engineer, error: fetchError } = await supabase
        .from('engineers')
        .select('mixing_samples')
        .eq('id', engineerId)
        .single();

    if (fetchError) throw fetchError;

    let samples = (engineer.mixing_samples as MixingSample[]) || [];
    const existingIndex = samples.findIndex(s => s.id === sample.id);

    if (existingIndex >= 0) {
        samples[existingIndex] = sample;
    } else {
        samples.push(sample);
    }

    // 2. Update
    const { error: updateError } = await supabase
        .from('engineers')
        .update({ mixing_samples: samples })
        .eq('id', engineerId);

    if (updateError) throw updateError;
};

export const deleteMixingSample = async (sampleId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: engineer, error: fetchError } = await supabase
        .from('engineers')
        .select('mixing_samples')
        .eq('id', user.id)
        .single();

    if (fetchError) throw fetchError;

    let samples = (engineer.mixing_samples as MixingSample[]) || [];
    const filtered = samples.filter(s => s.id !== sampleId);

    const { error: updateError } = await supabase
        .from('engineers')
        .update({ mixing_samples: filtered })
        .eq('id', user.id);

    if (updateError) throw updateError;
};

export const upsertRoom = async (room: Room, stoodioId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const { data: stoodio } = await supabase.from('stoodioz').select('rooms').eq('id', stoodioId).single();
    let rooms = (stoodio?.rooms as Room[]) || [];
    
    const index = rooms.findIndex(r => r.id === room.id);
    if (index >= 0) rooms[index] = room;
    else rooms.push(room);

    await supabase.from('stoodioz').update({ rooms }).eq('id', stoodioId);
};

export const deleteRoom = async (roomId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: stoodio } = await supabase.from('stoodioz').select('rooms').eq('id', user.id).single();
    let rooms = (stoodio?.rooms as Room[]) || [];
    rooms = rooms.filter(r => r.id !== roomId);

    await supabase.from('stoodioz').update({ rooms }).eq('id', user.id);
};

export const upsertInHouseEngineer = async (info: InHouseEngineerInfo, stoodioId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const { data: stoodio } = await supabase.from('stoodioz').select('in_house_engineers').eq('id', stoodioId).single();
    let engineers = (stoodio?.in_house_engineers as InHouseEngineerInfo[]) || [];
    
    // Check if exists to update rate, or push new
    const index = engineers.findIndex(e => e.engineer_id === info.engineer_id);
    if (index >= 0) engineers[index] = info;
    else engineers.push(info);

    await supabase.from('stoodioz').update({ in_house_engineers: engineers }).eq('id', stoodioId);
};

export const deleteInHouseEngineer = async (engineerId: string, stoodioId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const { data: stoodio } = await supabase.from('stoodioz').select('in_house_engineers').eq('id', stoodioId).single();
    let engineers = (stoodio?.in_house_engineers as InHouseEngineerInfo[]) || [];
    
    engineers = engineers.filter(e => e.engineer_id !== engineerId);

    await supabase.from('stoodioz').update({ in_house_engineers: engineers }).eq('id', stoodioId);
};

export const submitForVerification = async (stoodioId: string, data: any) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    
    await supabase.from('stoodioz').update({ 
        verification_status: VerificationStatus.PENDING,
        // In a real app, store the proof URLs in a separate admin table or private column
    }).eq('id', stoodioId);
    
    return { verification_status: VerificationStatus.PENDING };
};

// --- BOOKING & PAYMENTS ---

export const createBooking = async (request: BookingRequest, stoodio: Stoodio, bookedBy: BaseUser, bookedByRole: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const booking: Booking = {
        id: `bk-${Date.now()}`,
        date: request.date,
        start_time: request.start_time,
        duration: request.duration,
        total_cost: request.total_cost,
        status: BookingStatus.PENDING,
        booked_by_id: bookedBy.id,
        booked_by_role: bookedByRole,
        request_type: request.request_type,
        engineer_pay_rate: request.engineer_pay_rate,
        stoodio: stoodio,
        mixing_details: request.mixing_details,
        requested_engineer_id: request.requested_engineer_id,
        posted_by: bookedByRole // Track if this was posted by a Studio (Job) or requested by an Artist
    };

    await supabase.from('bookings').insert([booking]);
    return booking;
};

export const respondToBooking = async (booking: Booking, action: 'accept' | 'deny', responder: Engineer) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const newStatus = action === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED;
    
    // If accepting, assign the engineer
    const updates: any = { status: newStatus };
    if (action === 'accept') {
        updates.engineer = responder;
    }

    await supabase.from('bookings').update(updates).eq('id', booking.id);
    return { ...booking, ...updates };
};

export const acceptJob = async (booking: Booking, engineer: Engineer) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const updates = { 
        status: BookingStatus.CONFIRMED,
        engineer: engineer // Assign the engineer to the booking
    };

    await supabase.from('bookings').update(updates).eq('id', booking.id);
    return { ...booking, ...updates };
};

export const cancelBooking = async (booking: Booking) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    await supabase.from('bookings').update({ status: BookingStatus.CANCELLED }).eq('id', booking.id);
    return { ...booking, status: BookingStatus.CANCELLED };
};

export const endSession = async (booking: Booking) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");
    
    // Update status and increment completed sessions for ranking
    await supabase.from('bookings').update({ status: BookingStatus.COMPLETED }).eq('id', booking.id);
    
    // In a real backend, this would trigger a cloud function to payout the engineer/studio
    
    return { updatedBooking: { ...booking, status: BookingStatus.COMPLETED } };
};

// --- MOCK STRIPE INTEGRATION ---
export const createCheckoutSessionForBooking = async (bookingRequest: BookingRequest, stoodioId: string | undefined, userId: string, userRole: UserRole) => {
    console.log("Creating Stripe Session for:", bookingRequest);
    return { sessionId: 'mock_stripe_session_id' };
};

export const createCheckoutSessionForSubscription = async (planId: string, userId: string) => {
    return { sessionId: 'mock_sub_session_id' };
};

export const createCheckoutSessionForWallet = async (amount: number, userId: string) => {
    return { sessionId: 'mock_wallet_session_id' };
};

export const initiatePayout = async (amount: number, userId: string) => {
    console.log(`Payout of $${amount} requested for ${userId}`);
    return { success: true };
};

export const addTip = async (booking: Booking, amount: number) => {
    return { sessionId: 'mock_tip_session_id' };
};

export const purchaseBeat = async (instrumental: Instrumental, type: 'lease' | 'exclusive', buyer: BaseUser, producer: Producer, buyerRole: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not initialized");

    const price = type === 'lease' ? instrumental.price_lease : instrumental.price_exclusive;

    // 1. Create Booking Record (Beat Purchase is treated as a booking type)
    const purchaseRecord: Booking = {
        id: `pur-${Date.now()}`,
        date: new Date().toISOString(),
        start_time: 'N/A',
        duration: 0,
        total_cost: price,
        status: BookingStatus.COMPLETED,
        booked_by_id: buyer.id,
        booked_by_role: buyerRole,
        request_type: BookingRequestType.BEAT_PURCHASE,
        engineer_pay_rate: 0,
        producer: producer,
        instrumentals_purchased: [instrumental]
    };

    await supabase.from('bookings').insert([purchaseRecord]);

    // 2. Generate Transaction for Producer
    const transaction: Transaction = {
        id: `txn-${Date.now()}`,
        date: new Date().toISOString(),
        description: `Beat Sale (${type}): ${instrumental.title}`,
        amount: price * 0.9, // 10% platform fee
        category: TransactionCategory.BEAT_SALE,
        status: TransactionStatus.COMPLETED,
        related_user_name: buyer.name
    };

    // Update Producer Wallet (Need to fetch current first to be safe, but simplified here)
    // Ideally this is a database function or trigger.
    // For client-side simulation:
    const { data: currentProducer } = await supabase.from('producers').select('wallet_balance, wallet_transactions').eq('id', producer.id).single();
    if (currentProducer) {
        const newTxns = [...(currentProducer.wallet_transactions || []), transaction];
        const newBalance = (currentProducer.wallet_balance || 0) + transaction.amount;
        await supabase.from('producers').update({ 
            wallet_balance: newBalance, 
            wallet_transactions: newTxns 
        }).eq('id', producer.id);
    }

    return { updatedBooking: purchaseRecord };
};

// --- ANALYTICS ---
export const fetchAnalyticsData = async (userId: string, userRole: UserRole, days: number): Promise<AnalyticsData> => {
    const supabase = getSupabase();
    if (!supabase) {
        // Fallback to empty structure if no supabase
        return {
            kpis: { totalRevenue: 0, profileViews: 0, newFollowers: 0, bookings: 0 },
            revenueOverTime: [],
            engagementOverTime: [],
            revenueSources: []
        };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Determine table
    let tableName = 'artists';
    if (userRole === 'ENGINEER') tableName = 'engineers';
    else if (userRole === 'PRODUCER') tableName = 'producers';
    else if (userRole === 'STOODIO') tableName = 'stoodioz';

    // Fetch user profile for transactions
    const { data: userData, error } = await supabase
        .from(tableName)
        .select('wallet_transactions, followers')
        .eq('id', userId)
        .single();

    if (error || !userData) {
        console.error("Analytics fetch error:", error);
        return {
            kpis: { totalRevenue: 0, profileViews: 0, newFollowers: 0, bookings: 0 },
            revenueOverTime: [],
            engagementOverTime: [],
            revenueSources: []
        };
    }

    const transactions: Transaction[] = userData.wallet_transactions || [];
    
    // Filter relevant transactions
    const periodTransactions = transactions.filter(t => new Date(t.date) >= startDate);

    // Calculate Total Revenue (Sum of positive amounts in period)
    // For Artists, this is spending (negative), so we sum all amounts.
    // Dashboard handles positive/negative display.
    const netFlow = periodTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Count Bookings/Sales
    // Proxied by transaction categories that imply a sale/booking
    const bookingCount = periodTransactions.filter(t => 
        ['SESSION_PAYMENT', 'BEAT_SALE', 'MASTERCLASS_PURCHASE', 'SESSION_PAYOUT', 'MASTERCLASS_PAYOUT'].includes(t.category)
    ).length;

    // Revenue Over Time
    const revenueMap = new Map<string, number>();
    periodTransactions.forEach(t => {
        const isoDate = new Date(t.date).toISOString().split('T')[0];
        revenueMap.set(isoDate, (revenueMap.get(isoDate) || 0) + t.amount);
    });

    const revenueOverTime = Array.from(revenueMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue Sources
    const sourcesMap = new Map<string, number>();
    periodTransactions.forEach(t => {
        const cat = t.category;
        // We want absolute value for the pie chart breakdown usually
        sourcesMap.set(cat, (sourcesMap.get(cat) || 0) + Math.abs(t.amount));
    });
    const revenueSources = Array.from(sourcesMap.entries()).map(([name, revenue]) => ({ name, revenue }));

    return {
        kpis: {
            totalRevenue: netFlow,
            profileViews: 0, // Not tracked
            newFollowers: 0, // Not tracked historically
            bookings: bookingCount
        },
        revenueOverTime,
        engagementOverTime: [], // Not tracked historically
        revenueSources
    };
};
