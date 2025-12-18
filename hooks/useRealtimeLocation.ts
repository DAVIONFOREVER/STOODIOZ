
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

    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase) return;

        // Ensure we have a clean channel subscription
        const channel = supabase.channel(LOCATION_CHANNEL);
        channelRef.current = channel;
        channel.subscribe();

        const shouldBroadcast = currentUser && currentUser.show_on_map;

        if (shouldBroadcast) {
            const startWatching = () => {
                if (navigator.geolocation && watchIdRef.current === null) {
                    watchIdRef.current = navigator.geolocation.watchPosition(
                        (position) => {
                            const newLocation: Location = {
                                lat: position.coords.latitude,
                                lon: position.coords.longitude,
                            };
                            
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
                            console.error("Geolocation error:", error);
                            stopWatching();
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                }
            };
            startWatching();
        } else {
            stopWatching();
        }
        
        return () => {
            stopWatching();
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [currentUser?.id, currentUser?.show_on_map]);

    const stopWatching = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };
};
