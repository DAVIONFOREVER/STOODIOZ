import React, { useEffect, useMemo, useRef, useState, lazy, Suspense, useCallback } from 'react';
import type { Engineer, Post } from '../types';
import { AppView, SubscriptionPlan, UserRole } from '../types';
import { DollarSignIcon, CalendarIcon, StarIcon, EditIcon, PhotoIcon } from './icons';

import CreatePost from './CreatePost.tsx';
import PostFeed from './PostFeed.tsx';
import StageCreatorHub from './StageCreatorHub';
import AvailabilityManager from './AvailabilityManager.tsx';
import NotificationSettings from './NotificationSettings.tsx';
import Wallet from './Wallet.tsx';
import MixingServicesManager from './MixingServicesManager.tsx';
import MixingSampleManager from './MixingSampleManager.tsx';
import Following from './Following.tsx';
import FollowersList from './FollowersList.tsx';
import VerifiedBadge from './VerifiedBadge';
import ProfileBioEditor from './ProfileBioEditor';

import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';
import { useNavigation } from '../hooks/useNavigation.ts';
import { useSocial } from '../hooks/useSocial.ts';
import { useProfile } from '../hooks/useProfile.ts';

import * as apiService from '../services/apiService';
import { getProfileImageUrl } from '../constants';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard.tsx'));
const Documents = lazy(() => import('./Documents.tsx'));
const MasterclassManager = lazy(() => import('./MasterclassManager.tsx'));

