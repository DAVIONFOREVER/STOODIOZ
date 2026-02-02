# Why Following / Followers Count Doesn't Work — Code Analysis (No Edits)

This document shows exactly where the code does **not** do what you expect. No changes have been made.

---

## What You Expect

1. **User 1** and **User 2** exist (counted like landing page: 1–6).
2. **User 1** presses Follow on **User 2's** page → app records that User 1 follows User 2.
3. **User 2's follower count** increases (same idea as landing page count).
4. Each new follower adds to the count.
5. **Aria** is the first permanent follower — always present, cannot be removed.

---

## What the Code Does vs. Doesn't Do

### 1. Follow is saved to the database

**File:** `services/apiService.ts` lines 1354–1377

```ts
export async function toggleFollow(followerId: string, followingId: string) {
  // ... inserts (follower_id, following_id) into follows table
  await supabase.from(TABLES.follows).insert({ follower_id: followerId, following_id: followingId, ... });
  return { following: true };
}
```

- When User 1 follows User 2, `toggleFollow(User1.id, User2.id)` inserts into `follows`.
- The database correctly stores `(follower_id=User1, following_id=User2)`.

---

### 2. Only the follower (User 1) is updated in the app

**File:** `hooks/useSocial.ts` lines 19–60

```ts
const toggleFollow = useCallback(async (type, id) => {
  // ...
  // Optimistic update: only updates currentUser (User 1)
  optimisticUser.following = { ...followingState, [key]: [...currentList, targetId] };
  dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: optimisticUser } });

  await apiService.toggleFollow(currentUser.id, targetId);
  // ← No dispatch to update User 2 (the profile you're viewing)
}, [...]);
```

- `SET_CURRENT_USER` updates **User 1** (the follower) and adds User 2 to User 1’s following list.
- **User 2** (the profile being viewed) is never updated.

---

### 3. User 2’s follower count and list never refresh

**File:** `components/ProducerProfile.tsx` lines 276–279, 640

```ts
const followers = useMemo(() => {
  return allUsers.filter(u => (producer.follower_ids || []).includes(u.id));
}, [allUsers, producer?.follower_ids]);
// ...
<h3>Followers ({followers.length})</h3>
```

- The displayed followers come from `producer.follower_ids`.
- That value was set when the profile was **fetched** (via `fetchFullProducer` → `computeFollowData`).
- When User 1 clicks Follow:
  1. `follows` row is inserted.
  2. User 1’s following list is updated.
  3. **`producer` is not refetched or updated.**

So `producer.follower_ids` and `producer.followers` stay as they were when the page loaded. The count and list do not change.

---

### 4. When User 2 *does* get follower data

**File:** `services/apiService.ts` lines 858–906

```ts
async function computeFollowData(supabase, profileId) {
  const followersRes = await supabase.from(TABLES.follows)
    .select('follower_id')
    .eq('following_id', profileId);
  const followerIds = (followersRes?.data || []).map(r => r.follower_id);
  return {
    followers: followerIds.length,
    follower_ids: followerIds,
    following: followingByType
  };
}
```

- `computeFollowData` runs when a full profile is fetched (e.g. `fetchFullProducer` → `fetchFullRoleRow`).
- It reads from `follows` and returns `followers` and `follower_ids`.
- It is **not** called again after someone clicks Follow. It only runs when:
  - First navigating to the profile.
  - Explicitly refreshing the profile.

---

### 5. Landing page count vs. profile follower count

**Landing page**

- Uses `getAllPublicUsers()` and counts from the directory.
- No follow relationship involved, so it behaves correctly.

**Profile page**

- Uses `producer.follower_ids` and `producer.followers`, which come from a **single fetch** when the profile loads.
- After User 1 follows, the DB has the new row, but the profile data in state is never updated.

So the DB is correct; the UI is stale because the profile object in state is not updated after a follow.

---

### 6. Aria: follower vs. following

**File:** `App.tsx` lines 748–762

```ts
// Auto-follow Aria forever on signup
await apiService.toggleFollow(result.id, ariaProfile.id);
// ↑ This is: newUser follows Aria (follower_id=newUser, following_id=Aria)
```

- This inserts `(follower_id=newUser, following_id=Aria)`.
- So **new users follow Aria** — Aria appears in their “following” list.
- It does **not** add Aria as a follower of the new user.

**File:** `hooks/useSocial.ts` lines 31–35

```ts
if (isAria && isFollowing) {
  alert('Aria is always followed.');
  return;  // Blocks unfollow
}
```

- This prevents users from unfollowing Aria.
- It does **not**:
  - Add Aria to every user’s followers.
  - Enforce Aria as a permanent follower.

To have “Aria is the first permanent follower you get”, the code would need to:
- Insert `(follower_id=Aria, following_id=newUser)` so Aria follows the new user, **or**
- Inject Aria into the displayed follower list so she always appears there.

---

## Summary: Where the Logic Breaks

| Expectation                    | Current behavior                                      |
|--------------------------------|-------------------------------------------------------|
| Follow recorded in DB          | Yes — `toggleFollow` inserts into `follows`           |
| User 1’s following list updated| Yes — optimistic `SET_CURRENT_USER` in `useSocial`    |
| User 2’s follower count updated| **No** — profile not refetched or updated             |
| User 2’s follower list updated | **No** — `producer.follower_ids` never refreshed      |
| Aria as permanent follower     | **No** — Aria is “you follow her”, not “she follows you” |

---

## Root Cause

`useSocial.toggleFollow`:

1. Updates the DB with the new follow.
2. Updates the **current user** (follower) in state.
3. **Does not** update the **target user** (followed) in state or refetch their profile.

Because the profile you’re viewing is never updated after a follow, its `followers` and `follower_ids` stay stale until you navigate away and back (which triggers a refetch) or otherwise refresh the profile.

---

## What a Fix Would Involve (for later)

1. **After `toggleFollow` succeeds**  
   Update the target user in state:
   - If following: add `currentUser.id` to their `follower_ids` and increment `followers`.
   - If unfollowing: remove and decrement.

2. **Aria as permanent follower**  
   On signup (or equivalent), insert `(follower_id=Aria, following_id=newUser)` so Aria follows the new user. Optionally also prevent Aria from being removed from the displayed follower list.

3. **Refreshing the profile**  
   Alternative or addition: after a follow, refetch the target profile and call `UPDATE_USERS` so all consumers (including profile page and directory) see the new follower data.
