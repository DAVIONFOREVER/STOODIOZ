# Unregistered Studios Feature Implementation

## Overview
This feature allows the app to display all recording studios in the country (from Google Places API) on the map, even if they haven't joined Stoodioz yet. Users can invite these studios to join via email.

## What's Been Implemented

### 1. Database Schema ✅
- **File**: `supabase/migrations/20260129_unregistered_studios.sql`
- Created `unregistered_studios` table with:
  - Studio information (name, address, coordinates, etc.)
  - Google Places API data (place_id, business_status, rating, etc.)
  - Invite tracking (last_invited_at, invite_count, invited_by_user_id)
  - Registration status (is_registered, registered_profile_id)

### 2. Edge Functions ✅

#### a. Fetch Recording Studios (`fetch-recording-studios`)
- **File**: `supabase/functions/fetch-recording-studios/index.ts`
- Searches Google Places API for "recording studio" in a given location
- Filters results to recording studios
- Stores studios in database
- Handles pagination with `next_page_token`

**Usage**:
```typescript
await apiService.fetchRecordingStudiosFromGoogle('Nashville, TN', 50000);
```

#### b. Invite Studio (`invite-studio`)
- **File**: `supabase/functions/invite-studio/index.ts`
- Sends email invitation to studio
- Creates invite link with pre-selected role: `/get-started?role=STOODIO&invite={studioId}`
- Updates studio record with invite tracking

**Usage**:
```typescript
await apiService.inviteUnregisteredStudio(
  studioId,
  studioEmail,
  inviterUserId,
  inviterName
);
```

### 3. API Service Functions ✅
- **File**: `services/apiService.ts`
- `fetchUnregisteredStudios(state?, city?)` - Fetch unregistered studios from DB
- `inviteUnregisteredStudio(...)` - Send invite email
- `fetchRecordingStudiosFromGoogle(...)` - Fetch from Google Places API

### 4. ChooseProfile URL Parameter Support ✅
- **File**: `components/ChooseProfile.tsx`
- Automatically selects role from URL parameter: `?role=STOODIO`
- Used in invite links to pre-select "Stoodio Owner" option

## What Still Needs Implementation

### 1. MapView Integration (In Progress)
- Fetch unregistered studios when map loads
- Display them on map with different icon/style (grayed out or different color)
- Show "Invite" button on hover instead of "Book"
- Handle invite button click to open modal/input for email

### 2. Email Service Configuration
- **Current**: Edge function has placeholder email sending
- **Needed**: Configure actual email service (SendGrid, Resend, or Supabase Email)
- Update `supabase/functions/invite-studio/index.ts` with real email sending

### 3. Admin/Initial Data Import
- Create admin tool or script to initially populate studios
- Could search major cities: "Nashville, TN", "Los Angeles, CA", "Atlanta, GA", etc.
- Run periodically to discover new studios

### 4. Studio Registration Linking
- When a studio signs up, check if they match an unregistered studio
- Use `mark_studio_as_registered()` function to link them
- Could match by name + location or Google place_id

## Environment Variables Needed

Add to your `.env` or Supabase secrets:
```
GOOGLE_PLACES_API_KEY=your_key_here  # Or use VITE_GOOGLE_MAPS_API_KEY
APP_ORIGIN=https://stoodioz.com      # Your app's URL for invite links
```

## Database Migration

Run the migration:
```bash
supabase migration up
```

Or apply manually in Supabase dashboard.

## Testing Steps

1. **Fetch Studios**:
   ```typescript
   await apiService.fetchRecordingStudiosFromGoogle('Nashville, TN');
   ```

2. **View on Map**:
   - Studios should appear on map (once MapView is updated)
   - Should show different icon for unregistered studios

3. **Send Invite**:
   ```typescript
   await apiService.inviteUnregisteredStudio(
     studioId,
     'studio@example.com',
     currentUser.id,
     currentUser.name
   );
   ```

4. **Test Invite Link**:
   - Click invite link: `https://stoodioz.com/get-started?role=STOODIO&invite={studioId}`
   - Should auto-select "Stoodio Owner" option

## Notes

- **Rate Limiting**: Google Places API has rate limits. The fetch function includes delays between batches.
- **Email**: Currently uses placeholder. Need to integrate real email service.
- **Privacy**: Unregistered studios are public data from Google, so displaying them is fine.
- **Performance**: Consider caching studio data and only refreshing periodically.

## Next Steps

1. Complete MapView integration to show unregistered studios
2. Configure email service for invites
3. Create admin tool for initial data import
4. Add studio matching logic when they register
