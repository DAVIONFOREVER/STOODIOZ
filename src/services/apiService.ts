
import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo, BaseUser, MixingDetails, Conversation, Label, LabelContract, RosterMember, LabelBudgetOverview, LabelBudgetMode } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier, NotificationType } from '../types';
import { getSupabase } from '../lib/supabase';
import { USER_SILHOUETTE_URL } from '../constants';
import { generateInvoicePDF } from '../lib/pdf';

// ... (previous imports and helper functions remain unchanged)

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

    const safeSelect = async (table: string, select: string) => {
        try {
            const { data, error } = await supabase.from(table).select(select);
            if (error) {
                console.warn(`Error fetching ${table}:`, error.message);
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

    let imageUrl = userData.image_url || USER_SILHOUETTE_URL;
    if (userData.imageFile && authUser) {
        try {
            imageUrl = await uploadAvatar(userData.imageFile, authUser.id);
        } catch (e) {
            console.warn("Avatar upload skipped due to network/auth issue", e);
        }
    }

    const profileData = {
        id: authUser.id,
        email: userData.email,
        name: userData.name,
        image_url: imageUrl,
        ...(role === 'ARTIST' && { bio: userData.bio }),
        ...(role === 'ENGINEER' && { bio: userData.bio, specialties: [] }),
        ...(role === 'PRODUCER' && { bio: userData.bio, genres: [] }),
        ...(role === 'LABEL' && { bio: userData.bio }),
        ...(role === 'STOODIO' && { 
            description: userData.description, 
            location: userData.location, 
            business_address: userData.businessAddress, 
            amenities: [], 
            rooms: [] 
        }),
        created_at: new Date().toISOString(),
    };

    const tableMap: Record<string, string> = {
        'ARTIST': 'artists',
        'ENGINEER': 'engineers',
        'PRODUCER': 'producers',
        'STOODIO': 'stoodioz',
        'LABEL': 'labels'
    };

    if (!tableMap[role]) {
        throw new Error(`Invalid or unsupported role: ${role}`);
    }

    const { data, error } = await supabase
        .from(tableMap[role])
        .upsert(profileData)
        .select()
        .single();

    if (error) {
        if (error.code === '42P01') { 
             throw new Error(`System Error: The '${tableMap[role]}' table does not exist in the database. Please run the migration script.`);
        }
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

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching active contract:", error);
    }
    return data as LabelContract | null;
};

export const updateLabelContractRecoupBalance = async (contractId: string, amountToDeduct: number) => {
    const supabase = getSupabase();
    if (!supabase) return;

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

export const fetchLabelBookings = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.rpc("get_label_bookings", {
        label_id: labelId
    });

    if (error) {
        console.error("Error fetching label bookings:", error);
        return [];
    }

    return data;
};

const updateWallet = async (userId: string, table: string, amount: number, transaction: Transaction) => {
    const supabase = getSupabase();
    if (!supabase) return;

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

    if (booking.engineer) {
        providerId = booking.engineer.id;
        providerRole = 'ENGINEER';
        providerTable = 'engineers';
    } else if (booking.producer) {
        providerId = booking.producer.id;
        providerRole = 'PRODUCER';
        providerTable = 'producers';
    } else {
        return; 
    }

    if (!providerId || !providerTable) return;

    const contract = await fetchActiveLabelContractForTalent(providerId);

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

    let labelAmount = 0;
    let providerAmount = 0;
    let recoupApplied = 0;

    if (contract.contract_type === 'FULL_RECOUP') {
        if (contract.recoup_balance > 0) {
            const taken = Math.min(totalPayout, contract.recoup_balance);
            labelAmount = taken;
            providerAmount = totalPayout - taken;
            recoupApplied = taken;
        } else {
            providerAmount = totalPayout;
        }
    } else if (contract.contract_type === 'PERCENTAGE') {
        labelAmount = totalPayout * (contract.split_percent / 100);
        providerAmount = totalPayout - labelAmount;

        if (contract.recoup_balance > 0) {
            recoupApplied = Math.min(labelAmount, contract.recoup_balance);
        }
    }

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

    if (recoupApplied > 0) {
        await updateLabelContractRecoupBalance(contract.id, recoupApplied);
    }
};

// --- LABEL BUDGETS (FINANCE) ---

export const getLabelBudgetOverview = async (labelId: string): Promise<LabelBudgetOverview | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase.rpc('get_label_budget_overview', { p_label_id: labelId });
        if (error) throw error;
        return data as LabelBudgetOverview;
    } catch (e) {
        // Fallback: Fetch tables manually
        const { data: budget } = await supabase.from('label_budgets').select('*').eq('label_id', labelId).maybeSingle();
        const { data: roster } = await supabase.from('label_artist_budgets').select('*, artist:artists(name, image_url)').eq('label_id', labelId);
        
        const artists = (roster || []).map((r: any) => ({
            artist_id: r.artist_id,
            artist_name: r.artist?.name || 'Unknown Artist',
            artist_image_url: r.artist?.image_url || USER_SILHOUETTE_URL,
            allocation_amount: r.allocation_amount,
            amount_spent: r.amount_spent
        }));

        return {
            budget: budget || null,
            artists: artists
        };
    }
};

