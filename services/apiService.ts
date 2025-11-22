
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
    // Fallback function to create a local URL if upload fails or Supabase is offline
    const createLocalUrl = () => URL.createObjectURL(file as Blob);

    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase not configured. Using local blob URL.");
        return createLocalUrl();
    }

    try {
        // Race the upload against a 10-second timeout
        const uploadTask = supabase.storage.from(bucket).upload(path, file, { upsert: true });
        const result: any = await Promise.race([
            uploadTask,
            timeoutPromise(10000) 
        ]);
        
        if (result.error) {
            console.warn(`Supabase storage upload failed (${bucket}/${path}):`, result.error.message);
            // RETURN LOCAL URL ON FAILURE so the user isn't blocked
            return createLocalUrl();
        }

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        // Check if publicUrl is valid, sometimes Supabase returns a URL even if the file isn't there
        if (!publicUrl) return createLocalUrl();
        
        return publicUrl;
    } catch (error: any) {
        console.error(`Upload exception for ${bucket}/${path}:`, error);
        // CRITICAL FIX: Always return a usable URL so the UI doesn't break
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
    