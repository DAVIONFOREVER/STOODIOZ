# Performance Optimization - Page Load Times

## Current Performance Issues

### 1. **Massive Data Loading on App Start** ⚠️ CRITICAL
- `getAllPublicUsers()` loads up to **10,000 rows** (2000 per table × 5 tables)
- Runs on every app mount
- Uses `.order('created_at')` which can be slow without indexes
- 45-second timeout means pages can hang for a long time

### 2. **Profile Pages Fetch Full Data Every Time** ⚠️ HIGH
- Each profile navigation calls `fetchFullArtist`, `fetchFullProducer`, etc.
- These queries likely do joins with `profiles` table
- No caching - fresh fetch on every navigation
- Can take 5-10 seconds per profile

### 3. **No Pagination or Lazy Loading** ⚠️ MEDIUM
- All data loads at once
- No incremental loading
- Large payloads slow down network

### 4. **Long Timeouts Hide Real Issues** ⚠️ MEDIUM
- 30-45 second timeouts mean users wait a long time
- Should fail faster and show loading states

## Recommended Optimizations

### Priority 1: Reduce Initial Data Load
**Current:** Loads 2000 rows × 5 tables = 10,000 rows
**Optimized:** Load only what's needed for landing page

```typescript
// Instead of loading all 2000, load only featured users
const FEATURED_LIMIT = 50; // Enough for landing page
const [a, e, p, s, l] = await Promise.all([
  queryWithTimeout(
    supabase.from('artists')
      .select('id, name, stage_name, display_name, image_url, location_text, bio')
      .limit(FEATURED_LIMIT)
      .order('created_at', { ascending: false }),
    'artists.select'
  ),
  // ... same for others
]);
```

### Priority 2: Add Caching
**Cache `getAllPublicUsers` result for 5 minutes**

```typescript
let cachedPublicUsers: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function getAllPublicUsers() {
  const now = Date.now();
  if (cachedPublicUsers && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cachedPublicUsers;
  }
  // ... fetch and cache
  cachedPublicUsers = result;
  cacheTimestamp = now;
  return result;
}
```

### Priority 3: Optimize Profile Queries
**Use specific field selection instead of `*`**

```typescript
// Instead of select('*')
const selectBase = 'id, name, stage_name, display_name, image_url, cover_image_url, bio, location_text, email, followers, follower_ids, following, wallet_balance, coordinates, show_on_map, is_online, rating_overall, sessions_completed, ranking_tier, genres, specialties, pull_up_price, profiles:profile_id(id, username, full_name)';
```

### Priority 4: Make Initial Load Non-Blocking
**Don't wait for getAllPublicUsers before showing UI**

```typescript
// In App.tsx - already non-blocking, but can improve
useEffect(() => {
  // Start loading but don't block UI
  apiService.getAllPublicUsers()
    .then((directory) => {
      // Update state when ready
      dispatch({ type: ActionTypes.SET_INITIAL_DATA, payload: directory });
    })
    .catch(() => {
      // Show empty state, let user continue
    });
}, []);
```

### Priority 5: Add Database Indexes
**Ensure indexes exist for common queries**

```sql
-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_artists_created_at ON artists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engineers_created_at ON engineers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_producers_created_at ON producers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stoodioz_created_at ON stoodioz(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_labels_created_at ON labels(created_at DESC);
```

## Quick Wins (Can Implement Now)

1. **Reduce limit from 2000 to 100** for initial load
2. **Remove `.order()` clause** if not critical (sorting can be slow)
3. **Select only needed fields** instead of `*`
4. **Add 5-minute cache** for getAllPublicUsers
5. **Reduce timeout from 45s to 15s** (fail faster)

## Expected Impact

- **Initial page load:** 30-45s → 2-5s
- **Profile navigation:** 5-10s → 1-2s
- **Subsequent loads:** 30-45s → <1s (cached)
