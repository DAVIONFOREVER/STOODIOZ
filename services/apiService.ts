
import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo, BaseUser, MixingDetails, Conversation, Label } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier, NotificationType } from '../types';
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

    // Safely query each table individually to prevent one failure from blocking all
    const safeSelect = async (table: string, select: string) => {
        try {
            const { data, error } = await supabase.from(table).select(select);
            if (error) {
                console.warn(`Error fetching ${table}:`, error.message);
                // Fallback to basic select if relation select fails
                if (error.code === 'PGRST200') {
                     const { data: retry } = await supabase.from(table).select('*');
                     return retry || [];
                }
                return [];
            }
            return data || [];
        } catch {
            return [];
        }
    };

    const [artists, engineers, producers, stoodioz] = await Promise.all([
        safeSelect('artists', '*'),
        safeSelect('engineers', '*, mixing_samples(*)'),
        safeSelect('producers', '*, instrumentals(*)'),
        safeSelect('stoodioz', '*, rooms(*), in_house_engineers(*)')
    ]);

    return {
        artists: (artists as Artist[]) || [],
        engineers: (engineers as Engineer[]) || [],
        producers: (producers as Producer[]) || [],
        stoodioz: (stoodioz as Stoodio[]) || []
    };
};

export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | Label | { email_confirmation_required: boolean } | null> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");

    let authUser = null;
    let session = null;

    // 1. Attempt Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
            data: {
                full_name: userData.name,
                user_role: role,
            }
        }
    });

    if (authError) {
        // If user already registered, try signing in to recover
        if (authError.message.includes("already registered") || authError.status === 400) {
            console.log("User exists, attempting sign-in...");
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password: userData.password,
            });
            
            if (signInError) {
                throw new Error("Account already exists, but login failed. Please check your password.");
            }
            authUser = signInData.user;
            session = signInData.session;
        } else {
            throw authError;
        }
    } else {
        authUser = authData.user;
        session = authData.session;
    }

    if (!authUser) throw new Error("No user returned from authentication service");

    // 2. Check if Email Verification is blocking login
    // If we have a user but no session, usually implies email confirmation is on and pending
    if (!session && !authUser.email_confirmed_at) {
        return { email_confirmation_required: true };
    }

    // 3. Upload Image if provided (Requires active session/RLS)
    let imageUrl = userData.image_url || USER_SILHOUETTE_URL;
    if (userData.imageFile && authUser) {
        try {
            imageUrl = await uploadAvatar(userData.imageFile, authUser.id);
        } catch (e) {
            console.warn("Avatar upload skipped due to network/auth issue", e);
        }
    }

    // 4. Create/Update Public Profile Record
    const profileData = {
        id: authUser.id,
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
        ...(role === 'LABEL' && {
            company_name: userData.company_name,
            contact_email: userData.email,
            contact_phone: userData.contact_phone,
            website: userData.website,
            notes: userData.notes,
            status: 'active',
            requires_contact: true,
            beta_override: true // Automatically approved for dashboard
        }),
        created_at: new Date().toISOString(),
    };

    let tableName: string;
    switch (role) {
        case UserRoleEnum.ARTIST: tableName = 'artists'; break;
        case UserRoleEnum.ENGINEER: tableName = 'engineers'; break;
        case UserRoleEnum.PRODUCER: tableName = 'producers'; break;
        case UserRoleEnum.STOODIO: tableName = 'stoodioz'; break;
        case UserRoleEnum.LABEL: tableName = 'labels'; break;
        default: 
            console.error("Invalid role passed to createUser:", role);
            throw new Error(`Invalid user role: ${role}`);
    }

    console.log(`Creating user in table: ${tableName}`, profileData);

    const { data, error } = await supabase
        .from(tableName)
        .upsert(profileData)
        .select()
        .single();

    if (error) {
        console.error(`Error inserting into ${tableName}:`, error);
        throw error;
    }
    
    return data;
};

export const updateUser = async (userId: string, table: string, updates: any) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
};

// ... existing code for other services ...
// (Rest of file kept intact, omitting for brevity as it is unchanged from your current version)
export const createBooking = async (request: BookingRequest, stoodio: Stoodio, booker: any, bookerRole: UserRole): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");

    const bookingData = {
        date: request.date,
        start_time: request.start_time,
        duration: request.duration,
        total_cost: request.total_cost,
        status: BookingStatus.CONFIRMED, 
        booked_by_id: booker.id,
        booked_by_role: bookerRole,
        request_type: request.request_type,
        engineer_pay_rate: request.engineer_pay_rate,
        stoodio_id: stoodio.id,
        room_id: request.room?.id,
        artist_id: bookerRole === 'ARTIST' ? booker.id : undefined,
        created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();
    if (error) throw error;
    
    return data;
};

export const createCheckoutSessionForBooking = async (bookingRequest: BookingRequest, stoodioId: string | undefined, userId: string, userRole: UserRole) => {
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
        comments: p.comments || [],
        display_mode: p.display_mode,
        focus_point: p.focus_point
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
        comments: p.comments || [],
        display_mode: p.display_mode,
        focus_point: p.focus_point
    }));
};