export const setLabelBudget = async (labelId: string, totalBudget: number) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    const currentYear = new Date().getFullYear().toString();

    const { data, error } = await supabase
        .from('label_budgets')
        .upsert(
            { label_id: labelId, total_budget: totalBudget, fiscal_year: currentYear },
            { onConflict: 'label_id, fiscal_year' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const setArtistAllocation = async (labelId: string, artistId: string, allocation: number) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('label_artist_budgets')
        .upsert(
            { label_id: labelId, artist_id: artistId, allocation_amount: allocation },
            { onConflict: 'label_id, artist_id' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
};

// NEW FINANCE FUNCTIONS
export const updateLabelBudgetMode = async (labelId: string, mode: LabelBudgetMode, monthlyAllowance?: number, resetDay?: number) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const currentYear = new Date().getFullYear().toString();

    // Upsert budget record with new settings
    const { data, error } = await supabase
        .from('label_budgets')
        .upsert(
            { 
                label_id: labelId, 
                budget_mode: mode, 
                monthly_allowance: monthlyAllowance,
                reset_day: resetDay,
                fiscal_year: currentYear
            },
            { onConflict: 'label_id, fiscal_year' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const addLabelFunds = async (labelId: string, amount: number, note: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Ideally this is a transaction RPC. Simulating with client-side calls.
    // 1. Get current budget
    const currentYear = new Date().getFullYear().toString();
    const { data: budget } = await supabase.from('label_budgets').select('*').eq('label_id', labelId).eq('fiscal_year', currentYear).single();

    const newTotal = (budget?.total_budget || 0) + amount;

    // 2. Update budget
    await supabase
        .from('label_budgets')
        .upsert(
            { label_id: labelId, total_budget: newTotal, fiscal_year: currentYear },
            { onConflict: 'label_id, fiscal_year' }
        );

    // 3. Create Transaction Record
    const tx: Transaction = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        description: note || 'Manual Top-Up',
        amount: amount,
        category: TransactionCategory.LABEL_TOP_UP,
        status: TransactionStatus.COMPLETED,
        label_id: labelId,
        source: 'Manual'
    };

    // We store label transactions in the `labels` table wallet_transactions for now
    // Fetch current user tx
    const { data: labelUser } = await supabase.from('labels').select('wallet_transactions').eq('id', labelId).single();
    const newTxns = [...(labelUser?.wallet_transactions || []), tx];
    
    await supabase.from('labels').update({ wallet_transactions: newTxns }).eq('id', labelId);
    
    return true;
};

export const fetchLabelTransactions = async (labelId: string): Promise<Transaction[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: labelUser, error } = await supabase
        .from('labels')
        .select('wallet_transactions')
        .eq('id', labelId)
        .single();
    
    if (error || !labelUser) return [];

    // Filter or sort as needed
    return (labelUser.wallet_transactions || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ... (Rest of existing functions for bookings, posts, social, messaging etc)

export const createBooking = async (request: BookingRequest, stoodio: Stoodio, booker: any, bookerRole: UserRole): Promise<Booking> => {
    // ... implementation unchanged
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

    let originUserType = 'ARTIST';
    let originTable = 'artists';
    
    if ('amenities' in currentUser) { originUserType = 'STOODIO'; originTable = 'stoodioz'; }
    else if ('specialties' in currentUser) { originUserType = 'ENGINEER'; originTable = 'engineers'; }
    else if ('instrumentals' in currentUser) { originUserType = 'PRODUCER'; originTable = 'producers'; }
    else if ('bio' in currentUser && !('is_seeking_session' in currentUser)) { originUserType = 'LABEL'; originTable = 'labels'; }
    
    const targetTableMap: Record<string, string> = {
        'artist': 'artists',
        'engineer': 'engineers',
        'producer': 'producers',
        'stoodio': 'stoodioz',
        'label': 'labels'
    };
    const targetTable = targetTableMap[type];

    const { error } = await supabase.rpc('toggle_follow', {
        origin_user_type: originUserType,
        target_user_id: targetUser.id,
        target_user_type: type 
    });

    if (error) {
        console.error("RPC Error during follow:", error);
        throw error;
    }

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

export const fetchConversations = async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [userId]);
        
    if (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
    
    const fullConversations = await Promise.all(data.map(async (convo: any) => {
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

        const otherIds = convo.participant_ids;
        let participants: any[] = [];
        
        for (const pid of otherIds) {
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
            unread_count: 0
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
    
    const [senderId, receiverId] = participantIds;
    const senderIsLabel = senderId?.startsWith("label_");
    const receiverIsLabel = receiverId?.startsWith("label_");

    if (senderIsLabel) {
        // continue
    } 
    else if (receiverIsLabel) {
        const userIsOnRoster = false; // Placeholder roster check
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
        reviewer_name: 'Anonymous',
        rating: r.rating,
        comment: r.comment,
        date: r.created_at,
        stoodio_id: r.target_user_id,
        engineer_id: r.target_user_id,
        producer_id: r.target_user_id,
    }));
};

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
        
        const grossEarnings = booking.engineer_pay_rate * booking.duration; 
        
        await applyLabelRevenueRouting(booking, grossEarnings);

        const talentId = booking.engineer?.id || booking.producer?.id;
        if (talentId) {
            const activeContract = await fetchActiveLabelContractForTalent(talentId);
            if (activeContract) {
                await supabase.from("notifications").insert({
                    recipient_id: activeContract.label_id,
                    type: "LABEL_SESSION_COMPLETE" as any,
                    message: `Session completed for contracted talent. Contract ID: ${activeContract.id}`,
                    read: false,
                    timestamp: new Date().toISOString(),
                });
            }
        }

        return { updatedBooking: data || { ...booking, status: BookingStatus.COMPLETED } };
    }
    return { updatedBooking: { ...booking, status: BookingStatus.COMPLETED } };
};

export const addTip = async (booking: Booking, amount: number) => {
    return { sessionId: 'mock_tip_session' };
};

// ... (Rest of existing functions for analytics, verification, roster, claim etc remain unchanged)
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

export const getClaimDetails = async (token: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error: rosterError } = await supabase
        .from('label_roster')
        .select('role, email, labels(name)')
        .eq('claim_token', token)
        .eq('claimed', false)
        .maybeSingle();

    // FIX: `error` was aliased to `rosterError` but `error` was used.
    if (rosterError || !data) {
        console.warn("Invalid or expired claim token", rosterError);
        return null;
    }

    return {
        role: data.role,
        email: data.email,
        labelName: data.labels ? (data.labels as any).name : 'Unknown Label'
    };
};

export const claimProfileByToken = async (token: string, authUserId: string): Promise<{ role: UserRole; profileId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");

    const { data: rosterEntry, error: fetchError } = await supabase
        .from('label_roster')
        .select('*')
        .eq('claim_token', token)
        .eq('claimed', false)
        .single();

    if (fetchError || !rosterEntry) {
        throw new Error('Invalid or already used claim token');
    }

    return processProfileClaim(rosterEntry, authUserId, supabase);
};

export const claimProfileByCode = async (code: string, authUserId: string): Promise<{ role: UserRole; profileId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");

    const { data: rosterEntry, error: fetchError } = await supabase
        .from('label_roster')
        .select('*')
        .eq('claim_code', code)
        .eq('claimed', false)
        .single();

    if (fetchError || !rosterEntry) {
        throw new Error('Invalid or already used claim code');
    }

    return processProfileClaim(rosterEntry, authUserId, supabase);
};

const processProfileClaim = async (rosterEntry: any, authUserId: string, supabase: any): Promise<{ role: UserRole; profileId: string }> => {
    const roleString = (rosterEntry.role || 'Artist').toUpperCase();
    let userRole: UserRole = UserRoleEnum.ARTIST;
    let tableName = 'artists';

    if (roleString === 'ENGINEER') {
        userRole = UserRoleEnum.ENGINEER;
        tableName = 'engineers';
    } else if (roleString === 'PRODUCER') {
        userRole = UserRoleEnum.PRODUCER;
        tableName = 'producers';
    }

    await supabase.from('label_roster').update({
        claimed: true,
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: authUserId,
        user_id: authUserId,
        claim_token: null,
        claim_code: null
    }).eq('id', rosterEntry.id);

    await supabase.from('profiles').upsert({
        id: authUserId,
        role: userRole,
    });

    const { data: existingUser } = await supabase.from(tableName).select('id').eq('id', authUserId).single();

    if (!existingUser) {
        await supabase.from(tableName).insert({
            id: authUserId,
            name: 'Claimed Account',
            email: 'claimed@user.com',
            image_url: USER_SILHOUETTE_URL,
            label_id: rosterEntry.label_id,
            created_at: new Date().toISOString(),
            wallet_balance: 0,
            wallet_transactions: []
        });
    } else {
        await supabase.from(tableName).update({ label_id: rosterEntry.label_id }).eq('id', authUserId);
    }

    return { role: userRole, profileId: authUserId };
};

export const claimLabelRosterProfile = async (params: {
    email: string;
    password: string;
    name?: string;
}) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");

    const { email, password, name } = params;

    const { data: roster, error: rosterError } = await supabase
       .from('label_roster')
       .select('*')
       .eq('email', email.toLowerCase())
       .is('user_id', null)
       .order('created_at', { ascending: true })
       .limit(1)
       .maybeSingle();

    if (rosterError) throw new Error("Failed to look up label invite. Please try again.");
    if (!roster) throw new Error("No label invite found for this email. Ask your label to add you again.");

    const userData = {
      name: name || 'Artist',
      email,
      password,
      bio: '',
      image_url: null,
      imageFile: null
    };

    const created = await createUser(userData, UserRoleEnum.ARTIST);

    if (!created || (created && 'email_confirmation_required' in created)) {
        throw new Error("Unable to complete claim automatically. Please check email or try standard sign up.");
    }

    const newArtist = created as Artist;
    const newUserId = newArtist.id;

    await supabase
      .from('label_roster')
      .update({ 
         user_id: newUserId,
         claimed: true, 
         claimed_at: new Date().toISOString(),
         claimed_by_user_id: newUserId
      })
      .eq('id', roster.id);

    await supabase
      .from('artists')
      .update({ label_id: roster.label_id })
      .eq('id', newUserId);

    return {
      artist: newArtist,
      labelId: roster.label_id
    };
};

export const getBookingEconomics = async (bookingId: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: booking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

    if (!booking) return null;

    const contract = await fetchActiveLabelContractForTalent(
        booking.engineer_id || booking.producer_id
    );

    return {
        total_cost: booking.total_cost,
        engineer_pay_rate: booking.engineer_pay_rate,
        duration: booking.duration,
        contract,
        estimated_provider_take:
            booking.engineer_pay_rate * booking.duration *
            (contract?.contract_type === "PERCENTAGE"
                ? (1 - contract.split_percent / 100)
                : 1),
        estimated_label_take:
            contract?.contract_type === "PERCENTAGE"
                ? booking.engineer_pay_rate *
                  booking.duration *
                  (contract.split_percent / 100)
                : 0,
        recoup_remaining: contract?.recoup_balance || 0
    };
};

export const getRosterActivity = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.rpc("get_roster_activity", {
        label_id: labelId
    });

    if (error) {
        console.error("Error fetching roster activity:", error);
        return [];
    }

    return data || [];
};

export const fetchRosterActivity = getRosterActivity;

export const fetchLabelRoster = async (labelId: string): Promise<RosterMember[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: rosterEntries, error: rosterError } = await supabase
        .from('label_roster')
        .select('*, artist:artists(*)')
        .eq('label_id', labelId);

    if (rosterError) {
        console.error("Error fetching roster:", error);
        return [];
    }

    const activityList = await fetchRosterActivity(labelId);
    const activityMap = Object.fromEntries(
        activityList.map((a: any) => [a.user_id, a])
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
                songs_finished: userData.songs_finished || 0,
                avg_session_rating: userData.avg_session_rating || null,
                engagement_score: userData.engagement_score || 0,
                posts_created: posts,
                uploads_count: uploads,
                output_score: outputScore
            });
        }
    }

    return hydratedRoster;
};

