
import React from 'react';
import type { Artist, Engineer, Producer, Stoodio, Label } from '../types';
import { CloseIcon, StarIcon, RoadIcon } from './icons';
import { getProfileImageUrl, getDisplayName } from '../constants';

type MapUser = Artist | Engineer | Producer | Stoodio | Label;

interface MapInfoPopupProps {
    user: MapUser;
    onClose: () => void;
    onSelect: (user: MapUser) => void;
    onNavigate: (location: { lat: number, lon: number }) => void;
    mapMeta?: {
        activeBookings: number;
        hasActiveSession: boolean;
        roomsTotal: number | null;
        roomsAvailable: number | null;
        nextBookingStart?: string | null;
    };
}

const MapInfoPopup: React.FC<MapInfoPopupProps> = ({ user, onClose, onSelect, onNavigate, mapMeta }) => {
    const hasRating = typeof (user as any)?.rating_overall === 'number';
    const role = (() => {
        const rawRole = ((user as any).role || (user as any).profiles?.role || (user as any).profile?.role || '').toString().toLowerCase();
        if (rawRole) return rawRole;
        if ('amenities' in user) return 'stoodio';
        if ('specialties' in user) return 'engineer';
        if ('instrumentals' in user) return 'producer';
        if ('company_name' in user && !('amenities' in user)) return 'label';
        return 'artist';
    })();
    const locationLabel = (user as any)?.location_text || (user as any)?.location || '';
    const coords = (user as any)?.coordinates;
    const isStoodio = 'amenities' in user;
    const nextSessionLabel = mapMeta?.nextBookingStart
        ? new Date(mapMeta.nextBookingStart).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : null;
    const openExternalMaps = () => {
        if (!coords) return;
        const lat = Number(coords.lat || coords.latitude);
        const lon = Number(coords.lon || coords.lng || coords.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };
    const copyLocation = async () => {
        if (!locationLabel) return;
        try {
            await navigator.clipboard.writeText(locationLabel);
        } catch {
            // ignore
        }
    };

    return (
        <div className="w-72 text-left cardSurface">
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <img src={getProfileImageUrl(user)} alt={user.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                            <h3 className="font-bold text-slate-100">{getDisplayName(user)}</h3>
                            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{role}</p>
                            {hasRating && (
                                <div className="flex items-center text-yellow-400 text-sm">
                                    <StarIcon className="w-4 h-4" />
                                    <span className="font-bold ml-1">{Number((user as any).rating_overall).toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                {locationLabel && (
                    <p className="text-xs text-zinc-400 truncate">{locationLabel}</p>
                )}
                <div className="flex flex-wrap gap-2">
                    {typeof (user as any).sessions_completed === 'number' && (
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            {Number((user as any).sessions_completed)} sessions
                        </span>
                    )}
                    {typeof (user as any).followers === 'number' && (
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            {Number((user as any).followers)} followers
                        </span>
                    )}
                    {(user as any).ranking_tier && (
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            {(user as any).ranking_tier}
                        </span>
                    )}
                    {isStoodio && mapMeta && (
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${mapMeta.hasActiveSession ? 'bg-green-500/20 text-green-300' : 'bg-zinc-800 text-zinc-300'}`}>
                            {mapMeta.hasActiveSession ? 'In Session' : 'Available'}
                        </span>
                    )}
                </div>
                {isStoodio && mapMeta && (
                    <div className="mt-3 space-y-1 text-xs text-zinc-400">
                        {mapMeta.roomsTotal !== null && (
                            <div className="flex items-center justify-between">
                                <span>Rooms available</span>
                                <span className="text-zinc-200 font-semibold">
                                    {mapMeta.roomsAvailable ?? 0}/{mapMeta.roomsTotal}
                                </span>
                            </div>
                        )}
                        {typeof mapMeta.activeBookings === 'number' && (
                            <div className="flex items-center justify-between">
                                <span>Active sessions</span>
                                <span className="text-zinc-200 font-semibold">{mapMeta.activeBookings}</span>
                            </div>
                        )}
                        {nextSessionLabel && (
                            <div className="flex items-center justify-between">
                                <span>Next session</span>
                                <span className="text-zinc-200 font-semibold">{nextSessionLabel}</span>
                            </div>
                        )}
                    </div>
                )}
                <div className="mt-4 flex gap-2">
                    <button onClick={() => onSelect(user)} className="flex-grow bg-orange-500 text-white font-semibold text-sm py-2 rounded-md hover:bg-orange-600 transition-colors">
                        View Profile
                    </button>
                    {coords && (
                        <button onClick={() => onNavigate(coords)} className="p-2 bg-zinc-700 text-slate-200 rounded-md hover:bg-zinc-600 transition-colors" title="Navigate">
                            <RoadIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    {coords && (
                        <button onClick={openExternalMaps} className="flex-1 text-xs font-semibold py-2 rounded-md bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors">
                            Open in Maps
                        </button>
                    )}
                    {locationLabel && (
                        <button onClick={copyLocation} className="flex-1 text-xs font-semibold py-2 rounded-md bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors">
                            Copy Location
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapInfoPopup;
