import React, { useState, useEffect, useRef } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Booking, AriaCantataMessage, AriaActionResponse, Label, RosterMember, LabelBudgetOverview, MediaAsset } from '../types';
import { askAriaCantata } from '../services/geminiService';
import { CloseIcon, PaperAirplaneIcon, MagicWandIcon, BriefcaseIcon, ChartBarIcon, CalendarIcon, UsersIcon } from './icons';
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
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
    </div>
);

const AriaCantataAssistant: React.FC<AriaCantataAssistantProps> = ({ 
    isOpen, onClose, onExecuteCommand, history, setHistory, initialPrompt, clearInitialPrompt
}) => {
    const { currentUser, artists, engineers, stoodioz, producers, bookings, userRole } = useAppState();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
            setHistory([...newHistory, { role: 'model', parts: [{ text: "Strategic lead intelligence is calibrating. Please try again." }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl h-[85vh] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 p-0.5"><div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center"><MagicWandIcon className="w-5 h-5 text-orange-400" /></div></div>
                        <div><h2 className="font-bold text-zinc-100">Aria Cantata</h2><p className="text-xs text-zinc-500">A&R Lead & Strategic Operations</p></div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"><CloseIcon className="w-6 h-6" /></button>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {history.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="p-6 rounded-full bg-zinc-800/50 border border-zinc-700"><MagicWandIcon className="w-12 h-12 text-orange-400 animate-pulse" /></div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">Operational Objectives</h3>
                                <p className="text-zinc-500 mt-1 max-w-xs mx-auto">Select a strategic command or state your objective.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                <button onClick={() => handleSendMessage("Scout new trending artists")} className="flex items-center gap-3 p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-left transition-all">
                                    <UsersIcon className="w-5 h-5 text-green-400" /> <span>Talent Discovery</span>
                                </button>
                                <button onClick={() => handleSendMessage("Manage my active rollout projects")} className="flex items-center gap-3 p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-left transition-all">
                                    <BriefcaseIcon className="w-5 h-5 text-orange-400" /> <span>Project Management</span>
                                </button>
                                <button onClick={() => handleSendMessage("Generate a monthly performance report")} className="flex items-center gap-3 p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-left transition-all">
                                    <ChartBarIcon className="w-5 h-5 text-blue-400" /> <span>Performance Reporting</span>
                                </button>
                                <button onClick={() => handleSendMessage("Are there any scheduling conflicts next week?")} className="flex items-center gap-3 p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-left transition-all">
                                    <CalendarIcon className="w-5 h-5 text-purple-400" /> <span>Logistics & Scheduling</span>
                                </button>
                            </div>
                        </div>
                    )}
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

                {/* Input */}
                <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                            placeholder="Direct Aria to an objective..."
                            className="w-full bg-zinc-800 text-zinc-100 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-zinc-700"
                            disabled={isLoading}
                        />
                        <button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg"><PaperAirplaneIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AriaCantataAssistant;