export const createPost = async (postData: any, author: any, authorType: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No DB");
    
    // Do NOT send 'id'. Let Supabase generate a valid UUID v4.
    const newPost = {
        author_id: author.id,
        author_type: authorType,
        text: postData.text,
        image_url: postData.image_url,
        video_url: postData.video_url,
        video_thumbnail_url: postData.video_thumbnail_url,
        link: postData.link,
        likes: [],
        comments: [], 
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('posts').insert(newPost).select().single();
    if (error) throw error;
    
    // Map DB result back to app format
    const formattedPost: Post = {
         id: data.id,
         authorId: data.author_id,
         authorType: data.author_type,
         text: data.text,
         image_url: data.image_url,
         video_url: data.video_url,
         video_thumbnail_url: data.video_thumbnail_url,
         link: data.link,
         timestamp: data.created_at,
         likes: data.likes || [],
         comments: data.comments || [],
         display_mode: data.display_mode,
         focus_point: data.focus_point
    };

    return { updatedAuthor: author, createdPost: formattedPost }; 
};

export const likePost = async (postId: string, userId: string, author: any) => {
    const supabase = getSupabase();
    if (!supabase) return { updatedAuthor: author };
    
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
    const supabase = getSupabase();
    if (!supabase) return { updatedAuthor: postAuthor };

    const { data: post } = await supabase.from('posts').select('comments').eq('id', postId).single();
    if (!post) return { updatedAuthor: postAuthor };

    // Use crypto.randomUUID() for valid UUID generation for comment ID
    const newComment = {
        id: crypto.randomUUID(),
        authorId: commenter.id,
        authorName: commenter.name,
        author_image_url: commenter.image_url,
        text,
        timestamp: new Date().toISOString()
    };

    const updatedComments = [...(post.comments || []), newComment];
    await supabase.from('posts').update({ comments: updatedComments }).eq('id', postId);

    return { updatedAuthor: postAuthor };
};

export const toggleFollow = async (currentUser: any, targetUser: any, type: string, isFollowing: boolean) => {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase disconnected: Follow toggle simulated locally.");
        return { updatedCurrentUser: currentUser, updatedTargetUser: targetUser };
    }

    // 1. Determine Origin User Type (Uppercase for SQL) and Table
    let originUserType = 'ARTIST';
    let originTable = 'artists';
    
    if ('amenities' in currentUser) { originUserType = 'STOODIO'; originTable = 'stoodioz'; }
    else if ('specialties' in currentUser) { originUserType = 'ENGINEER'; originTable = 'engineers'; }
    else if ('instrumentals' in currentUser) { originUserType = 'PRODUCER'; originTable = 'producers'; }
    
    // 2. Determine Target Table
    const targetTableMap: Record<string, string> = {
        'artist': 'artists',
        'engineer': 'engineers',
        'producer': 'producers',
        'stoodio': 'stoodioz'
    };
    const targetTable = targetTableMap[type];

    // 3. Call the Secure Database Function (RPC)
    const { error } = await supabase.rpc('toggle_follow', {
        origin_user_type: originUserType,
        target_user_id: targetUser.id,
        target_user_type: type // e.g., 'artist', 'engineer'
    });

    if (error) {
        console.error("RPC Error during follow:", error);
        throw error;
    }

    // 4. Send Notification (Only on follow)
    if (!isFollowing) {
        const notification = {
            recipient_id: targetUser.id,
            type: NotificationType.NEW_FOLLOWER,
            message: `${currentUser.name} started following you.`,
            read: false,
            actor_id: currentUser.id,
            timestamp: new Date().toISOString()
        };
        await supabase.from('notifications').insert(notification);
    }

    // 5. Fetch latest data to update local state seamlessly
    const getSelectQuery = (table: string) => {
        if (table === 'stoodioz') return '*, rooms(*), in_house_engineers(*)';
        if (table === 'engineers') return '*, mixing_samples(*)';
        if (table === 'producers') return '*, instrumentals(*)';
        return '*';
    };

    const { data: updatedCurrentUser } = await supabase
        .from(originTable)
        .select(getSelectQuery(originTable))
        .eq('id', currentUser.id)
        .single();

    const { data: updatedTargetUser } = await supabase
        .from(targetTable)
        .select(getSelectQuery(targetTable))
        .eq('id', targetUser.id)
        .single();

    return { 
        updatedCurrentUser: updatedCurrentUser || currentUser, 
        updatedTargetUser: updatedTargetUser || targetUser 
    };
};

// --- MESSAGING & REVIEWS (NEW REAL IMPL) ---

