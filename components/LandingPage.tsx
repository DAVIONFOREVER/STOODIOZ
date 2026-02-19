import React, { useEffect, useMemo, useRef } from 'react';
import type { Stoodio, Producer, Artist, Engineer } from '../types';
import { AppView } from '../types';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';
import * as apiService from '../services/apiService.ts';
import { ChevronRightIcon, MicrophoneIcon, SoundWaveIcon, MusicNoteIcon, HouseIcon } from './icons.tsx';
import StoodioCard from './StoodioCard.tsx';
import { ARIA_PROFILE_IMAGE_URL, getProfileImageUrl, getDisplayName } from '../constants';

// Inlined so the browser never serves a stale cached constant — what you see here is what loads.
const LANDING_HERO_LINE = 'Book recording sessions with Stoodios, engineers, and producers.';
const LANDING_TAGLINE = 'Discover. Book. Get to work.';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
  onSelectStoodio: (stoodio: Stoodio) => void;
  onSelectProducer: (producer: Producer) => void;
  onSelectArtist: (artist: Artist) => void;
  onSelectEngineer: (engineer: Engineer) => void;
  onOpenAriaCantata: () => void;
  onLogout: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onSelectStoodio,
  onSelectProducer,
  onSelectArtist,
  onSelectEngineer,
  onOpenAriaCantata,
}) => {
  const dispatch = useAppDispatch();
  const { artists, engineers, producers, stoodioz, labels } = useAppState();
  const didRehydrateRef = useRef(false);

  // Rehydrate directory when landing mounts with empty lists (e.g. after logout)
  useEffect(() => {
    const total =
      (artists?.length ?? 0) +
      (engineers?.length ?? 0) +
      (producers?.length ?? 0) +
      (stoodioz?.length ?? 0) +
      (labels?.length ?? 0);
    if (total > 0 || didRehydrateRef.current) return;
    didRehydrateRef.current = true;
    let isMounted = true;
    (async () => {
      try {
        const dir = await apiService.getAllPublicUsers(true);
        if (!isMounted) return;
        dispatch({
          type: ActionTypes.SET_INITIAL_DATA,
          payload: {
            artists: dir.artists ?? [],
            engineers: dir.engineers ?? [],
            producers: dir.producers ?? [],
            stoodioz: dir.stoodioz ?? [],
            labels: dir.labels ?? [],
            reviews: [],
          },
        });
      } catch {
        didRehydrateRef.current = false;
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [dispatch, artists?.length, engineers?.length, producers?.length, stoodioz?.length, labels?.length]);

  // Guard: directory arrays can be undefined before SET_INITIAL_DATA or on malformed payload
  const a = artists ?? [];
  const e = engineers ?? [];
  const p = producers ?? [];
  const s = stoodioz ?? [];
  const l = labels ?? [];

  const dedupeById = (rows: any[]) => {
    const seen = new Set<string>();
    return rows.filter((row) => {
      const key = String(row?.id || row?.profile_id || '');
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const uniqueStoodioz = useMemo(() => dedupeById(s), [s]);
  const uniqueEngineers = useMemo(() => dedupeById(e), [e]);
  const uniqueArtists = useMemo(() => dedupeById(a), [a]);
  const uniqueProducers = useMemo(() => dedupeById(p), [p]);

  /** Landing always shows exactly 3 per user type. */
  const featuredStoodioz = useMemo(() => uniqueStoodioz.slice(0, 3), [uniqueStoodioz]);
  const featuredEngineers = useMemo(() => uniqueEngineers.slice(0, 3), [uniqueEngineers]);
  const featuredArtists = useMemo(() => uniqueArtists.slice(0, 3), [uniqueArtists]);
  const featuredProducers = useMemo(() => uniqueProducers.slice(0, 3), [uniqueProducers]);

  const counts = useMemo(() => ({
    artists: uniqueArtists.length,
    engineers: uniqueEngineers.length,
    producers: uniqueProducers.length,
    stoodioz: uniqueStoodioz.length,
    labels: dedupeById(l).length,
    total: uniqueArtists.length + uniqueEngineers.length + uniqueProducers.length + uniqueStoodioz.length + dedupeById(l).length,
  }), [uniqueArtists, uniqueEngineers, uniqueProducers, uniqueStoodioz, l]);


  const openPulse = () => {
    // Optional: lets MapView know it was opened from "Pulse"
    try {
      localStorage.setItem('pulse_autolive', '1');
    } catch {}
    onNavigate(AppView.MAP_VIEW);
  };

  return (
    <div className="relative space-y-10 sm:space-y-16 min-w-0 max-w-full">
      {/* ===== HERO ===== */}
      <section className="cardSurface p-4 sm:p-6 md:p-8 lg:p-12 rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-950/60 max-w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start min-w-0">
          {/* Left: main pitch */}
          <div className="lg:col-span-7 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold text-zinc-100 text-glow leading-tight break-words">
              {LANDING_HERO_LINE}
              <span className="block text-orange-400">{LANDING_TAGLINE}</span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm sm:text-base md:text-lg break-words">
              Find Stoodios, engineers, and producers — then lock in your session and get to work.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate(AppView.STOODIO_LIST)}
                className="shrink-0 whitespace-nowrap bg-orange-500 text-white font-extrabold px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 text-sm sm:text-base"
              >
                Discover Stoodioz
              </button>
              <button
                type="button"
                onClick={() => onNavigate(AppView.CHOOSE_PROFILE)}
                className="shrink-0 whitespace-nowrap bg-zinc-900 border border-zinc-800 text-slate-200 font-semibold px-6 py-2.5 rounded-xl hover:bg-zinc-800 transition-all text-sm sm:text-base"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={openPulse}
                className="shrink-0 whitespace-nowrap bg-zinc-900 border border-zinc-800 text-slate-200 font-semibold px-6 py-2.5 rounded-xl hover:bg-zinc-800 transition-all text-sm sm:text-base"
                title="Open the live map pulse"
              >
                Pulse
              </button>
            </div>
          </div>

          {/* Right: Aria spotlight */}
          <div className="lg:col-span-5 min-w-0">
            <div className="cardSurface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950/70 to-zinc-900/30 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-purple-600/15 blur-3xl" />

              <div className="flex items-center gap-4">
                {/* Aria profile photo */}
                <button
                  type="button"
                  onClick={onOpenAriaCantata}
                  aria-label="Open Aria"
                  className="shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-300 shadow-2xl shadow-orange-500/30 flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-950/70 backdrop-blur flex items-center justify-center border border-orange-500/30 overflow-hidden">
                    <img
                      src={ARIA_PROFILE_IMAGE_URL}
                      alt="Aria Cantata"
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="text-zinc-100 font-extrabold text-lg sm:text-xl break-words">Meet Aria Cantata</div>
                  <div className="text-slate-400 text-xs sm:text-sm mt-1 break-words">
                    Your in-app guide. Ask anything — booking help, profile setup, pricing, strategy.
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onOpenAriaCantata}
                  className="shrink-0 whitespace-nowrap bg-orange-500 text-white font-extrabold px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 text-sm sm:text-base"
                >
                  Talk to Aria
                </button>
                <button
                  type="button"
                  onClick={openPulse}
                  className="shrink-0 whitespace-nowrap px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-slate-200 font-semibold hover:bg-zinc-800 transition-all text-sm sm:text-base"
                >
                  See the Pulse
                </button>
              </div>

              <div className="mt-4 text-xs text-slate-500">
                Pro tip: the map is live — it’s the heartbeat of the app. Turn on visibility when you’re ready.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Featured Stoodioz Section ===== */}
      <section className="min-w-0">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-zinc-100 text-glow break-words">Featured Stoodioz</h2>
          <button
            type="button"
            onClick={() => onNavigate(AppView.STOODIO_LIST)}
            className="flex items-center gap-2 text-orange-400 font-semibold hover:underline"
          >
            View All <ChevronRightIcon className="w-5 h-5 text-orange-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredStoodioz.slice(0, 3).map((stoodio, index) => (
            <StoodioCard key={`${stoodio.id || stoodio.profile_id || 'stoodio'}-${index}`} stoodio={stoodio} onSelectStoodio={onSelectStoodio} />
          ))}
        </div>
      </section>

      {/* ===== Featured Sections ===== */}
      <section className="space-y-8">
        {/* Featured Producers */}
        <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-100 break-words">Featured Producers</h2>
              <button
                type="button"
                onClick={() => onNavigate(AppView.PRODUCER_LIST)}
                className="flex items-center gap-2 text-orange-400 font-semibold hover:underline"
              >
                View All <ChevronRightIcon className="w-5 h-5 text-orange-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducers.slice(0, 3).map((producer, index) => {
                const location = (producer as any).location_text || (producer as any).location || 'Location not set';

                return (
                  <button
                    key={`${producer.id || producer.profile_id || 'producer'}-${index}`}
                    type="button"
                    onClick={() => onSelectProducer(producer)}
                    className="text-left rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60 transition-all shadow-xl p-5"
                  >
                    <div className="w-64 h-64 mx-auto rounded-full overflow-hidden shrink-0">
                      <img src={getProfileImageUrl(producer)} alt={getDisplayName(producer)} className="w-full h-full object-cover object-center" loading="lazy" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="text-slate-100 font-bold text-lg truncate">{getDisplayName(producer)}</div>
                      <div className="text-slate-400 text-sm truncate">{location}</div>
                      <div className="pt-2">
                        <span className="text-xs px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-slate-200">
                          View Profile
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {featuredProducers.length === 0 && (
              <div className="text-zinc-500 text-sm mt-3">No producers available yet.</div>
            )}
        </div>

        {/* Featured Engineers */}
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-100 break-words">Featured Engineers</h2>
            <button
              type="button"
              onClick={() => onNavigate(AppView.ENGINEER_LIST)}
              className="flex items-center gap-2 text-orange-400 font-semibold hover:underline"
            >
              View All <ChevronRightIcon className="w-5 h-5 text-orange-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredEngineers.slice(0, 3).map((engineer, index) => {
              const location = (engineer as any).location_text || (engineer as any).location || 'Location not set';
              return (
                <button
                  key={`${engineer.id || engineer.profile_id || 'engineer'}-${index}`}
                  type="button"
                  onClick={() => onSelectEngineer(engineer)}
                  className="text-left rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60 transition-all shadow-xl p-5"
                >
                  <div className="w-64 h-64 mx-auto rounded-full overflow-hidden shrink-0">
                    <img src={getProfileImageUrl(engineer)} alt={getDisplayName(engineer)} className="w-full h-full object-cover object-center" loading="lazy" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="text-slate-100 font-bold text-lg truncate">{getDisplayName(engineer)}</div>
                    <div className="text-slate-400 text-sm truncate">{location}</div>
                    <div className="pt-2">
                      <span className="text-xs px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-slate-200">
                        View Profile
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {featuredEngineers.length === 0 && (
            <div className="text-zinc-500 text-sm mt-3">No engineers available yet.</div>
          )}
        </div>

        {/* Featured Artists */}
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-100 break-words">Featured Artists</h2>
            <button
              type="button"
              onClick={() => onNavigate(AppView.ARTIST_LIST)}
              className="flex items-center gap-2 text-orange-400 font-semibold hover:underline"
            >
              View All <ChevronRightIcon className="w-5 h-5 text-orange-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredArtists.slice(0, 3).map((artist, index) => {
              const isAria = (artist as any).email === 'aria@stoodioz.ai';
              const location = isAria ? 'AI Assistant' : ((artist as any).location_text || (artist as any).location || 'Location not set');
              return (
                <button
                  key={`${artist.id || artist.profile_id || 'artist'}-${index}`}
                  type="button"
                  onClick={() => onSelectArtist(artist)}
                  className="text-left rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60 transition-all shadow-xl p-5"
                >
                  <div className="w-64 h-64 mx-auto rounded-full overflow-hidden shrink-0">
                    <img src={getProfileImageUrl(artist)} alt={getDisplayName(artist)} className="w-full h-full object-cover object-center" loading="lazy" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="text-slate-100 font-bold text-lg truncate">{getDisplayName(artist)}</div>
                    <div className="text-slate-400 text-sm truncate">{location}</div>
                    <div className="pt-2">
                      <span className="text-xs px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-slate-200">
                        View Profile
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {featuredArtists.length === 0 && (
            <div className="text-zinc-500 text-sm mt-3">No artists available yet.</div>
          )}
        </div>
      </section>

      {/* ===== EXTRA ADDITIONS (BOTTOM) ===== */}
      <section>
        <div className="cardSurface p-8 rounded-3xl border border-zinc-800 bg-zinc-950/60">
          <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-100">Live marketplace count</h3>
          <p className="text-slate-400 mt-2">
            Total users: <span className="text-orange-400 font-bold">{counts.total}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 text-sm">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col items-center justify-center">
              <MicrophoneIcon className="w-8 h-8 text-blue-400 mb-2" />
              <div className="text-slate-400 text-xs mb-1">Artists</div>
              <div className="text-slate-100 font-extrabold text-lg">{counts.artists}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col items-center justify-center">
              <SoundWaveIcon className="w-8 h-8 text-orange-400 mb-2" />
              <div className="text-slate-400 text-xs mb-1">Engineers</div>
              <div className="text-slate-100 font-extrabold text-lg">{counts.engineers}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col items-center justify-center">
              <MusicNoteIcon className="w-8 h-8 text-purple-400 mb-2" />
              <div className="text-slate-400 text-xs mb-1">Producers</div>
              <div className="text-slate-100 font-extrabold text-lg">{counts.producers}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col items-center justify-center">
              <HouseIcon className="w-8 h-8 text-red-400 mb-2" />
              <div className="text-slate-400 text-xs mb-1">Stoodioz</div>
              <div className="text-slate-100 font-extrabold text-lg">{counts.stoodioz}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col items-center justify-center">
              <MusicNoteIcon className="w-8 h-8 text-orange-400 mb-2" />
              <div className="text-slate-400 text-xs mb-1">Labels</div>
              <div className="text-slate-100 font-extrabold text-lg">{counts.labels}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

