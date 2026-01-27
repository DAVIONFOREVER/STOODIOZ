import { useEffect, useRef } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Location, Label } from '../types';
import { getSupabase } from '../lib/supabase';

interface UseRealtimeLocationProps {
  currentUser: Artist | Engineer | Stoodio | Producer | Label | null;
}

const LOCATION_CHANNEL = 'public:locations';

export const useRealtimeLocation = ({ currentUser }: UseRealtimeLocationProps) => {
  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const cleanupChannel = () => {
    const s = getSupabase();
    if (!s) return;

    if (channelRef.current) {
      try {
        s.removeChannel(channelRef.current);
      } catch (e) {
        // Avoid crashing the app over cleanup
        console.warn('[useRealtimeLocation] removeChannel failed:', e);
      } finally {
        channelRef.current = null;
      }
    }
  };

  useEffect(() => {
    const s = getSupabase();
    if (!s) return;

    // No user -> ensure everything is cleaned up
    if (!currentUser?.id) {
      stopWatching();
      cleanupChannel();
      return;
    }

    // Reset any prior subscriptions/watchers before establishing fresh ones
    stopWatching();
    cleanupChannel();

    const channel = s.channel(LOCATION_CHANNEL);
    channelRef.current = channel;

    // Subscribe (do not await; just start it)
    channel.subscribe((status: string) => {
      // Optional debug
      // console.log('[useRealtimeLocation] channel status:', status);
    });

    const shouldBroadcast = Boolean((currentUser as any).show_on_map);

    if (shouldBroadcast && typeof navigator !== 'undefined' && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: Location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'location_update',
              payload: {
                userId: currentUser.id,
                coordinates: newLocation,
              },
            });
          }
        },
        (error) => {
          // code 3 = TIMEOUT; treat as non-fatal, degrade without loud errors
          const isTimeout = (error as GeolocationPositionError)?.code === 3;
          if (isTimeout) {
            console.warn('[useRealtimeLocation] Geolocation timeout; location feature disabled for this session.');
          } else {
            console.warn('[useRealtimeLocation] Geolocation error:', error);
          }
          stopWatching();
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    }

    return () => {
      stopWatching();
      cleanupChannel();
    };
    // Only rerun when identity or broadcast setting changes
  }, [currentUser?.id, (currentUser as any)?.show_on_map]);
};
