import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') || Deno.env.get('VITE_GOOGLE_MAPS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  website?: string;
  international_phone_number?: string;
}

interface GooglePlacesResponse {
  results: GooglePlace[];
  next_page_token?: string;
}

async function fetchStudiosFromGoogle(
  location: string,
  radius: number = 50000, // 50km default
  pageToken?: string
): Promise<{ studios: GooglePlace[]; nextPageToken?: string }> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key not configured');
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const query = `recording studio ${location}`;
  const params = new URLSearchParams({
    query,
    key: GOOGLE_PLACES_API_KEY,
    type: 'establishment',
    radius: radius.toString(),
  });

  if (pageToken) {
    params.append('pagetoken', pageToken);
  }

  const response = await fetch(`${baseUrl}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data: GooglePlacesResponse = await response.json();
  
  // Filter for recording studios specifically
  const studios = data.results.filter(place => 
    place.types?.some(type => 
      type.includes('establishment') || 
      type.includes('point_of_interest')
    ) && (
      place.name.toLowerCase().includes('studio') ||
      place.name.toLowerCase().includes('recording') ||
      place.types.some(t => t.includes('music'))
    )
  );

  return {
    studios,
    nextPageToken: data.next_page_token,
  };
}

async function getPlaceDetails(placeId: string): Promise<any> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,website,international_phone_number,business_status,rating,user_ratings_total,types&key=${GOOGLE_PLACES_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Places Details API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

async function upsertStudio(studio: GooglePlace): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured');
  }

  const details = await getPlaceDetails(studio.place_id);
  
  // Extract email from website if possible (would need additional scraping)
  // For now, we'll leave email null and let users provide it when inviting
  
  const addressParts = studio.formatted_address.split(',').map(s => s.trim());
  const zipMatch = addressParts[addressParts.length - 1]?.match(/\d{5}/);
  const zipCode = zipMatch ? zipMatch[0] : null;
  const state = addressParts.length > 2 ? addressParts[addressParts.length - 2] : null;
  const city = addressParts.length > 3 ? addressParts[addressParts.length - 3] : null;

  const studioData = {
    name: studio.name,
    address: studio.formatted_address,
    city,
    state,
    zip_code: zipCode,
    country: 'United States',
    coordinates: {
      lat: studio.geometry.location.lat,
      lon: studio.geometry.location.lng,
    },
    email: null, // Will be filled when inviting
    phone: details.international_phone_number || null,
    website_url: details.website || null,
    google_place_id: studio.place_id,
    google_business_url: `https://www.google.com/maps/place/?q=place_id:${studio.place_id}`,
    business_status: details.business_status || studio.business_status || 'OPERATIONAL',
    rating: details.rating || studio.rating || null,
    user_ratings_total: details.user_ratings_total || studio.user_ratings_total || null,
    types: details.types || studio.types || [],
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/unregistered_studios`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      ...studioData,
      google_place_id: studio.place_id, // Use as unique key
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Failed to upsert studio:', text);
  }
}

serve(async (req) => {
  // Handle CORS preflight - MUST be first
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  try {
    // Check for API key first
    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Google Places API key not configured. Please set GOOGLE_PLACES_API_KEY or VITE_GOOGLE_MAPS_API_KEY as a Supabase secret.',
          details: 'Run: supabase secrets set GOOGLE_PLACES_API_KEY=your_key_here'
        }),
        { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    const { location, radius, pageToken } = await req.json();

    if (!location) {
      return new Response(
        JSON.stringify({ error: 'Location parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    console.log(`[fetch-recording-studios] Fetching studios for: ${location}`);

    const { studios, nextPageToken } = await fetchStudiosFromGoogle(
      location,
      radius || 50000,
      pageToken
    );

    console.log(`[fetch-recording-studios] Found ${studios.length} studios`);

    // Upsert studios to database (in batches to avoid rate limits)
    const batchSize = 5;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < studios.length; i += batchSize) {
      const batch = studios.slice(i, i + batchSize);
      const results = await Promise.allSettled(batch.map(upsertStudio));
      
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          errorCount++;
          console.error(`[fetch-recording-studios] Failed to upsert studio ${batch[idx].name}:`, result.reason);
        }
      });
      
      // Rate limiting: wait 1 second between batches
      if (i + batchSize < studios.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        studiosFound: studios.length,
        studiosSaved: successCount,
        studiosErrors: errorCount,
        nextPageToken,
        message: `Successfully fetched ${studios.length} studios. Saved ${successCount} to database.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[fetch-recording-studios] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch studios';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error && error.message.includes('API key') 
          ? 'Please set GOOGLE_PLACES_API_KEY as a Supabase secret: supabase secrets set GOOGLE_PLACES_API_KEY=your_key_here'
          : 'Check console logs for more details'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      }
    );
  }
});
