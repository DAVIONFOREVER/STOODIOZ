
import React from 'react';
import { UserRole, SubscriptionPlan } from '../types';
import { CheckCircleIcon } from './icons';

interface SubscriptionPlansProps {
    onSelect: (role: UserRole) => void;
    onSubscribe: (role: UserRole) => void;
}

const PlanCard: React.FC<{
    title: string;
    price: string;
    features: string[];
    onSubscribe: () => void;
}> = ({ title, price, features, onSubscribe }) => (
    <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700/50 flex flex-col">
        <h3 className="text-2xl font-bold text-orange-400">{title}</h3>
        <p className="text-4xl font-extrabold text-slate-100 my-4">{price}<span className="text-base font-medium text-slate-400">/mo</span></p>
        <ul className="space-y-3 text-slate-300 mb-8 flex-grow">
            {features.map(feature => (
                <li key={feature} className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <button onClick={onSubscribe} className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all">
            Get Started
        </button>
    </div>
);


const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelect, onSubscribe }) => {
    return (
        <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-100">
                Choose Your <span className="text-orange-400">Pro Plan</span>
            </h1>
            <p className="max-w-2xl mx-auto mt-4 text-lg text-slate-400">
                Unlock powerful features to grow your career and business on Stoodioz.
            </p>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <PlanCard 
                    title="Engineer+"
                    price="$19"
                    features={["Receive push notifications for new job postings", "Advanced profile analytics", "Priority placement in search results", "Reduced service fees on sessions"]}
                    onSubscribe={() => onSubscribe(UserRole.ENGINEER)}
                />
                 <PlanCard 
                    title="Producer Pro"
                    price="$29"
                    features={["Unlimited beat uploads", "Featured placement on producer lists", "Advanced sales analytics", "Lower commission on all sales"]}
                    onSubscribe={() => onSubscribe(UserRole.PRODUCER)}
                />
                 <PlanCard 
                    title="Stoodio Pro"
                    price="$49"
                    features={["Advanced booking and revenue analytics", "Priority placement in search and map views", "Create and post jobs for engineers", "Reduced service fees on all bookings"]}
                    onSubscribe={() => onSubscribe(UserRole.STOODIO)}
                />
            </div>
             <div className="mt-12">
                <p className="text-slate-400">Are you an artist?</p>
                <button onClick={() => onSelect(UserRole.ARTIST)} className="font-semibold text-orange-400 hover:underline">
                    Create your free artist profile today!
                </button>
            </div>
        </div>
    );
};

export default SubscriptionPlans;
