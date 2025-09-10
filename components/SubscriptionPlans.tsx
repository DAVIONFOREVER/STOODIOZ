import React from 'react';
import { AppView, UserRole } from '../types';
import { CheckCircleIcon, StarIcon, SoundWaveIcon, HouseIcon, MicrophoneIcon, MusicNoteIcon } from './icons';

interface SubscriptionPlansProps {
    onSelect: (role: UserRole) => void;
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
    description: string;
    features: string[];
    isFeatured?: boolean;
    onSelect: () => void;
}> = ({ icon, title, price, description, features, isFeatured, onSelect }) => (
    <div className={`border rounded-2xl p-8 flex flex-col ${isFeatured ? 'border-orange-500/50 bg-zinc-900 shadow-2xl shadow-orange-500/10' : 'border-zinc-700/50 bg-zinc-800/50'}`}>
        <div className="flex-grow">
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h3 className="text-2xl font-bold text-zinc-100">{title}</h3>
            </div>
            <p className="text-zinc-400 mb-6">{description}</p>
            <div className="mb-8">
                <span className="text-5xl font-extrabold text-zinc-100">${price}</span>
                <span className="text-zinc-400 font-medium">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                    <FeatureListItem key={index}>{feature}</FeatureListItem>
                ))}
            </ul>
        </div>
        <button 
            onClick={onSelect}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${isFeatured ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20' : 'bg-zinc-700 text-white hover:bg-zinc-600'}`}
        >
            Choose {title}
        </button>
    </div>
);

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelect }) => {
    
    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="text-center mb-16">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-100">
                    Find the perfect plan
                </h1>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-400">
                    Unlock powerful tools to grow your career or business. Joining as an Artist is always free.
                </p>
            </div>
            
             <div className="space-y-16">
                {/* Artist Plan - Featured Separately */}
                <div className="border border-zinc-700/50 bg-zinc-800/50 rounded-2xl p-8 flex flex-col md:flex-row md:items-center gap-8">
                     <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                            <MicrophoneIcon className="w-8 h-8 text-green-400"/>
                            <h3 className="text-2xl font-bold text-zinc-100">Artist</h3>
                        </div>
                        <p className="text-zinc-400 mb-6">For creators looking to find their sound and collaborators.</p>
                        <ul className="space-y-4 mb-8 grid grid-cols-1 sm:grid-cols-2">
                            <FeatureListItem>Create a professional artist profile</FeatureListItem>
                            <FeatureListItem>Search and browse all stoodioz & engineers</FeatureListItem>
                            <FeatureListItem>Book sessions and manage your projects</FeatureListItem>
                            <FeatureListItem>Connect with the community on The Stage</FeatureListItem>
                            <FeatureListItem>Use the AI Vibe Matcher to find collaborators</FeatureListItem>
                        </ul>
                    </div>
                     <div className="flex-shrink-0 text-center md:w-64">
                        <p className="text-5xl font-extrabold text-zinc-100">Free</p>
                         <button 
                            onClick={() => onSelect(UserRole.ARTIST)}
                            className="w-full mt-4 py-3 rounded-lg font-bold text-lg transition-all bg-green-500 text-white hover:bg-green-600"
                        >
                            Join as an Artist
                        </button>
                     </div>
                </div>

                {/* Professional Plans */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    <PlanCard
                        icon={<SoundWaveIcon className="w-8 h-8 text-indigo-400"/>}
                        title="Engineer Plus"
                        price="19"
                        description="For freelance engineers looking to find work and build their reputation."
                        features={[
                            "Public profile & audio portfolio",
                            "Full access to the Job Board",
                            "Enhanced visibility in search results",
                            "Set your minimum pay rate",
                            "Direct booking requests from artists",
                        ]}
                        onSelect={() => onSelect(UserRole.ENGINEER)}
                    />
                     <PlanCard
                        icon={<HouseIcon className="w-8 h-8 text-orange-400"/>}
                        title="Stoodio Pro"
                        price="49"
                        description="The all-in-one solution for stoodio owners to manage and grow their business."
                        features={[
                            "Unlimited room & equipment listings",
                            "Advanced calendar management",
                            "Financial dashboard & analytics",
                            "Post jobs to the Engineer Job Board",
                            "Lower platform fees on bookings",
                            "Get a 'Verified Stoodio' badge",
                        ]}
                        isFeatured
                        onSelect={() => onSelect(UserRole.STOODIO)}
                    />
                    <PlanCard
                        icon={<MusicNoteIcon className="w-8 h-8 text-purple-400"/>}
                        title="Producer Pro"
                        price="29"
                        description="For producers to sell beats, get hired, and build their brand."
                        features={[
                            "Public producer profile & beat store",
                            "Unlimited beat uploads",
                            "Lower commission fees on sales",
                            "Direct collaboration requests",
                            "Featured placements in search",
                        ]}
                        onSelect={() => onSelect(UserRole.PRODUCER)}
                    />
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPlans;