export const createShadowProfile = async (
    role: 'ARTIST' | 'PRODUCER' | 'ENGINEER', 
    labelId: string, 
    data: { name: string; email?: string }
): Promise<{ profileId: string; roleId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");

    const shadowId = crypto.randomUUID();

    const { error: profileError } = await supabase.from('profiles').insert({
        id: shadowId,
        email: data.email || null,
        role: 'UNCLAIMED',
        full_name: data.name,
        created_at: new Date().toISOString()
    });

    if (profileError) {
        console.error("Error creating shadow profile:", profileError);
        throw profileError;
    }

    const tableMap: Record<string, string> = {
        'ARTIST': 'artists',
        'PRODUCER': 'producers',
        'ENGINEER': 'engineers'
    };
    
    const tableName = tableMap[role];
    const userRecord = {
        id: shadowId,
        name: data.name,
        email: data.email || null,
        image_url: USER_SILHOUETTE_URL,
        label_id: labelId,
        created_at: new Date().toISOString(),
        wallet_balance: 0,
        wallet_transactions: []
    };

    if (role === 'ENGINEER') (userRecord as any).specialties = [];
    if (role === 'PRODUCER') (userRecord as any).genres = [];
    if (role === 'ARTIST') (userRecord as any).bio = '';

    const { error: roleError } = await supabase.from(tableName).insert(userRecord);
    if (roleError) {
        throw roleError;
    }

    const rosterEntry = {
        id: crypto.randomUUID(),
        label_id: labelId,
        user_id: shadowId,
        role: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
        created_at: new Date().toISOString()
    };

    await supabase.from('label_roster').insert(rosterEntry);

    return { profileId: shadowId, roleId: shadowId };
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

// FIX: Added missing 'generateClaimTokenForRosterMember' function.
export const generateClaimTokenForRosterMember = async (rosterId: string): Promise<{ claimUrl: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");

    const token = crypto.randomUUID();
    const { error } = await supabase
        .from('label_roster')
        .update({ claim_token: token })
        .eq('id', rosterId);

    if (error) {
        console.error('Error saving claim token:', error);
        throw error;
    }

    return { claimUrl: `${window.location.origin}/claim/${token}` };
};

export async function fetchLabelPerformance(labelId?: string) {
    const supabase = getSupabase();
    if (!supabase || !labelId) return [];

    // Query the secure filtered view
    const { data, error } = await supabase
        .from("label_artist_performance")
        .select("*")
        .eq("label_id", labelId);

    if (error) {
        console.error("fetchLabelPerformance error:", error);
        return [];
    }

    return data || [];
}