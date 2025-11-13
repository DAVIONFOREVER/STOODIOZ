import React from 'react';
import { AppView, UserRole, SubscriptionPlan } from '../types';
import { CheckCircleIcon, SoundWaveIcon, HouseIcon, MicrophoneIcon, MusicNoteIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';

interface SubscriptionPlansProps {
    onSelect: (role: UserRole) => void;
    onSubscribe: () => void;
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
}> = ({ icon, title, price, pricePeriod = '/month', features, tagline, buttonText, isFeatured, badge, onClick, disabled = false }) => (
    <div className={`relative p-8 flex flex-col cardSurface ${isFeatured ? 'border-2 border-orange-500' : ''} ${disabled && title !== 'Artist' ? 'opacity-60' : ''}`}>
        {badge && (
            <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">{badge}</div>
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
                disabled={disabled}
                className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                    isFeatured && !disabled ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20' 
                    : 'bg-zinc-700 text-white'} ${
                    disabled ? 'cursor-not-allowed bg-zinc-600' : 'hover:bg-zinc-600'
                }`}
            >
                {buttonText}
            </button>
        </div>
    </div>
);

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelect, onSubscribe }) => {
    const { currentUser, userRole } = useAppState();
    const { navigate } = useNavigation();

    const handlePlanSelection = (role: UserRole) => {
        if (currentUser) {
            // Logged-in user is upgrading their current role
            onSubscribe();
        } else {
            // New user is selecting a role to sign up
            onSelect(role);
        }
    };
    
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
                    icon={<MicrophoneIcon className="w-8 h-8 text-green-400"/>}
                    title="Artist"
                    price="0"
                    features={[
                        "Create a profile and get verified",
                        "Search and book studios, producers, and engineers",
                        "Message and manage your sessions",
                    ]}
                    tagline="Start your journey — find your sound."
                    buttonText="Start Free"
                    onClick={() => handlePlanSelection(UserRole.ARTIST)}
                    disabled={!!currentUser}
                />
                <PlanCard
                    icon={<MusicNoteIcon className="w-8 h-8 text-purple-400"/>}
                    title="Producer"
                    price="39"
                    badge="PRO"
                    features={[
                        "Verified producer profile",
                        "Booking calendar and payment integration",
                        "Analytics and client management",
                        "Appear in search results for hiring artists",
                    ]}
                    tagline="Get found. Get paid. Get busy."
                    buttonText={isSubscribed(SubscriptionPlan.PRODUCER_PRO) ? "Current Plan" : "Upgrade Now"}
                    onClick={() => handlePlanSelection(UserRole.PRODUCER)}
                    disabled={isSubscribed(SubscriptionPlan.PRODUCER_PRO) || (!!currentUser && userRole !== UserRole.PRODUCER)}
                />
                 <PlanCard
                    icon={<SoundWaveIcon className="w-8 h-8 text-indigo-400"/>}
                    title="Engineer"
                    price="69"
                    badge="PRO"
                    isFeatured={!currentUser || userRole === UserRole.ENGINEER}
                    features={[
                        "Verified engineer listing in marketplace",
                        "Job board access and repeat-client automation",
                        "Session calendar + automated reminders",
                        "Insights dashboard for income and session tracking",
                    ]}
                    tagline="More sessions. Less chasing."
                    buttonText={isSubscribed(SubscriptionPlan.ENGINEER_PLUS) ? "Current Plan" : "Upgrade Now"}
                    onClick={() => handlePlanSelection(UserRole.ENGINEER)}
                    disabled={isSubscribed(SubscriptionPlan.ENGINEER_PLUS) || (!!currentUser && userRole !== UserRole.ENGINEER)}
                />
                 <PlanCard
                    icon={<HouseIcon className="w-8 h-8 text-red-400"/>}
                    title="Stoodio"
                    price="149"
                    badge="PRO"
                    features={[
                        "Full studio management suite",
                        "Multi-room scheduling and staff coordination",
                        "Instant payments, financial dashboard, and reviews",
                        "Google Maps integration for location-based bookings",
                    ]}
                    tagline="Run your studio like a business, not a hustle."
                    buttonText={isSubscribed(SubscriptionPlan.STOODIO_PRO) ? "Current Plan" : "Upgrade Now"}
                    onClick={() => handlePlanSelection(UserRole.STOODIO)}
                    disabled={isSubscribed(SubscriptionPlan.STOODIO_PRO) || (!!currentUser && userRole !== UserRole.STOODIO)}
                />
            </div>
        </div>
    );
};

export default SubscriptionPlans;