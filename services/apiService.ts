
import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier } from '../types';
import { getSupabase } from '../lib/supabase';
import { USER_SILHOUETTE_URL } from '../constants';

// --- HELPER ---
// Timeout to prevent infinite hanging on uploads (60 seconds)
const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms/1000} seconds`)), ms));

// Generic upload function with timeout and error handling
const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
        const uploadPromise = supabase.storage.from(bucket).upload(path, file, { upsert: true });
        // Race against timeout
        const result: any = await Promise.race([uploadPromise, timeoutPromise(60000)]);
        
        if (result.error) throw result.error;

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return publicUrl;
    } catch (error: any) {
        console.error(`Upload failed to ${bucket}/${path}:`, error);
        // Fallback for demo if RLS fails
        return URL.createObjectURL(file);
    }
};

// --- UPLOAD WRAPPERS ---

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

// --- USER MANAGEMENT ---

export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
    });

    if (authError) throw authError;
    if (!authUser) return null;

    // Profile creation is handled in App.tsx completeSetup usually, 
    // but this is a fallback if we need to do it here.
    return null; 
};

export const updateUser = async (userId: string, table: string, updates: any) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

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

    // 1. Update Current User's "following" list
    const currentFollowing = { ...currentUser.following };
    const listKey = `${targetType}s` as keyof typeof currentFollowing; // e.g., 'artists', 'stoodioz'
    
    let newList = currentFollowing[listKey] || [];
    if (isFollowing) {
        newList = newList.filter((id: string) => id !== targetUser.id);
    } else {
        newList = [...newList, targetUser.id];
    }
    currentFollowing[listKey] = newList;

    // 2. Update Target User's "follower_ids" list
    let targetFollowers = targetUser.follower_ids || [];
    if (isFollowing) {
        targetFollowers = targetFollowers.filter((id: string) => id !== currentUser.id);
    } else {
        targetFollowers = [...targetFollowers, currentUser.id];
    }

    // Perform updates
    // Note: In a real app, you'd want to use array_append/array_remove or a junction table
    // For simplicity in this JSON-based structure:
    
    // Update Current User
    const { data: updatedCurrent } = await supabase
        .from(getUserTable(currentUser))
        .update({ following: currentFollowing })
        .eq('id', currentUser.id)
        .select()
        .single();

    // Update Target User
    const { data: updatedTarget } = await supabase
        .from(getUserTable(targetUser))
        .update({ 
            follower_ids: targetFollowers,
            followers: targetFollowers.length
        })
        .eq('id', targetUser.id)
        .select()
        .single();

    // Send notification if following
    if (!isFollowing) {
        // Add notification logic here if needed
    }

    return { updatedCurrentUser: updatedCurrent, updatedTargetUser: updatedTarget };
};

const getUserTable = (user: any) => {
    if ('amenities' in user) return 'stoodioz';
    if ('specialties' in user) return 'engineers';
    if ('instrumentals' in user) return 'producers';
    return 'artists';
};

export const submitForVerification = async (stoodioId: string, data: { googleBusinessProfileUrl: string, websiteUrl: string }) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    // In a real app, this would go to a 'verification_requests' table.
    // Here we update the profile status to PENDING.
    const { data: updatedStoodio, error } = await supabase
        .from('stoodioz')
        .update({ 
            verification_status: VerificationStatus.PENDING,
            // Store these fields if your schema supports them, or ignore for now
        })
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
        status: BookingStatus.PENDING, // Or CONFIRMED if auto-confirm
        booked_by_id: user.id,
        booked_by_role: userRole,
        stoodio: stoodio,
        posted_by: userRole, // If created by studio, it's a job post
    };

    // If it's a job post (created by studio), status is PENDING until accepted
    if (userRole === UserRoleEnum.STOODIO) {
         newBooking.status = BookingStatus.PENDING;
    } else {
        // If booked by artist, it might need approval
        newBooking.status = BookingStatus.PENDING_APPROVAL;
    }

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

    const status = response === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED; // Or DENIED

    const { data, error } = await supabase
        .from('bookings')
        .update({ 
            status,
            engineer: response === 'accept' ? responder : booking.engineer // Assign engineer if accepted
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
    
    // Trigger payout logic here in real backend
    
    return { updatedBooking: data as Booking };
};

// --- FINANCIALS (MOCKED STRIPE) ---

export const createCheckoutSessionForBooking = async (bookingRequest: BookingRequest, stoodioId: string | undefined, userId: string, userRole: UserRole) => {
    // In a real app, calls backend endpoint /create-checkout-session
    return { sessionId: 'mock_session_id_' + Date.now() };
};

export const createCheckoutSessionForWallet = async (amount: number, userId: string) => {
    return { sessionId: 'mock_wallet_session_' + Date.now() };
};

export const createCheckoutSessionForSubscription = async (planId: SubscriptionPlan, userId: string) => {
    return { sessionId: 'mock_sub_session_' + Date.now() };
};

export const initiatePayout = async (amount: number, userId: string) => {
    // Call backend to trigger payout via Stripe Connect
    return { success: true };
};

export const addTip = async (booking: Booking, amount: number) => {
    return { sessionId: 'mock_tip_session_' + Date.now() };
};

export const purchaseBeat = async (instrumental: Instrumental, type: 'lease' | 'exclusive', buyer: any, producer: Producer, userRole: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");
    
    const price = type === 'lease' ? instrumental.price_lease : instrumental.price_exclusive;
    
    // 1. Create Transaction
    const transaction: Transaction = {
        id: `txn-${Date.now()}`,
        date: new Date().toISOString(),
        description: `Beat Purchase: ${instrumental.title} (${type})`,
        amount: -price,
        category: TransactionCategory.BEAT_PURCHASE,
        status: TransactionStatus.COMPLETED,
        related_user_name: producer.name
    };

    // 2. Create "Booking" record to represent the purchase (so it shows in My Bookings)
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

    const { error: bookingError } = await supabase.from('bookings').insert(booking);
    if (bookingError) throw bookingError;

    // 3. Update Wallet
    const currentTransactions = buyer.wallet_transactions || [];
    const updatedTransactions = [...currentTransactions, transaction];

    const { error: userError } = await updateUser(buyer.id, getUserTable(buyer), { 
        wallet_balance: buyer.wallet_balance - price,
        wallet_transactions: updatedTransactions
    });

    if (userError) throw userError;

    return { updatedBooking: booking };
};

// --- SOCIAL ---

export const createPost = async (postData: any, user: any, userRole: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const newPost: Post = {
        id: `post-${Date.now()}`,
        authorId: user.id,
        authorType: userRole,
        text: postData.text,
        image_url: postData.image_url,
        video_url: postData.video_url,
        video_thumbnail_url: postData.video_thumbnail_url,
        link: postData.link,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
    };

    const currentPosts = user.posts || [];
    const updatedPosts = [newPost, ...currentPosts];

    // Determine table based on role or user object properties
    const table = getUserTable(user);

    const { data: updatedUser, error } = await supabase
        .from(table)
        .update({ posts: updatedPosts })
        .eq('id', user.id)
        .select()
        .single();

    if (error) throw error;
    return updatedUser;
};

export const likePost = async (postId: string, userId: string, author: any) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const posts = author.posts || [];
    const postIndex = posts.findIndex((p: Post) => p.id === postId);
    
    if (postIndex === -1) return author;

    const post = posts[postIndex];
    const isLiked = post.likes.includes(userId);
    
    let newLikes = [...post.likes];
    if (isLiked) {
        newLikes = newLikes.filter((id: string) => id !== userId);
    } else {
        newLikes.push(userId);
    }

    const updatedPost = { ...post, likes: newLikes };
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = updatedPost;

    const table = getUserTable(author);
    const { data: updatedAuthor, error } = await supabase
        .from(table)
        .update({ posts: updatedPosts })
        .eq('id', author.id)
        .select()
        .single();

    if (error) throw error;
    return updatedAuthor;
};

export const commentOnPost = async (postId: string, text: string, commenter: any, author: any) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const posts = author.posts || [];
    const postIndex = posts.findIndex((p: Post) => p.id === postId);

    if (postIndex === -1) return author;

    const newComment: Comment = {
        id: `comment-${Date.now()}`,
        authorId: commenter.id,
        authorName: commenter.name,
        author_image_url: commenter.image_url,
        text: text,
        timestamp: new Date().toISOString()
    };

    const post = posts[postIndex];
    const updatedPost = { ...post, comments: [...post.comments, newComment] };
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = updatedPost;

    const table = getUserTable(author);
    const { data: updatedAuthor, error } = await supabase
        .from(table)
        .update({ posts: updatedPosts })
        .eq('id', author.id)
        .select()
        .single();

    if (error) throw error;
    return updatedAuthor;
};

// --- CONTENT MANAGEMENT ---

export const upsertRoom = async (room: Room, stoodioId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    // First get current studio to append to rooms array
    const { data: studio, error: fetchError } = await supabase
        .from('stoodioz')
        .select('rooms')
        .eq('id', stoodioId)
        .single();
    
    if (fetchError) throw fetchError;

    const currentRooms: Room[] = studio.rooms || [];
    const roomIndex = currentRooms.findIndex(r => r.id === room.id);
    let updatedRooms = [...currentRooms];

    if (roomIndex >= 0) {
        updatedRooms[roomIndex] = room;
    } else {
        updatedRooms.push(room);
    }

    const { data: updatedStudio, error: updateError } = await supabase
        .from('stoodioz')
        .update({ rooms: updatedRooms })
        .eq('id', stoodioId)
        .select()
        .single();

    if (updateError) throw updateError;
    return updatedStudio;
};

export const deleteRoom = async (roomId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");
    
    // Get user session to identify which studio to update
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: studio, error: fetchError } = await supabase
        .from('stoodioz')
        .select('rooms')
        .eq('id', user.id)
        .single();

    if (fetchError) throw fetchError;

    const updatedRooms = (studio.rooms || []).filter((r: Room) => r.id !== roomId);

    const { error: updateError } = await supabase
        .from('stoodioz')
        .update({ rooms: updatedRooms })
        .eq('id', user.id);

    if (updateError) throw updateError;
};


export const upsertInstrumental = async (instrumental: Instrumental, producerId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: producer, error: fetchError } = await supabase
        .from('producers')
        .select('instrumentals')
        .eq('id', producerId)
        .single();
    
    if (fetchError) throw fetchError;

    const currentBeats: Instrumental[] = producer.instrumentals || [];
    const index = currentBeats.findIndex(i => i.id === instrumental.id);
    let updatedBeats = [...currentBeats];

    if (index >= 0) {
        updatedBeats[index] = instrumental;
    } else {
        updatedBeats.push(instrumental);
    }

    const { error: updateError } = await supabase
        .from('producers')
        .update({ instrumentals: updatedBeats })
        .eq('id', producerId);

    if (updateError) throw updateError;
};


export const deleteInstrumental = async (instrumentalId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: producer, error: fetchError } = await supabase
        .from('producers')
        .select('instrumentals')
        .eq('id', user.id)
        .single();

    if (fetchError) throw fetchError;

    const updatedBeats = (producer.instrumentals || []).filter((i: Instrumental) => i.id !== instrumentalId);

    const { error: updateError } = await supabase
        .from('producers')
        .update({ instrumentals: updatedBeats })
        .eq('id', user.id);

    if (updateError) throw updateError;
};

export const upsertMixingSample = async (sample: MixingSample, engineerId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: engineer, error: fetchError } = await supabase
        .from('engineers')
        .select('mixing_samples')
        .eq('id', engineerId)
        .single();
    
    if (fetchError) throw fetchError;

    const currentSamples: MixingSample[] = engineer.mixing_samples || [];
    const index = currentSamples.findIndex(s => s.id === sample.id);
    let updatedSamples = [...currentSamples];

    if (index >= 0) {
        updatedSamples[index] = sample;
    } else {
        updatedSamples.push(sample);
    }

    const { error: updateError } = await supabase
        .from('engineers')
        .update({ mixing_samples: updatedSamples })
        .eq('id', engineerId);

    if (updateError) throw updateError;
};

export const deleteMixingSample = async (sampleId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: engineer, error: fetchError } = await supabase
        .from('engineers')
        .select('mixing_samples')
        .eq('id', user.id)
        .single();

    if (fetchError) throw fetchError;

    const updatedSamples = (engineer.mixing_samples || []).filter((s: MixingSample) => s.id !== sampleId);

    const { error: updateError } = await supabase
        .from('engineers')
        .update({ mixing_samples: updatedSamples })
        .eq('id', user.id);

    if (updateError) throw updateError;
};


export const upsertInHouseEngineer = async (info: InHouseEngineerInfo, stoodioId: string) => {
     const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: studio, error: fetchError } = await supabase
        .from('stoodioz')
        .select('in_house_engineers')
        .eq('id', stoodioId)
        .single();
    
    if (fetchError) throw fetchError;

    const currentEngineers: InHouseEngineerInfo[] = studio.in_house_engineers || [];
    // Check if already exists
    const index = currentEngineers.findIndex(e => e.engineer_id === info.engineer_id);
    let updatedEngineers = [...currentEngineers];

    if (index >= 0) {
        updatedEngineers[index] = info;
    } else {
        updatedEngineers.push(info);
    }

    const { error: updateError } = await supabase
        .from('stoodioz')
        .update({ in_house_engineers: updatedEngineers })
        .eq('id', stoodioId);

    if (updateError) throw updateError;
};

export const deleteInHouseEngineer = async (engineerId: string, stoodioId: string) => {
     const supabase = getSupabase();
    if (!supabase) throw new Error("No Supabase client");

    const { data: studio, error: fetchError } = await supabase
        .from('stoodioz')
        .select('in_house_engineers')
        .eq('id', stoodioId)
        .single();
    
    if (fetchError) throw fetchError;

    const updatedEngineers = (studio.in_house_engineers || []).filter((e: InHouseEngineerInfo) => e.engineer_id !== engineerId);

    const { error: updateError } = await supabase
        .from('stoodioz')
        .update({ in_house_engineers: updatedEngineers })
        .eq('id', stoodioId);

    if (updateError) throw updateError;
};

export const fetchAnalyticsData = async (userId: string, userRole: UserRole, days: number): Promise<AnalyticsData> => {
    // In a real app, this would query the database for aggregations.
    // For this demo, we mock the data structure.
    
    const mockData: AnalyticsData = {
        kpis: {
            totalRevenue: 12500,
            profileViews: 3450,
            newFollowers: 120,
            bookings: 45
        },
        revenueOverTime: Array.from({ length: 10 }, (_, i) => ({
            date: new Date(Date.now() - i * 86400000).toISOString(),
            revenue: Math.floor(Math.random() * 500) + 100
        })).reverse(),
        engagementOverTime: Array.from({ length: 10 }, (_, i) => ({
            date: new Date(Date.now() - i * 86400000).toISOString(),
            views: Math.floor(Math.random() * 200),
            followers: Math.floor(Math.random() * 10),
            likes: Math.floor(Math.random() * 50)
        })).reverse(),
        revenueSources: [
            { name: 'Bookings', revenue: 8000 },
            { name: 'Tips', revenue: 500 },
            { name: 'Mixing', revenue: 4000 }
        ]
    };
    
    return mockData;
};