type DashboardTab =
  | 'dashboard'
  | 'analytics'
  | 'jobBoard'
  | 'availability'
  | 'mixingSamples'
  | 'mixingServices'
  | 'notificationSettings'
  | 'wallet'
  | 'followers'
  | 'following'
  | 'documents'
  | 'masterclass';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-4 flex items-center gap-4 cardSurface">
    <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
    <div>
      <p className="text-zinc-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-3 font-semibold text-sm transition-colors whitespace-nowrap ${
      isActive ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100 border-b-2 border-transparent'
    }`}
  >
    {label}
  </button>
);

const UpgradePlusCard: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => (
  <div className="cardSurface border-2 border-orange-500 p-6 text-zinc-100 text-center">
    <StarIcon className="w-10 h-10 mx-auto text-orange-400/80 mb-2" />
    <h3 className="text-xl font-bold mb-2">Upgrade to Engineer Plus</h3>
    <p className="text-sm text-zinc-400 mb-4">Unlock advanced job filters, lower service fees, and priority support to boost your career.</p>
    <button
      type="button"
      onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
      className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all duration-300"
    >
      View Plans
    </button>
  </div>
);

const JobBoardPlaceholder: React.FC<{ isProPlan: boolean; onUpgrade: () => void }> = ({ isProPlan, onUpgrade }) => (
  <div className="cardSurface p-6 space-y-3">
    <h3 className="text-xl font-bold text-zinc-100">Job Board</h3>
    <p className="text-zinc-400 text-sm">
      {isProPlan
        ? 'Your Engineer Plus job board is warming up. It will populate as new requests arrive.'
        : 'Job Board access requires Engineer Plus. All other dashboard tabs stay fully available.'}
    </p>
    {!isProPlan && (
      <button
        type="button"
        onClick={onUpgrade}
        className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-orange-600 transition-colors"
      >
        View Engineer Plus
      </button>
    )}
  </div>
);

const EngineerDashboard: React.FC = () => {
  const { currentUser, bookings, dashboardInitialTab, artists, engineers, stoodioz, producers, conversations } = useAppState();
  const dispatch = useAppDispatch();

  const { navigate, viewBooking, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile } = useNavigation();
  const { createPost, likePost, commentOnPost, toggleFollow } = useSocial();
  const { updateProfile, refreshCurrentUser } = useProfile();

  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>((dashboardInitialTab as DashboardTab) || 'dashboard');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const postSectionRef = useRef<HTMLDivElement>(null);

  // Guard: if user not loaded yet
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-zinc-400">Loading user data...</p>
      </div>
    );
  }

  const engineer = currentUser as Engineer;
  const onOpenAria = () => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
  const handleManagePosts = () => {
    setActiveTab('dashboard');
    requestAnimationFrame(() => {
      postSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // If App wants to force-open a dashboard tab (e.g. documents)
  useEffect(() => {
    if (!dashboardInitialTab) return;
    setActiveTab(dashboardInitialTab as DashboardTab);
    dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } });
  }, [dashboardInitialTab, dispatch]);

  const refreshPosts = useCallback(async () => {
    if (!engineer.id) return;
    const posts = await apiService.fetchUserPosts(engineer.id);
    setMyPosts(posts);
  }, [engineer.id]);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  const handleNewPost = useCallback(
    async (postData: any) => {
      // optimistic insert
      const tempPost: Post = {
        id: `temp-${Date.now()}`,
        authorId: engineer.id,
        authorType: UserRole.ENGINEER,
        text: postData.text,
        image_url: postData.imageUrl,
        video_url: postData.videoUrl,
        video_thumbnail_url: postData.videoThumbnailUrl,
        link: postData.link,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
      };

      setMyPosts((prev) => [tempPost, ...prev]);
      await createPost(postData, UserRole.ENGINEER);
      await refreshPosts();
    },
    [engineer.id, createPost, refreshPosts]
  );

  const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
  const onOpenPayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });

  const handleImageUploadClick = () => fileInputRef.current?.click();
  const handleCoverImageUploadClick = () => coverImageInputRef.current?.click();

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) return;

      try {
        const url = await apiService.uploadAvatar(currentUser.id, file);
        await updateProfile({ image_url: url });
        await refreshCurrentUser();
      } catch (e: any) {
        console.error('Avatar upload failed', e);
        alert((e as Error)?.message || 'Profile photo could not be saved. Check storage/RLS or try again.');
      } finally {
        event.target.value = '';
      }
    },
    [currentUser, updateProfile, refreshCurrentUser]
  );

  const handleCoverFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) return;

      try {
        const url = await apiService.uploadCoverImage(currentUser.id, file);
        await updateProfile({ cover_image_url: url });
        await refreshCurrentUser();
      } catch (e: any) {
        console.error('Cover upload failed', e);
        alert((e as Error)?.message || 'Cover photo could not be saved. Check storage/RLS or try again.');
      } finally {
        event.target.value = '';
      }
    },
    [currentUser, updateProfile, refreshCurrentUser]
  );

  // Upcoming bookings for this engineer
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((b: any) => {
      const matches = b?.engineer?.id === engineer.id || b?.requested_engineer_id === engineer.id;
      if (!matches) return false;
      const dt = new Date(`${b.date}T${b.start_time}`);
      return dt >= now;
    });
  }, [bookings, engineer.id]);

  const isProPlan = engineer.subscription?.plan === SubscriptionPlan.ENGINEER_PLUS;

  // Followers + following lists
  const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);

  const followers = useMemo(() => {
    const ids = (engineer.follower_ids || []) as string[];
    return allUsers.filter((u: any) => ids.includes(u.id));
  }, [allUsers, engineer.follower_ids]);

  const followedArtists = useMemo(() => artists.filter((a: any) => (engineer.following?.artists || []).includes(a.id)), [artists, engineer.following]);
  const followedEngineers = useMemo(() => engineers.filter((e: any) => (engineer.following?.engineers || []).includes(e.id)), [engineers, engineer.following]);
  const followedStoodioz = useMemo(() => stoodioz.filter((s: any) => (engineer.following?.stoodioz || []).includes(s.id)), [stoodioz, engineer.following]);
  const followedProducers = useMemo(() => producers.filter((p: any) => (engineer.following?.producers || []).includes(p.id)), [producers, engineer.following]);

  const authorsMap = useMemo(() => new Map([[engineer.id, engineer]]), [engineer.id]);

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <Suspense fallback={<div>Loading Analytics...</div>}>
            <AnalyticsDashboard user={engineer} userRole={UserRole.ENGINEER} />
          </Suspense>
        );

      case 'jobBoard':
        return <JobBoardPlaceholder isProPlan={isProPlan} onUpgrade={() => navigate(AppView.SUBSCRIPTION_PLANS)} />;

      case 'availability':
        return <AvailabilityManager user={engineer} onUpdateUser={updateProfile} />;

      case 'mixingSamples':
        return <MixingSampleManager engineer={engineer} onRefresh={refreshCurrentUser} />;

      case 'mixingServices':
        return <MixingServicesManager engineer={engineer} onUpdateEngineer={updateProfile} />;

      case 'masterclass':
        return (
          <Suspense fallback={<div />}>
            <MasterclassManager user={engineer} onUpdateUser={updateProfile} />
          </Suspense>
        );

      case 'notificationSettings':
        return <NotificationSettings engineer={engineer} onUpdateEngineer={updateProfile} />;

      case 'wallet':
        return (
          <Wallet
            user={engineer}
            onAddFunds={onOpenAddFundsModal}
            onRequestPayout={onOpenPayoutModal}
            onViewBooking={viewBooking}
            userRole={UserRole.ENGINEER}
          />
        );

      case 'followers':
        return (
          <FollowersList
            followers={followers as any}
            onSelectArtist={viewArtistProfile}
            onSelectEngineer={viewEngineerProfile}
            onSelectStoodio={viewStoodioDetails}
            onSelectProducer={viewProducerProfile}
          />
        );

      case 'following':
        return (
          <Following
            artists={followedArtists as any}
            engineers={followedEngineers as any}
            studios={followedStoodioz as any}
            producers={followedProducers as any}
            onToggleFollow={toggleFollow}
            onSelectArtist={viewArtistProfile}
            onSelectEngineer={viewEngineerProfile}
            onSelectStudio={viewStoodioDetails}
            onSelectProducer={viewProducerProfile}
          />
        );

      case 'documents':
        return (
          <Suspense fallback={<div>Loading Documents...</div>}>
            <Documents conversations={conversations as any} />
          </Suspense>
        );

      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <StageCreatorHub
                currentUser={engineer}
                suggestions={[]}
                trendingPost={null}
                trendingPostAuthor={null}
                onToggleFollow={() => {}}
                onLikePost={() => {}}
                onCommentOnPost={() => {}}
                onSelectUser={() => {}}
                onNavigate={navigate}
                onOpenAria={onOpenAria}
                onManagePosts={handleManagePosts}
                onStartLive={() => navigate(AppView.INBOX)}
                onJoinLive={() => navigate(AppView.INBOX)}
                showSideSections={false}
                showQuickAccess={false}
              />
              <div ref={postSectionRef} className="space-y-6">
                <CreatePost currentUser={engineer} onPost={handleNewPost} />
                <PostFeed
                  posts={myPosts}
                  authors={authorsMap as any}
                  onLikePost={likePost}
                  onCommentOnPost={commentOnPost}
                  onSelectAuthor={() => viewEngineerProfile(engineer)}
                />
              </div>
            </div>
            <div className="lg:col-span-1 space-y-6">{!isProPlan && <UpgradePlusCard onNavigate={navigate} />}</div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="relative rounded-2xl overflow-hidden cardSurface group">
        <div className="h-48 md:h-64 bg-zinc-900 relative">
          {engineer.cover_image_url ? (
            <img
              src={engineer.cover_image_url}
              alt={`${engineer.name}'s cover photo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
              <p className="text-zinc-700 font-bold text-4xl opacity-20 uppercase tracking-widest">Engineer</p>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        <button
          type="button"
          onClick={handleCoverImageUploadClick}
          className="absolute top-4 right-4 bg-black/50 text-white text-xs font-semibold py-1.5 px-3 rounded-full hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-2"
        >
          <PhotoIcon className="w-4 h-4" /> Edit Cover
        </button>

        <input type="file" ref={coverImageInputRef} onChange={handleCoverFileChange} className="hidden" accept="image/*,.heic,.heif" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
              <div className="relative group/pfp flex-shrink-0">
                <img
                  src={getProfileImageUrl(engineer)}
                  alt={engineer.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-800"
                />
                <button
                  type="button"
                  onClick={handleImageUploadClick}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/pfp:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Change profile photo"
                >
                  <EditIcon className="w-8 h-8 text-white" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.heic,.heif" />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{engineer.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1"><VerifiedBadge labelVerified={!!(engineer as any).label_verified} /><p className="text-zinc-400">Engineer Dashboard</p></div>
              </div>
            </div>

            <label className="flex items-center cursor-pointer self-center sm:self-auto">
              <span className="text-sm font-medium text-zinc-300 mr-3">Available for Hire</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={Boolean((engineer as any).is_available)}
                  onChange={(e) => updateProfile({ is_available: e.target.checked } as any)}
                />
                <div className={`block w-12 h-6 rounded-full transition-colors ${(engineer as any).is_available ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(engineer as any).is_available ? 'translate-x-6' : ''}`}></div>
              </div>
            </label>
            <label className="flex items-center cursor-pointer self-center sm:self-auto">
              <span className="text-sm font-medium text-zinc-300 mr-3">Show on Map</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={Boolean((engineer as any).show_on_map)}
                  onChange={(e) => updateProfile({ show_on_map: e.target.checked } as any)}
                />
                <div className={`block w-12 h-6 rounded-full transition-colors ${(engineer as any).show_on_map ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(engineer as any).show_on_map ? 'translate-x-6' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Wallet Balance" value={`$${Number(engineer.wallet_balance || 0).toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
        <StatCard label="Upcoming Sessions" value={upcomingBookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
        <StatCard label="Overall Rating" value={Number((engineer as any).rating_overall || 0).toFixed(1)} icon={<StarIcon className="w-6 h-6 text-yellow-400" />} />
      </div>

      <ProfileBioEditor
        value={engineer.bio || ''}
        placeholder="Share your specialties, workflow, and availability details."
        onSave={async (next) => {
          await updateProfile({ bio: next });
          await refreshCurrentUser();
        }}
      />

      {/* Tabs */}
      <div className="cardSurface">
        <div className="flex border-b border-zinc-700/50 overflow-x-auto">
          <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <TabButton label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <TabButton label="Job Board" isActive={activeTab === 'jobBoard'} onClick={() => setActiveTab('jobBoard')} />
          <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
          <TabButton label="Mixing Samples" isActive={activeTab === 'mixingSamples'} onClick={() => setActiveTab('mixingSamples')} />
          <TabButton label="Mixing Services" isActive={activeTab === 'mixingServices'} onClick={() => setActiveTab('mixingServices')} />
          <TabButton label="Masterclass" isActive={activeTab === 'masterclass'} onClick={() => setActiveTab('masterclass')} />
          <TabButton label="Notifications" isActive={activeTab === 'notificationSettings'} onClick={() => setActiveTab('notificationSettings')} />
          <TabButton label="Wallet" isActive={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
          <TabButton label="Followers" isActive={activeTab === 'followers'} onClick={() => setActiveTab('followers')} />
          <TabButton label="Following" isActive={activeTab === 'following'} onClick={() => setActiveTab('following')} />
          <TabButton label="Documents" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
        </div>

        <div className="p-6">{renderContent()}</div>
      </div>
    </div>
  );
};

export default EngineerDashboard;
