import React, { useState, useEffect, useRef } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Booking, AriaCantataMessage, AriaActionResponse, Label, RosterMember, LabelBudgetOverview, MediaAsset } from '../types';
import { askAriaCantata } from '../services/geminiService';
import { CloseIcon, PaperAirplaneIcon, MagicWandIcon, BriefcaseIcon, ChartBarIcon, CalendarIcon, UsersIcon, HouseIcon, MusicNoteIcon, SoundWaveIcon } from './icons';
import { ARIA_PROFILE_IMAGE_URL } from '../constants';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';

interface AriaCantataAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    onExecuteCommand: (command: AriaActionResponse, onClose: () => void) => Promise<void>;
    history: AriaCantataMessage[];
    setHistory: (history: AriaCantataMessage[]) => void;
    initialPrompt: string | null;
    clearInitialPrompt: () => void;
    isInline?: boolean;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
    </div>
);

const AriaCantataAssistant: React.FC<AriaCantataAssistantProps> = ({ 
    isOpen, onClose, onExecuteCommand, history, setHistory, initialPrompt, clearInitialPrompt, isInline = false
}) => {
    const { currentUser, artists, engineers, stoodioz, producers, bookings, userRole } = useAppState();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [operationalContext, setOperationalContext] = useState<{ roster: RosterMember[], budget: LabelBudgetOverview | null, assets: MediaAsset[], projects: any[] }>({ roster: [], budget: null, assets: [], projects: [] });
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => {
        if (isOpen && currentUser) {
            const fetchContext = async () => {
                const isLabel = userRole === 'LABEL';
                const [roster, budget, assets] = await Promise.all([
                    isLabel ? apiService.fetchLabelRoster(currentUser.id) : Promise.resolve([]),
                    isLabel ? apiService.getLabelBudgetOverview(currentUser.id) : Promise.resolve(null),
                    isLabel ? apiService.fetchUserAssets(currentUser.id) : Promise.resolve([])
                ]);
                setOperationalContext({ roster, budget, assets });
            };
            fetchContext();
        }
    }, [isOpen, currentUser, userRole]);

    useEffect(() => {
        if (isOpen) { scrollToBottom(); inputRef.current?.focus(); }
    }, [isOpen, history]);

    useEffect(() => {
        if (isOpen && initialPrompt) { handleSendMessage(initialPrompt); clearInitialPrompt(); }
    }, [isOpen, initialPrompt]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMessage: AriaCantataMessage = { role: 'user', parts: [{ text }] };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInputValue('');
        setIsLoading(true);

        try {
            const context = { 
                artists, engineers, producers, stoodioz, bookings,
                roster: operationalContext.roster,
                budget: operationalContext.budget,
                assets: operationalContext.assets,
                projects: operationalContext.projects
            };
            const response = await askAriaCantata(newHistory, text, currentUser as any, userRole, context);

            if (response.type !== 'speak' && response.type !== 'error') {
                await onExecuteCommand(response, onClose);
                const modelMessage: AriaCantataMessage = { role: 'model', parts: [{ text: response.text }] };
                setHistory([...newHistory, modelMessage]);
            } else {
                const modelMessage: AriaCantataMessage = { role: 'model', parts: [{ text: response.text }] };
                setHistory([...newHistory, modelMessage]);
            }
        } catch (error) {
            setHistory([...newHistory, { role: 'model', parts: [{ text: "Lead intelligence is calibrating. Please try again." }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const content = (
        <div className={`flex flex-col h-full ${isInline ? '' : 'bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden'}`}>
            {!isInline && (
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 p-0.5">
                            <img src={ARIA_PROFILE_IMAGE_URL} alt="Aria Cantata" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div><h2 className="font-bold text-zinc-100">Aria Cantata</h2><p className="text-xs text-zinc-500">A&R Lead & Strategic Operations</p></div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"><CloseIcon className="w-6 h-6" /></button>
                </div>
            )}

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {history.length === 0 && (() => {
                    type QuickReply = { msg: string; Icon: React.FC<{ className?: string }>; label: string; iconColor?: string };
                    const quickReplies: QuickReply[] = (() => {
                        switch (userRole) {
                            case 'STOODIO':
                                return [
                                    { msg: "What do I have coming up this week?", Icon: CalendarIcon, label: "Upcoming Bookings", iconColor: "text-orange-400" },
                                    { msg: "Post a new job for engineers", Icon: BriefcaseIcon, label: "Post a Job", iconColor: "text-green-400" },
                                    { msg: "Check my room availability", Icon: HouseIcon, label: "Room Availability", iconColor: "text-purple-400" },
                                    { msg: "Wallet or payouts", Icon: ChartBarIcon, label: "Wallet & Payouts", iconColor: "text-blue-400" },
                                ];
                            case 'LABEL':
                                return [
                                    { msg: "Scout new trending artists in the UK", Icon: UsersIcon, label: "A&R Talent Discovery", iconColor: "text-green-400" },
                                    { msg: "Manage my active rollout projects", Icon: BriefcaseIcon, label: "Project Management", iconColor: "text-orange-400" },
                                    { msg: "Generate a monthly performance report", Icon: ChartBarIcon, label: "Performance Reporting", iconColor: "text-blue-400" },
                                    { msg: "Are there any scheduling conflicts next week?", Icon: CalendarIcon, label: "Logistics & Scheduling", iconColor: "text-purple-400" },
                                ];
                            case 'ARTIST':
                                return [
                                    { msg: "Find a studio or engineer to book", Icon: UsersIcon, label: "Find Studio or Engineer", iconColor: "text-green-400" },
                                    { msg: "Check my upcoming sessions", Icon: CalendarIcon, label: "My Bookings", iconColor: "text-orange-400" },
                                    { msg: "Explore producers and beats", Icon: MusicNoteIcon, label: "Discover Producers", iconColor: "text-purple-400" },
                                    { msg: "Add funds or check my wallet", Icon: ChartBarIcon, label: "Wallet", iconColor: "text-blue-400" },
                                ];
                            case 'ENGINEER':
                                return [
                                    { msg: "View my job board and opportunities", Icon: BriefcaseIcon, label: "Job Board", iconColor: "text-orange-400" },
                                    { msg: "Check my schedule", Icon: CalendarIcon, label: "My Schedule", iconColor: "text-green-400" },
                                    { msg: "Mixing services and samples", Icon: SoundWaveIcon, label: "Mixing Services", iconColor: "text-purple-400" },
                                    { msg: "Wallet or payouts", Icon: ChartBarIcon, label: "Wallet & Payouts", iconColor: "text-blue-400" },
                                ];
                            case 'PRODUCER':
                                return [
                                    { msg: "My beats and beat store", Icon: MusicNoteIcon, label: "Beat Store", iconColor: "text-purple-400" },
                                    { msg: "Check my bookings", Icon: CalendarIcon, label: "My Bookings", iconColor: "text-orange-400" },
                                    { msg: "My masterclass", Icon: BriefcaseIcon, label: "Masterclass", iconColor: "text-green-400" },
                                    { msg: "Wallet or payouts", Icon: ChartBarIcon, label: "Wallet & Payouts", iconColor: "text-blue-400" },
                                ];
                            default:
                                return [
                                    { msg: "What do I have coming up?", Icon: CalendarIcon, label: "Upcoming", iconColor: "text-orange-400" },
                                    { msg: "Find studios or engineers", Icon: UsersIcon, label: "Discover", iconColor: "text-green-400" },
                                    { msg: "Help with my wallet", Icon: ChartBarIcon, label: "Wallet", iconColor: "text-blue-400" },
                                    { msg: "Take me to my dashboard", Icon: BriefcaseIcon, label: "My Dashboard", iconColor: "text-purple-400" },
                                ];
                        }
                    })();
                    return (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 p-0.5">
                                <img src={ARIA_PROFILE_IMAGE_URL} alt="Aria Cantata" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">How can I help?</h3>
                                <p className="text-zinc-500 mt-1 max-w-xs mx-auto">Pick a prompt or type what you need.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                {quickReplies.map(({ msg, Icon, label, iconColor }) => (
                                    <button key={label} onClick={() => handleSendMessage(msg)} className="flex items-center gap-3 p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-left transition-all">
                                        <Icon className={`w-5 h-5 ${iconColor || 'text-zinc-400'}`} /> <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })()}
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-tr-sm shadow-lg' : 'bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700 shadow-xl'}`}>
                            <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.parts[0].text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="bg-zinc-800 rounded-2xl rounded-tl-sm p-4 border border-zinc-700 shadow-xl"><TypingIndicator /></div></div>}
                <div ref={messagesEndRef} />
            </div>

            <div className={`p-4 bg-zinc-900 border-t border-zinc-800 ${isInline ? 'mt-auto' : ''}`}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                        placeholder="Tell me what you want..."
                        className="w-full bg-zinc-800 text-zinc-100 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-zinc-700"
                        disabled={isLoading}
                    />
                    <button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg"><PaperAirplaneIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );

    if (isInline) return content;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl h-[85vh] animate-slide-up">
                {content}
            </div>
        </div>
    );
};

export default AriaCantataAssistant;
