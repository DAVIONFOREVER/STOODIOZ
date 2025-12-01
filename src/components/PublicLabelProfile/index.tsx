
import React, { useState, useEffect } from 'react';
import { useAppState } from '../../contexts/AppContext';
import { useNavigation } from '../../hooks/useNavigation';
import { useMessaging } from '../../hooks/useMessaging';
import { LinkIcon, MessageIcon, VerifiedIcon, UsersIcon } from '../icons';
import * as apiService from '../../services/apiService';
import type { Artist, Engineer, Producer } from '../../types';

// Simple Roster Card Component
const RosterCard: React.FC<{ member: any; type: string; onClick: () => void }> = ({ member, type, onClick }) => (
    <button onClick={onClick} className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:bg-zinc-800 transition-colors text-left w-full">
        <img src={member.image_url} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
        <div>
            <p className="font-bold text-zinc-200 text-sm">{member.name}</p>
            <p className="text-xs text-zinc-500 capitalize">{type}</p>
        </div>
    </button>
);

const PublicLabelProfile: React.FC = () => {
    const { selectedLabel, currentUser } = useAppState();
    const { goBack, viewArtistProfile, viewEngineerProfile, viewProducerProfile, navigate } = useNavigation();
    const { startConversation } = useMessaging(navigate);
    
    const [roster, setRoster] = useState<{ artists: any[], producers: any[], engineers: any[] } | null>(null);
    const [isRosterMember, setIsRosterMember] = useState(false);
    const [isLoadingRoster, setIsLoadingRoster] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!selectedLabel) return;
            setIsLoadingRoster(true);
            
            // 1. Fetch Roster
            const rosterData = await apiService.fetchLabelRoster(selectedLabel.id);
            setRoster(rosterData);

            // 2. Check Permissions (Critical Messaging Lock)
            if (currentUser) {
                const authorized = await apiService.checkRosterMembership(selectedLabel.id, currentUser.id);
                setIsRosterMember(authorized);
            }
            
            setIsLoadingRoster(false);
        };
        loadData();
    }, [selectedLabel, currentUser]);

    if (!selectedLabel) return <div className="p-10 text-center text-zinc-500">Label not found.</div>;

    const handleMessage = () => {
        if (!currentUser) {
             alert("Log in to message a label.");
             return;
        }
        if (!isRosterMember) {
            // Button should be disabled, but extra safety check
            return;
        }
        startConversation(selectedLabel);
    };

    const isPending = selectedLabel.status === 'pending';
    const isDisabled = selectedLabel.status === 'disabled';

    return (
        <div className="animate-fade-in pb-20">
            <button onClick={goBack} className="text-zinc-400 hover:text-white mb-6 text-sm font-semibold flex items-center gap-2">
                ← Back
            </button>

            {/* Header / Banner */}
            <div className="relative rounded-2xl overflow-hidden cardSurface mb-8">
                <div className="h-48 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-700">
                    {selectedLabel.cover_image_url && (
                        <img src={selectedLabel.cover_image_url} className="w-full h-full object-cover opacity-50" alt="Cover" />
                    )}
                </div>
                <div className="px-8 pb-8 -mt-16 flex flex-col md:flex-row items-end md:items-end gap-6">
                    <img 
                        src={selectedLabel.image_url} 
                        alt={selectedLabel.display_name} 
                        className="w-32 h-32 rounded-2xl border-4 border-zinc-950 bg-zinc-900 object-cover shadow-2xl"
                    />
                    <div className="flex-grow mb-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-extrabold text-white">{selectedLabel.display_name}</h1>
                            {selectedLabel.status === 'active' && <VerifiedIcon className="w-6 h-6 text-blue-500" />}
                        </div>
                        <p className="text-zinc-400 font-medium">{selectedLabel.company_name}</p>
                    </div>
                    
                    <div className="mb-2 flex flex-col gap-2 items-end">
                        <button 
                            onClick={handleMessage}
                            disabled={!currentUser || !isRosterMember || isPending || isDisabled}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${
                                currentUser && isRosterMember && !isPending && !isDisabled
                                ? 'bg-zinc-100 text-zinc-900 hover:bg-white' 
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                            }`}
                        >
                            <MessageIcon className="w-5 h-5" />
                            Message Label
                        </button>
                        {!currentUser && <p className="text-xs text-zinc-500">Log in to message a label.</p>}
                        {currentUser && !isRosterMember && <p className="text-xs text-zinc-500">Messaging disabled — only roster members may contact this label.</p>}
                    </div>
                </div>
            </div>

            {/* Status Banner for Non-Active */}
            {(isPending || isDisabled) && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-4 rounded-xl mb-8 text-center font-medium">
                    {isPending ? "This label profile is currently awaiting verification." : "This label account is currently disabled."}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="cardSurface p-8">
                        <h3 className="text-xl font-bold text-zinc-100 mb-4">About</h3>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {selectedLabel.notes || "No public bio provided."}
                        </p>
                        
                        {selectedLabel.website && (
                            <div className="mt-6 pt-6 border-t border-zinc-800">
                                <a href={selectedLabel.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors">
                                    <LinkIcon className="w-4 h-4" />
                                    {selectedLabel.website.replace(/^https?:\/\//, '')}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Featured Roster */}
                    <div>
                        <h3 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
                            <UsersIcon className="w-6 h-6 text-orange-500" />
                            Featured Roster
                        </h3>
                        
                        {isLoadingRoster ? (
                            <div className="text-zinc-500">Loading roster...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {roster?.artists.map(a => (
                                    <RosterCard key={a.id} member={a} type="Artist" onClick={() => viewArtistProfile(a)} />
                                ))}
                                {roster?.producers.map(p => (
                                    <RosterCard key={p.id} member={p} type="Producer" onClick={() => viewProducerProfile(p)} />
                                ))}
                                {roster?.engineers.map(e => (
                                    <RosterCard key={e.id} member={e} type="Engineer" onClick={() => viewEngineerProfile(e)} />
                                ))}
                                
                                {(!roster?.artists.length && !roster?.producers.length && !roster?.engineers.length) && (
                                    <p className="text-zinc-500 italic col-span-full">No public roster members listed.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Stats / Contact Info (if authorized) */}
                <div className="space-y-6">
                    <div className="cardSurface p-6">
                        <h3 className="font-bold text-zinc-100 mb-4">Contact Info</h3>
                        {isRosterMember ? (
                            <div className="space-y-3 text-sm">
                                {selectedLabel.contact_email && (
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase">Email</p>
                                        <p className="text-zinc-200">{selectedLabel.contact_email}</p>
                                    </div>
                                )}
                                {selectedLabel.contact_phone && (
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase">Phone</p>
                                        <p className="text-zinc-200">{selectedLabel.contact_phone}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 text-center">
                                <p className="text-zinc-500 text-sm">
                                    Contact details are hidden for non-roster members.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicLabelProfile;
