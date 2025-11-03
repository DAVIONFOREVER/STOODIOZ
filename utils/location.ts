import type { Location } from '../types';

/**
 * Calculates the distance between two geographical coordinates using the Haversine formula.
 * @param loc1 - The first location with lat/lon properties.
 * @param loc2 - The second location with lat/lon properties.
 * @returns The distance in miles.
 */
export const calculateDistance = (loc1: Location, loc2: Location): number => {
    if (!loc1 || !loc2) {
        return Infinity;
    }
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
    const dLon = (loc2.lon - loc1.lon) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
