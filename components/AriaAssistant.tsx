import React, { useState, useEffect, useRef } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Booking, VibeMatchResult, AriaCantataMessage, AppView, UserRole, AriaActionResponse } from '../types';
import { askAriaCantata } from '../services/geminiService';
import { CloseIcon, PaperAirplaneIcon, MagicWandIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';

interface AriaCantataAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    onExecuteCommand: (command: AriaActionResponse, onClose: () => void) => void;
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

const AriaCantataAssistant: React.FC<AriaCantataAssistantProps> = (props) => {
    const { 
        isOpen, onClose, onExecuteCommand, history, setHistory, initialPrompt, clearInitialPrompt 
    } = props;
    const { currentUser, artists, engineers, producers, stoodioz, bookings } = useAppState();
    const { viewArtistProfile } = useNavigation();
    
    const getInitialMessage = () => {
        const greetings = [
            `Welcome back, ${currentUser?.name || 'superstar'}. Let’s create something worth remembering.`,
            `Hey, ${currentUser?.name || 'gorgeous'}. Ready to make the world listen?`,
            `Your sound is waiting, ${currentUser?.name || 'creative'}. Let’s make it timeless.`,
        ];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        return {
            role: 'model' as const,
            parts: [{ text: randomGreeting }]
        };
    };

    const [isLoading, setIsLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isProcessingInitialPrompt = useRef(false);

    useEffect(() => {
        if (isOpen && history.length === 0) {
            setHistory([getInitialMessage()]);
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            inputRef.current?.focus();
        }
    }, [history, isOpen]);

     useEffect(() => {
        if (isOpen && initialPrompt && !isProcessingInitialPrompt.current) {
            isProcessingInitialPrompt.current = true;
            handleSendMessage(null, initialPrompt);
            clearInitialPrompt();
            setTimeout(() => { isProcessingInitialPrompt.current = false; }, 1000);
        }
    }, [isOpen, initialPrompt]);

    const handleViewProfile = () => {
        const ariaProfile = artists.find(a => a.id === 'artist-aria-cantata');
        if (ariaProfile) {
            viewArtistProfile(ariaProfile);
            onClose();
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent | null, promptOverride?: string) => {
        e?.preventDefault();
        const question = promptOverride || inputValue.trim();
        if (!question || isLoading) return;

        const userMessage: AriaCantataMessage = { role: 'user', parts: [{ text: question }] };
        const historyBeforeSend = [...history, userMessage];
        
        setHistory(historyBeforeSend);
        setInputValue('');
        setIsLoading(true);

        try {
            const command = await askAriaCantata(history, question, currentUser, { artists, engineers, producers, stoodioz, bookings });
            
            const responseText = command.text || (command.type === 'error' ? command.value : "Done.");
            const ariaResponse: AriaCantataMessage = { role: 'model', parts: [{ text: responseText }] };
            
            setHistory([...historyBeforeSend, ariaResponse]);

            if (command.type !== 'speak' && command.type !== 'error') {
                 setTimeout(() => {
                    onExecuteCommand(command, onClose);
                }, 1000); // Small delay to let user read the response
            }

        } catch (error) {
            console.error("Aria parsing error:", error);
            const errorResponse: AriaCantataMessage = { role: 'model', parts: [{ text: "Sorry, I had a moment. Please try that again." }] };
            setHistory([...historyBeforeSend, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className={`
                fixed bottom-6 right-6 z-[60] w-[calc(100%-3rem)] max-w-sm h-[70vh] max-h-[600px] 
                bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-zinc-700/50 
                flex flex-col transition-all duration-300 ease-in-out
                ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
            `}
            role="dialog"
            aria-modal="true"
            aria-labelledby="aria-heading"
            aria-hidden={!isOpen}
        >
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-zinc-700/50 flex-shrink-0">
                <button 
                    onClick={handleViewProfile}
                    className="flex items-center gap-3 group"
                    tabIndex={isOpen ? 0 : -1}
                    aria-label="View Aria Cantata's profile"
                >
                    <div className="bg-gradient-to-br from-orange-500 to-purple-600 p-2 rounded-lg group-hover:scale-105 transition-transform">
                        <MagicWandIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 id="aria-heading" className="text-lg font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">Aria Cantata</h2>
                </button>
                <button 
                    onClick={onClose} 
                    className="text-zinc-400 hover:text-zinc-100 transition-colors"
                    tabIndex={isOpen ? 0 : -1}
                    aria-label="Close chat"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
            </header>

            {/* Messages */}
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {history.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={index} className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <MagicWandIcon className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-2xl ${isUser ? 'bg-orange-500 text-white rounded-br-lg' : 'bg-zinc-700 text-zinc-200 rounded-bl-lg'}`}>
                                <p className="text-sm">{msg.parts[0].text}</p>
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="flex items-end gap-2.5 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <MagicWandIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="max-w-xs p-3 rounded-2xl bg-zinc-700 text-zinc-200 rounded-bl-lg">
                            <TypingIndicator />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <footer className="p-4 border-t border-zinc-700/50 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask Aria Cantata anything..."
                        className="w-full bg-zinc-800 border-zinc-700 text-zinc-100 rounded-full py-2.5 px-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        aria-label="Your message to Aria Cantata"
                        tabIndex={isOpen ? 0 : -1}
                    />
                    <button 
                        type="submit" 
                        disabled={!inputValue.trim() || isLoading} 
                        className="bg-orange-500 text-white p-2.5 rounded-full hover:bg-orange-600 transition-colors flex-shrink-0 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                        tabIndex={isOpen ? 0 : -1}
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default AriaCantataAssistant;