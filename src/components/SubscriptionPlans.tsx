import React from 'react';
import { UserRole, SubscriptionPlan } from '../types';
import { CheckCircleIcon, MicrophoneIcon, MusicNoteIcon, SoundWaveIcon, HouseIcon } from './icons';
import { useAppState } from '../contexts/AppContext';

interface SubscriptionPlansProps {
    onSelect: (role: UserRole) => void;
    onSubscribe: (plan: SubscriptionPlan) => void;
}

const PlanCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    price: string;
    features: string[];
    tagline: string;
    role: UserRole;
    planType?: SubscriptionPlan;
    isFeatured?: boolean;
    isCurrent?: boolean;
    onAction: () => void;
}> = ({ icon, title, price, features, tagline, isFeatured, isCurrent, onAction }) => (
    <div className={`relative p-8 flex flex-col rounded-[24px] border transition-all duration-500 ${
        isFeatured 
        ? 'bg-zinc-900 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.15)] scale-105 z-10' 
        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
    }`}>
        {isFeatured && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                Most Popular
            </div>
        )}

        <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${isFeatured ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-400'}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{price === '0' ? 'Free Entry' : 'Pro Tier'}</p>
            </div>
        </div>

        <div className="mb-8">
            <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">${price}</span>
                {price !== '0' && <span className="text-zinc-500 font-bold">/mo</span>}
            </div>
            <p className="text-zinc-400 text-sm mt-4 leading-relaxed font-medium italic">"{tagline}"</p>
        </div>

        <ul className="space-y-4 mb-10 flex-grow">
            {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-300 text-sm leading-snug">{feature}</span>
                </li>
            ))}
        </ul>

        <button
            onClick={onAction}
            disabled={isCurrent}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${
                isCurrent 
                ? 'bg-zinc-800 text-zinc-500 cursor-default border border-zinc-700' 
                : isFeatured 
                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20 hover:-translate-y-1' 
                : 'bg-white text-black hover:bg-orange-500 hover:text-white hover:-translate-y-1'
            }`}
        >
            {isCurrent ? 'Active Plan' : price === '0' ? 'Get Started' : 'Upgrade Now'}
        </button>
    </div>
);

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelect, onSubscribe }) => {
    const { currentUser, userRole } = useAppState();

    const handleAction = (role: UserRole, plan?: SubscriptionPlan) => {
        if (!currentUser) {
            onSelect(role); // Navigate to signup for that role
        } else if (plan) {
            onSubscribe(plan); // Trigger Stripe checkout
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
            <div className="text-center mb-20">
                <h2 className="text-zinc-500 text-sm font-black uppercase tracking-[0.4em] mb-4">Strategic Access</h2>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">
                    Choose Your <span className="text-orange-500">Tier.</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-medium">
                    From independent creators to global labels, select the plan that powers your operational objectives.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
                <PlanCard
                    title="Artist"
                    price="0"
                    icon={<MicrophoneIcon className="w-6 h-6" />}
                    tagline="Your sound is waiting. We'll help you find it."
                    role={UserRole.ARTIST}
                    isCurrent={userRole === UserRole.ARTIST}
                    onAction={() => handleAction(UserRole.ARTIST)}
                    features={[
                        "Build your public profile",
                        "Post on The Stage",
                        "Use AI Vibe Matcher",
                        "Book any studio or talent",
                        "Access Asset Vault (1GB)"
                    ]}
                />

                <PlanCard
                    title="Producer"
                    price="39"
                    icon={<MusicNoteIcon className="w-6 h-6" />}
                    tagline="Turn your beats into a business."
                    role={UserRole.PRODUCER}
                    planType={SubscriptionPlan.PRODUCER_PRO}
                    isCurrent={currentUser?.subscription?.plan === SubscriptionPlan.PRODUCER_PRO}
                    onAction={() => handleAction(UserRole.PRODUCER, SubscriptionPlan.PRODUCER_PRO)}
                    features={[
                        "Full Beat Store integration",
                        "Sell Masterclasses",
                        "Custom 'Pull Up' fees",
                        "Sales Analytics dashboard",
                        "Priority in search results"
                    ]}
                />

                <PlanCard
                    title="Engineer"
                    price="69"
                    icon={<SoundWaveIcon className="w-6 h-6" />}
                    tagline="Your talent, your terms. Work comes to you."
                    isFeatured={true}
                    role={UserRole.ENGINEER}
                    planType={SubscriptionPlan.ENGINEER_PLUS}
                    isCurrent={currentUser?.subscription?.plan === SubscriptionPlan.ENGINEER_PLUS}
                    onAction={() => handleAction(UserRole.ENGINEER, SubscriptionPlan.ENGINEER_PLUS)}
                    features={[
                        "Real-time Job Board access",
                        "Job alerts by radius",
                        "Offer Remote Mixing",
                        "Verified Engineer badge",
                        "Lower service commission"
                    ]}
                />

                <PlanCard
                    title="Stoodio"
                    price="149"
                    icon={<HouseIcon className="w-6 h-6" />}
                    tagline="Your space, fully booked. On autopilot."
                    role={UserRole.STOODIO}
                    planType={SubscriptionPlan.STOODIO_PRO}
                    isCurrent={currentUser?.subscription?.plan === SubscriptionPlan.STOODIO_PRO}
                    onAction={() => handleAction(UserRole.STOODIO, SubscriptionPlan.STOODIO_PRO)}
                    features={[
                        "Multi-room management",
                        "Roster management tools",
                        "Google Business sync",
                        "Post to Job Board",
                        "Advanced Studio Insights"
                    ]}
                />
            </div>

            <div className="mt-24 p-12 rounded-[32px] bg-zinc-900 border border-zinc-800 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <HouseIcon className="w-40 h-40 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Are you a Label or Management firm?</h3>
                <p className="text-zinc-400 max-w-xl mx-auto mb-8 font-medium">
                    We offer custom enterprise solutions for roster oversight, centralized billing, and advanced A&R intelligence.
                </p>
                <button className="px-8 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all border border-zinc-700">
                    Contact Enterprise Sales
                </button>
            </div>
        </div>
    );
};

export default SubscriptionPlans;
