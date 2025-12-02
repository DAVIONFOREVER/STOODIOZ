
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useMessaging } from '../hooks/useMessaging';
import { ChevronLeftIcon, BriefcaseIcon, MessageIcon, LinkIcon } from './icons';
import { Label } from '../types';

const LabelPublicProfile: React.FC = () => {
    const { currentUser } = useAppState();
    
    // NOTE: In a full implementation, `selectedLabel` would be pulled from AppState. 
    // Since we are adding this iteratively, we check if the current user is viewing their own profile 
    // or fallback to a mock for the layout demonstration if no specific label is selected in context.
    
    const label: Label = (currentUser && 'company_name' in currentUser) ? (currentUser as Label) : {
        id: 'mock-label-id',
        name: 'Top Tier Management',
        email: 'contact@toptier.com',
        image_url: '',
        cover_image_url: '',
        followers: 0,
        follower_ids: [],
        following: { artists: [], engineers: [], stoodioz: [], producers: [] },
        wallet_balance: 0,
        wallet_transactions: [],
        coordinates: { lat: 0, lon: 0 },
        show_on_map: false,
        is_online: false,
        rating_overall: 5.0,
        sessions_completed: 0,
        ranking_tier: 'Provisional' as any,
        is_on_streak: false,
        on_time_rate: 100,
        completion_rate: 100,
        repeat_hire_rate: 100,
        strength_tags: [],
        local_rank_text: '',
        company_name: 'Top Tier LLC',
        website: 'https://toptier.com',
        notes: 'Global management for elite talent.',
        roster: ['user-123'] // Example roster ID
    };

    const { navigate, goBack } = useNavigation();
    const { startConversation } = useMessaging(navigate);

    const isOnRoster = currentUser && label.roster?.includes(currentUser.id);
    const isLoggedIn = !!currentUser;

    const handleMessage = () => {
        if (isLoggedIn && isOnRoster) {
            startConversation(label);
        }
    };

    return (
        <div>
            <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back
            </button>

            <div className="max-w-4xl mx-auto">
                <div className="p-8 cardSurface mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="w-32 h-32 bg-zinc-800 rounded-2xl flex items-center justify-center border-4 border-zinc-700 flex-shrink-0">
                            {label.image_url && label.image_url.startsWith('http') ? (
                                <img src={label.image_url} alt={label.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <BriefcaseIcon className="w-16 h-16 text-zinc-500" />
                            )}
                        </div>
                        <div className="text-center md:text-left flex-grow">
                            <h1 className="text-4xl font-extrabold text-blue-400">{label.name}</h1>
                            {label.company_name && <p className="text-zinc-400 text-lg mt-1">{label.company_name}</p>}
                            <p className="text-slate-300 mt-4 max-w-2xl">{label.notes}</p>
                            
                            {label.website && (
                                <a href={label.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-400 hover:underline mt-4">
                                    <LinkIcon className="w-4 h-4" /> {label.website}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="cardSurface p-8 text-center">
                    <h3 className="text-xl font-bold text-zinc-100 mb-4">Contact Label</h3>
                    
                    {!isLoggedIn ? (
                        <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 inline-block">
                            <p className="text-zinc-400">Log in to message this label.</p>
                        </div>
                    ) : (
                        <>
                            {isOnRoster ? (
                                <button 
                                    onClick={handleMessage}
                                    className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2 mx-auto"
                                >
                                    <MessageIcon className="w-5 h-5" />
                                    Message Label
                                </button>
                            ) : (
                                <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30 inline-block">
                                    <p className="text-red-300 font-medium mb-1">Messaging Disabled</p>
                                    <p className="text-zinc-400 text-sm">Only roster members may contact this label directly.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabelPublicProfile;