export const fetchConversations = async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    // Fetch conversations where user is a participant
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [userId]);
        
    if (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
    
    // For each conversation, fetch messages and participant details
    const fullConversations = await Promise.all(data.map(async (convo: any) => {
        // 1. Get messages
        const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: true });
            
        const formattedMessages = (msgs || []).map((m: any) => ({
            id: m.id,
            sender_id: m.sender_id,
            timestamp: m.created_at,
            type: m.message_type,
            text: m.content,
            image_url: m.media_url,
            audio_url: m.message_type === 'audio' ? m.media_url : undefined,
            files: m.file_attachments
        }));

        // 2. Get participants (other than self)
        const otherIds = convo.participant_ids;
        let participants: any[] = [];
        
        for (const pid of otherIds) {
             // Try fetching from each table until found. Optimized with Promise.any equivalent logic.
             const tables = ['artists', 'engineers', 'producers', 'stoodioz'];
             for(const t of tables) {
                 const { data: pData } = await supabase.from(t).select('id, name, image_url').eq('id', pid).maybeSingle();
                 if(pData) {
                     participants.push(pData);
                     break;
                 }
             }
        }

        return {
            id: convo.id,
            participants,
            messages: formattedMessages,
            unread_count: 0 // TODO: Calc based on read_by array
        };
    }));
    
    return fullConversations;
};

export const sendMessage = async (conversationId: string, senderId: string, content: string, type: string = 'text', fileData?: any) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const msgData = {
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
        message_type: type,
        // Map fileData to media_url or file_attachments correctly
        media_url: (type === 'image' || type === 'audio') ? fileData?.url : null,
        file_attachments: type === 'files' ? fileData : null
    };

    const { data, error } = await supabase.from('messages').insert(msgData).select().single();
    if (error) throw error;
    return data;
};

export const createConversation = async (participantIds: string[]) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    const { data, error } = await supabase
        .from('conversations')
        .insert({ participant_ids: participantIds })
        .select()
        .single();
        
    if (error) throw error;
    return data;
}

export const fetchReviews = async () => {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) return [];
    
    return data.map((r: any) => ({
        id: r.id,
        reviewer_name: 'Anonymous', // In real app, join with user table
        rating: r.rating,
        comment: r.comment,
        date: r.created_at,
        stoodio_id: r.target_user_id,
        engineer_id: r.target_user_id,
        producer_id: r.target_user_id,
    }));
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
    
    const booking = { id: crypto.randomUUID(), ...bookingData };
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
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // 1. Revenue (from wallet_transactions JSONB column)
    const tableMap: Record<string, string> = {
        'ARTIST': 'artists',
        'ENGINEER': 'engineers',
        'PRODUCER': 'producers',
        'STOODIO': 'stoodioz',
        'LABEL': 'labels'
    };
    
    const tableName = tableMap[role];
    if (!tableName) throw new Error("Invalid role");

    const { data: user, error: userError } = await supabase
        .from(tableName)
        .select('wallet_transactions')
        .eq('id', userId)
        .single();

    if (userError) throw userError;

    const transactions: Transaction[] = user?.wallet_transactions || [];
    
    const relevantTransactions = transactions.filter(t => 
        new Date(t.date) >= startDate && t.amount > 0
    );
    
    const totalRevenue = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);

    const revenueMap = new Map<string, number>();
    relevantTransactions.forEach(t => {
        const dateKey = t.date.split('T')[0];
        revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + t.amount);
    });
    const revenueOverTime = Array.from(revenueMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const sourceMap = new Map<string, number>();
    relevantTransactions.forEach(t => {
        const category = t.category || 'Other';
        sourceMap.set(category, (sourceMap.get(category) || 0) + t.amount);
    });
    const revenueSources = Array.from(sourceMap.entries()).map(([name, revenue]) => ({ name, revenue }));

    // 2. Bookings
    const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or(`engineer_id.eq.${userId},producer_id.eq.${userId},stoodio_id.eq.${userId}`)
        .gte('date', startDateStr)
        .eq('status', BookingStatus.CONFIRMED);
    
    // 3. New Followers
    const { count: newFollowersCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('type', NotificationType.NEW_FOLLOWER)
        .gte('timestamp', startDateStr);

    return {
        kpis: {
            totalRevenue,
            profileViews: 0, 
            newFollowers: newFollowersCount || 0,
            bookings: bookingsCount || 0,
        },
        revenueOverTime,
        engagementOverTime: [], 
        revenueSources
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
        const roomId = room.id && room.id.length > 10 ? room.id : crypto.randomUUID();
        const { data, error } = await supabase.from('rooms').upsert({
            ...room,
            id: roomId,
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
        const instId = inst.id && inst.id.length > 10 ? inst.id : crypto.randomUUID();
        await supabase.from('instrumentals').upsert({
            ...inst,
            id: instId,
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
        const sampleId = sample.id && sample.id.length > 10 ? sample.id : crypto.randomUUID();
        await supabase.from('mixing_samples').upsert({
            ...sample,
            id: sampleId,
            engineer_id: engineerId
        });
    }
};

export const deleteMixingSample = async (sampleId: string) => {
    const supabase = getSupabase();
    if(supabase) await supabase.from('mixing_samples').delete().eq('id', sampleId);
};
