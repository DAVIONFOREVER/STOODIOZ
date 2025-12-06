
import { getSupabase } from '../lib/supabase';
import { RosterImportRow, RosterMember, UserRole } from '../types';
import { USER_SILHOUETTE_URL } from '../constants';

export const importRoster = async (labelId: string, rows: RosterImportRow[]): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");

    const errors: string[] = [];

    for (const row of rows) {
        try {
            // 1. Generate Shadow ID
            const shadowId = crypto.randomUUID();

            // 2. Create Shadow Profile
            // Assuming 'profiles' table handles auth/role mapping
            const { error: profileError } = await supabase.from('profiles').insert({
                id: shadowId,
                email: row.email, // Can serve as placeholder until claimed
                role: 'UNCLAIMED', // Shadow role
                full_name: row.name,
                created_at: new Date().toISOString()
            });

            if (profileError) {
                console.error(`Failed to create shadow profile for ${row.name}:`, profileError);
                errors.push(row.name);
                continue;
            }

            // 3. Create Specific Role Record (Artist/Producer/Engineer)
            const roleTableMap: Record<string, string> = {
                'artist': 'artists',
                'producer': 'producers',
                'engineer': 'engineers'
            };

            const tableName = roleTableMap[row.role.toLowerCase()];
            if (!tableName) continue;

            const userRecord = {
                id: shadowId,
                name: row.name,
                email: row.email,
                image_url: USER_SILHOUETTE_URL,
                bio: row.notes || null,
                label_id: labelId, // Directly assign label ownership
                created_at: new Date().toISOString(),
                wallet_balance: 0,
                wallet_transactions: []
            };

            // Specific fields for types
            if (row.role === 'engineer') {
                (userRecord as any).specialties = [];
            } else if (row.role === 'producer') {
                (userRecord as any).genres = [];
            }

            const { error: roleError } = await supabase.from(tableName).insert(userRecord);
            if (roleError) {
                console.error(`Failed to create ${row.role} record for ${row.name}:`, roleError);
                // Should cleanup profile here ideally
                continue;
            }

            // 4. Add to Label Roster Table
            const rosterEntry = {
                id: crypto.randomUUID(),
                label_id: labelId,
                user_id: shadowId,
                role: row.role.charAt(0).toUpperCase() + row.role.slice(1), // Capitalize
                email: row.email,
                created_at: new Date().toISOString()
            };

            const { error: rosterError } = await supabase.from('label_roster').insert(rosterEntry);
            if (rosterError) console.error("Roster link error:", rosterError);

        } catch (e) {
            console.error("Import exception:", e);
            errors.push(row.name);
        }
    }

    if (errors.length > 0) {
        throw new Error(`Import completed with errors for: ${errors.join(', ')}`);
    }
};

export const fetchLabelRoster = async (labelId: string): Promise<RosterMember[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    // Fetch roster links
    const { data: rosterData, error } = await supabase
        .from('label_roster')
        .select('*')
        .eq('label_id', labelId);

    if (error || !rosterData) return [];

    // Hydrate with user details from respective tables
    const hydratedRoster: RosterMember[] = [];

    for (const entry of rosterData) {
        if (!entry.user_id) {
            // Pending invite (no shadow profile yet, just email invite case)
            hydratedRoster.push({
                id: entry.id, // Use roster ID as temp ID
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
                local_rank_text: ''
            });
            continue;
        }

        // Try to find in artists, then producers, then engineers
        let userData = null;
        let shadowProfile = false;

        // Check if shadow profile
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
            hydratedRoster.push({
                ...userData,
                role_in_label: entry.role,
                roster_id: entry.id,
                shadow_profile: shadowProfile
            });
        }
    }

    return hydratedRoster;
};

export const markAsClaimed = async (userId: string, realRole: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Update profiles table to remove 'UNCLAIMED' status
    await supabase.from('profiles').update({ role: realRole }).eq('id', userId);
};