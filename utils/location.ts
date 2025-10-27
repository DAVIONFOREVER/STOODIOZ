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

const colors = ['#f97316', '#a855f7', '#3b82f6', '#14b8a6', '#ec4899'];

/**
 * Creates a data URL for an SVG placeholder image with a subtle gradient.
 * This replaces all previous mock photos with consistent, professional graphics.
 * @param seed A string to deterministically generate a color scheme.
 * @returns A string containing the data URL for the SVG.
 */
export const generatePlaceholderUrl = (seed: string): string => {
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color1 = colors[hash % colors.length];
    const color2 = colors[(hash + 2) % colors.length];

    const svg = `
        <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad-${seed.replace(/[^a-zA-Z0-9]/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${color1};stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:${color2};stop-opacity:0.3" />
                </linearGradient>
            </defs>
            <rect width="400" height="300" fill="#18181b" />
            <rect width="400" height="300" fill="url(#grad-${seed.replace(/[^a-zA-Z0-9]/g, '')})" />
            <path d="M0 0 L400 300 M0 300 L400 0" stroke-width="2" stroke="rgba(255,255,255,0.05)" />
        </svg>
    `.replace(/\s+/g, ' ').replace(/"/g, "'");

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
