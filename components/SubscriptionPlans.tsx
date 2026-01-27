// components/SubscriptionPlans.tsx

import React from 'react';
import { UserRole, SubscriptionPlan } from '../types';
import { CheckCircleIcon, SoundWaveIcon, HouseIcon, MicrophoneIcon, MusicNoteIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';

interface SubscriptionPlansProps {
  onSelect: (role: UserRole) => void;
  onSubscribe: () => void; // keep prop for later use, but DO NOT call it during onboarding
}

const FeatureListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-3">
    <CheckCircleIcon className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
    <span className="text-zinc-400">{children}</span>
  </li>
);

const PlanCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  price: string;
  pricePeriod?: string;
  features: string[];
  tagline: string;
  buttonText: string;
  isFeatured?: boolean;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
  isCurrentPlan?: boolean;
}> = ({
  icon,
  title,
  price,
  pricePeriod = '/month',
  features,
  tagline,
  buttonText,
  isFeatured,
  badge,
  onClick,
  disabled = false,
  isCurrentPlan
}) => (
  <div className={`relative p-8 flex flex-col cardSurface ${isFeatured ? 'border-2 border-orange-500' : ''} ${disabled && !isCurrentPlan ? 'opacity-60' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : ''}`}>
    {badge && (
      <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">{badge}</div>
    )}
    {isCurrentPlan && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
        <CheckCircleIcon className="w-4 h-4" /> Active Plan
      </div>
    )}
    <div className="flex-grow">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-2xl font-bold text-zinc-100">{title}</h3>
      </div>

      <div className="mb-8">
        <span className="text-5xl font-extrabold text-zinc-100">${price}</span>
        {price !== '0' && <span className="text-zinc-400 font-medium">{pricePeriod}</span>}
        {price === '0' && <span className="text-zinc-400 font-medium">/ forever</span>}
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <FeatureListItem key={index}>{feature}</FeatureListItem>
        ))}
      </ul>
    </div>

    <div className="mt-auto">
      <p className="text-center text-zinc-400 italic text-sm mb-6 h-10 flex items-center justify-center">“{tagline}”</p>
      <button
        onClick={onClick}
        disabled={disabled || isCurrentPlan}
        className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
          isFeatured && !disabled && !isCurrentPlan
            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
            : isCurrentPlan
              ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-default'
              : 'bg-zinc-700 text-white hover:bg-zinc-600'
        } ${disabled && !isCurrentPlan ? 'cursor-not-allowed bg-zinc-600 text-zinc-400' : ''}`}
      >
        {isCurrentPlan ? 'Current Plan' : buttonText}
      </button>
    </div>
  </div>
);

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelect }) => {
  const { currentUser } = useAppState();
  const { navigate } = useNavigation();

  /**
   * 🔒 FIX: Never decide onboarding vs upgrade based on currentUser/subscription/role.
   * During login bootstrap those can be null and it blocks ALL account types.
   *
   * ✅ This page now ONLY selects a role to onboard.
   * Upgrades should happen after the user is inside the app (Settings/Billing).
   */
  const handlePlanSelection = (role: UserRole) => {
    onSelect(role); // ALWAYS do onboarding flow
  };

  /**
   * Keep "isSubscribed" only for display later; do NOT use it to disable onboarding.
   * If your currentUser/subscription loads later, it won't block login.
   */
  const isSubscribed = (plan: SubscriptionPlan) =>
    currentUser?.subscription?.status === 'active' && currentUser?.subscription?.plan === plan;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-100">
          Find the perfect plan
        </h1>
        <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-400">
          Unlock powerful tools to grow your career or business. Joining as an Artist is always free.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
        <PlanCard
          icon={<MicrophoneIcon className="w-8 h-8 text-green-400" />}
          title="Artist"
          price="0"
          features={[
            "Build your artist profile and post on The Stage.",
            "Use the AI Vibe Matcher to discover your perfect collaborators.",
            "Search, book, and manage sessions with top-tier talent.",
            "Access and purchase exclusive masterclasses from industry pros."
          ]}
          tagline="Your sound is waiting. We'll help you find it."
          buttonText="Start Free"
          onClick={() => handlePlanSelection(UserRole.ARTIST)}
          disabled={false}
          isCurrentPlan={false}
        />

        <PlanCard
          icon={<MusicNoteIcon className="w-8 h-8 text-purple-400" />}
          title="Producer"
          price="39"
          badge="PRO"
          features={[
            "Launch your own Beat Store to sell and lease instrumentals.",
            "Monetize your expertise by creating and selling a Masterclass.",
            "Get hired for 'Pull Up' sessions with a custom appearance fee.",
            "Track your sales and profile growth with an advanced Analytics Dashboard."
          ]}
          tagline="Turn your beats into a business."
          buttonText="Continue"
          onClick={() => handlePlanSelection(UserRole.PRODUCER)}
          disabled={false}
          isCurrentPlan={false}
        />

        <PlanCard
          icon={<SoundWaveIcon className="w-8 h-8 text-indigo-400" />}
          title="Engineer"
          price="69"
          badge="PRO"
          isFeatured
          features={[
            "Get hired instantly via the exclusive Job Board with custom alerts.",
            "Offer remote Mixing & Mastering services to a global client base.",
            "Create and sell your own Masterclass to share your knowledge.",
            "Showcase your skills with a dedicated Mixing Samples portfolio."
          ]}
          tagline="Your talent, your terms. We bring the work to you."
          buttonText="Continue"
          onClick={() => handlePlanSelection(UserRole.ENGINEER)}
          disabled={false}
          isCurrentPlan={false}
        />

        <PlanCard
          icon={<HouseIcon className="w-8 h-8 text-red-400" />}
          title="Stoodio"
          price="149"
          badge="PRO"
          features={[
            "Manage multi-room availability, amenities, and pricing in one place.",
            "Build and manage your roster of in-house engineers with custom pay rates.",
            "Post openings directly to the Job Board to find available talent for sessions.",
            "Get verified to build trust and boost your visibility in search and on the Map."
          ]}
          tagline="Your space, fully booked. Your business, on autopilot."
          buttonText="Continue"
          onClick={() => handlePlanSelection(UserRole.STOODIO)}
          disabled={false}
          isCurrentPlan={false}
        />
      </div>
    </div>
  );
};

export default SubscriptionPlans;
