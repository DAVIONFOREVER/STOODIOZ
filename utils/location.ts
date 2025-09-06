import type { Location } from '../types';

/**
 * Calculates the distance between two geographical coordinates using the Haversine formula.
 * @param loc1 - The first location with latitude and longitude.
 * @param loc2 - The second location with latitude and longitude.
 * @returns The distance in miles.
 */
export const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
    const dLon = (loc2.lon - loc1.lon) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Estimates travel time based on distance.
 * @param distanceInMiles - The distance in miles.
 * @returns An estimated travel time string (e.g., "Approx. 45 min drive").
 */
export const estimateTravelTime = (distanceInMiles: number): string => {
    // A simple estimation: average speed of 25 mph (2.4 minutes per mile) + 5 mins base.
    const minutes = Math.round(distanceInMiles * 2.4 + 5);
    if (minutes < 5) return `~5 min drive`;
    if (minutes < 60) {
        return `~${minutes} min drive`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes < 10) return `~${hours} hr drive`;
        return `~${hours} hr ${remainingMinutes} min drive`;
    }
};

/**
 * Estimates travel time in milliseconds for timeout purposes.
 * @param distanceInMiles - The distance in miles.
 * @returns An estimated travel time in milliseconds.
 */
export const estimateTravelTimeInMs = (distanceInMiles: number): number => {
    // For demo purposes, make it quick: 2 seconds per mile + 3 second base.
    return Math.round(distanceInMiles * 1000 + 3000);
};


/**
 * A mock geocoding function to get coordinates from a zip code.
 * In a real app, this would be an API call to a geocoding service.
 * @param zipCode - The 5-digit zip code string.
 * @returns A Location object or null if not found.
 */
export const getCoordsFromZip = (zipCode: string): Location | null => {
    const zipCodeMap: { [key: string]: Location } = {
        '90210': { lat: 34.0901, lon: -118.4065 }, // Beverly Hills (for LA)
        '10001': { lat: 40.7505, lon: -73.9962 }, // Manhattan (for NYC)
        '30301': { lat: 33.7629, lon: -84.3833 }, // Atlanta
        '37201': { lat: 36.1659, lon: -86.7844 }, // Nashville
        '60601': { lat: 41.8853, lon: -87.6256 }, // Chicago
        '33139': { lat: 25.7907, lon: -80.1300 }, // Miami Beach
    };
    return zipCodeMap[zipCode] || null;
};