
import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo, BaseUser, MixingDetails, Conversation, Label, LabelContract, RosterMember } from '../types';
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
    stoodioz: Stoodio[],
    labels: Label[]
}> => {
    const supabase = getSupabase();
    if (!supabase) return { artists: [], engineers: [], producers: [], stoodioz: [], labels: [] };

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

    const [artists, engineers, producers, stoodioz, labels] = await Promise.all([
        safeSelect('artists', '*'),
        safeSelect('engineers', '*, mixing_samples(*)'),
        safeSelect('producers', '*, instrumentals(*)'),
        safeSelect('stoodioz', '*, rooms(*), in_house_engineers(*)'),
        safeSelect('labels', '*')
    ]);

    return {
        artists: (artists as Artist[]) || [],
        engineers: (engineers as Engineer[]) || [],
        producers: (producers as Producer[]) || [],
        stoodioz: (stoodioz as Stoodio[]) || [],
        labels: (labels as Label[]) || []
    };
};

export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | Label | { email_confirmation_required: boolean } | null> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");

    let authUser = null;
    let session = null;

    // 1. Attempt Sign Up
    const { data: authData, error: authError } = await (supabase.auth as any).signUp({
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
        if (authError.message.includes("already registered") || authError.status === 400) {
            console.log("User exists, attempting sign-in...");
            const { data: signInData, error: signInError } = await (supabase.auth as any).signInWithPassword({
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

    if (!session && !authUser.email_confirmed_at) {
        return { email_confirmation_required: true };
    }

    let imageUrl = USER_SILHOUETTE_URL;
    if (userData.imageFile && authUser) {
        try {
            // Using a more specific path for label logos
            const filePath = `label-logos/${authUser.id}.${(userData.imageFile as File).name.split('.').pop()}`;
            imageUrl = await uploadFile(userData.imageFile, 'avatars', filePath);
        } catch (e) {
            console.warn("Logo upload skipped due to network/auth issue", e);
        }
    }

    // 4. Create Public Profile Record
    let profileData: any;
    const tableMap: Record<string, string> = {
        'ARTIST': 'artists',
        'ENGINEER': 'engineers',
        'PRODUCER': 'producers',
        'STOODIO': 'stoodioz',
        'LABEL': 'labels'
    };
    
    if (role === 'LABEL') {
        profileData = {
            id: authUser.id,
            name: userData.name,
            email: userData.email,
            image_url: imageUrl,
            bio: userData.bio,
            company_name: userData.companyName,
            contact_phone: userData.contactPhone,
            website: userData.website,
            wallet_balance: 0,
            wallet_transactions: [],
        };
    } else {
        profileData = {
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
        };
    }

    const tableName = tableMap[role];
    if (!tableName) {
        throw new Error(`Invalid or unsupported role: ${role}`);
    }

    const { data, error } = await supabase
        .from(tableName)
        .upsert(profileData)
        .select()
        .single();

    if (error) {
        // Rollback auth user if profile creation fails
        await (supabase.auth.admin as any).deleteUser(authUser.id);
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

// ... (rest of the apiService file remains unchanged)
// --- LABEL CONTRACTS & REVENUE ROUTING ---

export const fetchLabelContracts = async (labelId: string): Promise<LabelContract[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('label_contracts')
        .select('*')
        .eq('label_id', labelId);
        
    if (error) {
        console.error("Error fetching label contracts:", error);
        return [];
    }
    return data as LabelContract[];
};

export const fetchActiveLabelContractForTalent = async (talentUserId: string): Promise<LabelContract | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('label_contracts')
        .select('*')
        .eq('talent_user_id', talentUserId)
        .eq('status', 'active')
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore "No rows found"
        console.error("Error fetching active contract:", error);
    }
    return data as LabelContract | null;
};

export const updateLabelContractRecoupBalance = async (contractId: string, amountToDeduct: number) => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Use RPC or get-then-update. For simulation, get then update.
    const { data: contract } = await supabase
        .from('label_contracts')
        .select('recoup_balance')
        .eq('id', contractId)
        .single();
    
    if (contract) {
        const newBalance = Math.max(0, contract.recoup_balance - amountToDeduct);
        await supabase
            .from('label_contracts')
            .update({ recoup_balance: newBalance })
            .eq('id', contractId);
    }
};

const updateWallet = async (userId: string, table: string, amount: number, transaction: Transaction) => {
    const supabase = getSupabase();
    if (!supabase) return;

    // 1. Get current user data
    const { data: user } = await supabase
        .from(table)
        .select('wallet_balance, wallet_transactions')
        .eq('id', userId)
        .single();

    if (user) {
        const newBalance = (user.wallet_balance || 0) + amount;
        const newTransactions = [...(user.wallet_transactions || []), transaction];
        
        await supabase
            .from(table)
            .update({
                wallet_balance: newBalance,
                wallet_transactions: newTransactions
            })
            .eq('id', userId);
    }
};

export const applyLabelRevenueRouting = async (booking: Booking, totalPayout: number) => {
    const supabase = getSupabase();
    if (!supabase) return;

    let providerId: string | undefined;
    let providerRole: string | undefined;
    let providerTable: string | undefined;

    // Determine provider
    if (booking.engineer) {
        providerId = booking.engineer.id;
        providerRole = 'ENGINEER';
        providerTable = 'engineers';
    } else if (booking.producer) {
        providerId = booking.producer.id;
        providerRole = 'PRODUCER';
        providerTable = 'producers';
    } else {
        // Just a room booking or other case not subject to label routing for now
        // In real world, studio might be owned by label too, but let's stick to prompt requirements (talent)
        return; 
    }

    if (!providerId || !providerTable) return;

    // 1. Check for active contract
    const contract = await fetchActiveLabelContractForTalent(providerId);

    // If no contract, provider keeps all (handled by standard logic usually, but here we enforce updates)
    if (!contract) {
        const tx: Transaction = {
            id: `txn-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Session Payout: ${booking.stoodio?.name || 'Remote'}`,
            amount: totalPayout,
            category: TransactionCategory.SESSION_PAYOUT,
            status: TransactionStatus.COMPLETED,
            related_booking_id: booking.id
        };
        await updateWallet(providerId, providerTable, totalPayout, tx);
        return;
    }

    // 2. Contract Logic
    let labelAmount = 0;
    let providerAmount = 0;
    let recoupApplied = 0;

    if (contract.contract_type === 'FULL_RECOUP') {
        if (contract.recoup_balance > 0) {
            // Label takes everything up to balance
            const taken = Math.min(totalPayout, contract.recoup_balance);
            labelAmount = taken;
            providerAmount = totalPayout - taken;
            recoupApplied = taken;
        } else {
            // Recoup done, assuming provider gets 100% or fallback? 
            // Prompt says: "Label keeps 100% until recoup_balance reaches 0." 
            // Implies after that, provider gets it, or a different split kicks in. 
            // We'll assume provider gets remainder if balance is 0.
            providerAmount = totalPayout;
        }
    } else if (contract.contract_type === 'PERCENTAGE') {
        // Label takes split_percent
        labelAmount = totalPayout * (contract.split_percent / 100);
        providerAmount = totalPayout - labelAmount;

        // If recoup balance exists, label's portion goes to recoup
        if (contract.recoup_balance > 0) {
            recoupApplied = Math.min(labelAmount, contract.recoup_balance);
        }
    }

    // 3. Update Wallets & Contract
    
    // Label Wallet Update
    if (labelAmount > 0) {
        const labelTx: Transaction = {
            id: `txn-lbl-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Contract Revenue: ${booking.id}`,
            amount: labelAmount,
            category: TransactionCategory.CONTRACT_PAYOUT,
            status: TransactionStatus.COMPLETED,
            related_booking_id: booking.id,
            contract_id: contract.id,
            recoup_applied: recoupApplied,
            provider_amount: providerAmount
        };
        await updateWallet(contract.label_id, 'labels', labelAmount, labelTx);
    }

    // Provider Wallet Update
    if (providerAmount > 0) {
        const providerTx: Transaction = {
            id: `txn-prv-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Session Payout (Split): ${booking.stoodio?.name || 'Remote'}`,
            amount: providerAmount,
            category: TransactionCategory.SESSION_PAYOUT,
            status: TransactionStatus.COMPLETED,
            related_booking_id: booking.id,
            contract_id: contract.id,
            label_amount: labelAmount
        };
        await updateWallet(providerId, providerTable, providerAmount, providerTx);
    } else {
        // Create a 0 amount transaction or notification to show money was taken for recoup
        const providerTx: Transaction = {
            id: `txn-prv-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Session Revenue (Recoup Applied 100%)`,
            amount: 0,
            category: TransactionCategory.CONTRACT_RECOUP,
            status: TransactionStatus.COMPLETED,
            related_booking_id: booking.id,
            contract_id: contract.id,
            label_amount: labelAmount,
            recoup_applied: recoupApplied
        };
        await updateWallet(providerId, providerTable, 0, providerTx);
    }

    // Contract Balance Update
    if (recoupApplied > 0) {
        await updateLabelContractRecoupBalance(contract.id, recoupApplied);
    }
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
    else if ('bio' in currentUser && !('is_seeking_session' in currentUser)) { originUserType = 'LABEL'; originTable = 'labels'; }
    
    // 2. Determine Target Table
    const targetTableMap: Record<string, string> = {
        'artist': 'artists',
        'engineer': 'engineers',
        'producer': 'producers',
        'stoodio': 'stoodioz',
        'label': 'labels'
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
             const tables = ['artists', 'engineers', 'producers', 'stoodioz', 'labels'];
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
    
    // --- LABEL MESSAGING PERMISSION RULES ---
    const [senderId, receiverId] = participantIds;

    // Mock role detection (replace later)
    const senderIsLabel = senderId?.startsWith("label_");
    const receiverIsLabel = receiverId?.startsWith("label_");

    // RULE 1: Labels can message ANYONE → always allow
    if (senderIsLabel) {
        // continue normally, do NOT block
    } 
    // RULE 2: Non-labels cannot message labels unless on roster
    else if (receiverIsLabel) {
        const userIsOnRoster = false; // TODO: real roster check later
        if (!userIsOnRoster) {
            return {
                blocked_by_label_permissions: true,
                reason: "NOT_ON_ROSTER",
                sender_id: senderId,
                receiver_id: receiverId
            };
        }
    }

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
        
        // --- REVENUE ROUTING LOGIC ---
        // Calculate total earnings for the provider (Engineer/Producer)
        // Usually engineer_pay_rate * duration, or fixed fee
        const grossEarnings = booking.engineer_pay_rate * booking.duration; 
        
        // Execute revenue routing if a contract exists
        await applyLabelRevenueRouting(booking, grossEarnings);

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

export const markArtistLabelClaimed = async (artistId: string, labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('artists')
        .update({ label_id: labelId })
        .eq('id', artistId)
        .select()
        .single();

    if (error) {
        console.error("Error claiming label:", error);
        throw error;
    }
    return data;
};

// --- FIX START: Add missing label roster functions ---

// --- LABEL ROSTER MANAGEMENT ---

export const getRosterActivity = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.rpc("get_roster_activity", {
        p_label_id: labelId // Ensure parameter name matches SQL function
    });

    if (error) {
        console.error("Error fetching roster activity:", error);
        return [];
    }

    return data || [];
};

export const fetchLabelRoster = async (labelId: string): Promise<RosterMember[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: rosterEntries, error: rosterError } = await supabase
        .from('label_roster')
        .select('*, artist:artists(*)')
        .eq('label_id', labelId);

    if (rosterError) {
        console.error("Error fetching roster:", rosterError);
        return [];
    }

    const activityList = await getRosterActivity(labelId);
    const activityMap = Object.fromEntries(
        (activityList || []).map((a: any) => [a.user_id, a])
    );

    const hydratedRoster: RosterMember[] = [];

    for (const entry of rosterEntries || []) {
        if (!entry.user_id) {
            hydratedRoster.push({
                id: entry.id,
                name: entry.email || 'Pending Invite',
                email: entry.email,
                image_url: USER_SILHOUETTE_URL,
                role_in_label: entry.role,
                roster_id: entry.id,
                is_pending: true,
                followers: 0,
                follower_ids: [],
                following: { artists: [], engineers: [], producers: [], stoodioz: [], videographers: [], labels: [] },
                wallet_balance: 0,
                wallet_transactions: [],
                coordinates: { lat: 0, lon: 0 },
                show_on_map: false,
                is_online: false,
                rating_overall: 0,
                sessions_completed: 0,
                ranking_tier: 'Provisional' as any,
                is_on_streak: false,
                on_time_rate: 0,
                completion_rate: 0,
                repeat_hire_rate: 0,
                strength_tags: [],
                local_rank_text: '',
                posts_created: 0,
                uploads_count: 0,
                mixes_delivered: 0,
                output_score: 0,
                claim_token: entry.claim_token
            });
            continue;
        }

        let userData = null;
        let shadowProfile = false;

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', entry.user_id).single();
        if (profile && profile.role === 'UNCLAIMED') {
            shadowProfile = true;
        }

        const tables = ['artists', 'producers', 'engineers'];
        for (const table of tables) {
            const { data } = await supabase.from(table).select('*').eq('id', entry.user_id).single();
            if (data) {
                userData = data;
                break;
            }
        }

        if (userData) {
            const act = activityMap[entry.user_id] || {};
            const sessions = act.sessions_completed || userData.sessions_completed || 0;
            const posts = act.posts_created || 0;
            const uploads = act.uploads_count || 0;
            const mixes = act.mixes_delivered || 0;
            const outputScore = act.output_score || ((sessions * 3) + (posts * 1) + (uploads * 2));

            hydratedRoster.push({
                ...userData,
                role_in_label: entry.role,
                roster_id: entry.id,
                shadow_profile: shadowProfile,
                claim_code: entry.claim_code,
                claim_token: entry.claim_token,
                sessions_completed: sessions,
                mixes_delivered: mixes,
                songs_finished: (userData as any).songs_finished || 0,
                avg_session_rating: (userData as any).avg_session_rating || null,
                engagement_score: (userData as any).engagement_score || 0,
                posts_created: posts,
                uploads_count: uploads,
                output_score: outputScore
            });
        }
    }

    return hydratedRoster;
};

export const addArtistToLabelRoster = async (params: { labelId: string, artistId?: string, email?: string, role?: string }) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { labelId, artistId, email, role } = params;

    const newRosterEntry = {
        id: crypto.randomUUID(),
        label_id: labelId,
        user_id: artistId || null, 
        email: email || null,      
        role: role || 'Artist',
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('label_roster')
        .insert(newRosterEntry)
        .select()
        .single();

    if (error) {
        console.error("Error adding to roster:", error);
        throw error;
    }

    if (artistId) {
        await supabase
            .from('artists')
            .update({ label_id: labelId })
            .eq('id', artistId);
    }

    return data;
};

export const removeArtistFromLabelRoster = async (labelId: string, rosterId: string, artistId?: string) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
        .from('label_roster')
        .delete()
        .eq('id', rosterId);

    if (error) {
        console.error("Error removing from roster:", error);
        return false;
    }

    if (artistId) {
        await supabase
            .from('artists')
            .update({ label_id: null })
            .eq('id', artistId)
            .eq('label_id', labelId); 
    }

    return true;
};
// --- FIX END ---
