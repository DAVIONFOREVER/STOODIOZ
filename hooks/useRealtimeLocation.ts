import { useEffect, useRef } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Location } from '../types';
import { getSupabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeLocationProps {
    currentUser: Artist | Engineer | Stoodio | Producer | null;
}

const LOCATION_CHANNEL = 'public:locations';

export const useRealtimeLocation = ({ currentUser }: UseRealtimeLocationProps) => {
    const watchIdRef = useRef<number | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase) return;

        // Subscribe to channel regardless of broadcasting status
        const channel = supabase.channel(LOCATION_CHANNEL);
        channelRef.current = channel;
        
        if (!channel.subscribed) {
            channel.subscribe();
        }

        const shouldBroadcast = currentUser && currentUser.showOnMap;

        if (shouldBroadcast) {
            const startWatching = () => {
                if (navigator.geolocation && watchIdRef.current === null) {
                    watchIdRef.current = navigator.geolocation.watchPosition(
                        (position) => {
                            const newLocation: Location = {
                                lat: position.coords.latitude,
                                lon: position.coords.longitude,
                            };
                            
                            // Broadcast the update
                            if (channelRef.current && currentUser) {
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
                            console.error("Error watching position:", error);
                            // Stop watching if there's an error (e.g., user revokes permission)
                            stopWatching();
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0,
                        }
                    );
                }
            };

            startWatching();

        } else {
            // If user opted out, stop watching
            stopWatching();
        }
        
        // Cleanup function
        return () => {
            stopWatching();
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };

    }, [currentUser, currentUser?.showOnMap]); // Re-run effect if user or their map preference changes

    const stopWatching = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };
};
