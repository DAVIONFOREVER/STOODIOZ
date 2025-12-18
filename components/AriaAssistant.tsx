import React, { useState, useEffect, useRef } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Booking, AriaCantataMessage, AriaActionResponse, Label, RosterMember, LabelBudgetOverview, MediaAsset } from '../types';
import { askAriaCantata } from '../services/geminiService';
import { CloseIcon, PaperAirplaneIcon, MagicWandIcon, BriefcaseIcon, ChartBarIcon, CalendarIcon, UsersIcon, ChevronRightIcon } from './icons';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';

interface AriaCantataAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    onExecuteCommand: (command: AriaActionResponse, onClose: () => void) => Promise<void>;
    history: AriaCantataMessage[];
    setHistory: (history: AriaCantataMessage[]) => void;
    initialPrompt: string | null;
    clearInitialPrompt: () => void;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-1.5 p-2">
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
    </div>
);

const SuggestionChip: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-xs font-bold text-zinc-300 transition-all whitespace-nowrap"
    >
        {icon}
        {label}
    </button>
);

const AriaCantataAssistant: React.FC<AriaCantataAssistantProps> = ({ 
    isOpen, onClose, onExecuteCommand, history, setHistory, initialPrompt, clearInitialPrompt
}) => {
    const { currentUser, artists, engineers, stoodioz, producers, bookings, userRole } = useAppState();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [operationalContext, setOperationalContext] = useState<{ roster: RosterMember[], budget: LabelBudgetOverview | null, assets: MediaAsset[] }>({ roster: [], budget: null, assets: [] });
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => {
        if (isOpen && currentUser) {
            const fetchContext = async () => {
                const [roster, budget, assets] = await Promise.all([
                    userRole === 'LABEL' ? apiService.fetchLabelRoster(currentUser.id) : Promise.resolve([]),
                    userRole === 'LABEL' ? apiService.getLabelBudgetOverview(currentUser.id) : Promise.resolve(null),
                    apiService.fetchUserAssets(currentUser.id)
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
        setShowSuggestions(false);
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
                assets: operationalContext.assets
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

    return (
        <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[400px] flex flex-col bg-zinc-950 border-l border-zinc-800 shadow-2xl animate-slide-in-right">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 p-0.5 shadow-lg shadow-orange-500/20">
                        <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
                            <MagicWandIcon className="w-5 h-5 text-orange-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="font-bold text-zinc-100 text-sm">Aria Cantata</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">Operational Lead</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={onClose} 
                        className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                        title="Minimize"
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => { setHistory([]); onClose(); }} 
                        className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                        title="End Session"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {history.length === 0 && (
                    <div className="py-8 text-center space-y-4">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/20">
                            <MagicWandIcon className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-zinc-200 font-bold">How can I assist your operations?</h3>
                            <p className="text-zinc-500 text-xs px-8 mt-1">State an objective or use a suggested shortcut below.</p>
                        </div>
                    </div>
                )}
                
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-orange-600 text-white rounded-tr-none' 
                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-none'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-2 border border-zinc-700 shadow-sm">
                            <TypingIndicator />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer Area with Suggestions & Input */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                {showSuggestions && history.length === 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                        <SuggestionChip 
                            icon={<UsersIcon className="w-3.5 h-3.5" />} 
                            label="Discovery" 
                            onClick={() => handleSendMessage("Scout trending artists")} 
                        />
                        <SuggestionChip 
                            icon={<BriefcaseIcon className="w-3.5 h-3.5" />} 
                            label="Projects" 
                            onClick={() => handleSendMessage("Active rollouts")} 
                        />
                        <SuggestionChip 
                            icon={<ChartBarIcon className="w-3.5 h-3.5" />} 
                            label="Reporting" 
                            onClick={() => handleSendMessage("Monthly report")} 
                        />
                        <SuggestionChip 
                            icon={<CalendarIcon className="w-3.5 h-3.5" />} 
                            label="Schedule" 
                            onClick={() => handleSendMessage("Check conflicts")} 
                        />
                    </div>
                )}

                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                        placeholder="State objective..."
                        className="w-full bg-zinc-800 text-zinc-100 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-zinc-700 text-sm"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={() => handleSendMessage(inputValue)} 
                        disabled={!inputValue.trim() || isLoading} 
                        className="absolute right-1.5 top-1.5 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default AriaCantataAssistant;
