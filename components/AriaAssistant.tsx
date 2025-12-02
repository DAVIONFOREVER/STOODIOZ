
import React, { useState, useEffect, useRef } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Booking, VibeMatchResult, AriaCantataMessage, AppView, UserRole, AriaActionResponse, FileAttachment, Label } from '../types';
import { askAriaCantata } from '../services/geminiService';
import { CloseIcon, PaperAirplaneIcon, MagicWandIcon, PaperclipIcon, DownloadIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { createPdfBytes } from '../lib/pdf';
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
    isOpen, 
    onClose, 
    onExecuteCommand,
    history, 
    setHistory,
    initialPrompt,
    clearInitialPrompt
}) => {
    const { currentUser, artists, engineers, stoodioz, producers, bookings } = useAppState();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            inputRef.current?.focus();
        }
    }, [isOpen, history]);

    useEffect(() => {
        if (isOpen && initialPrompt) {
            handleSendMessage(initialPrompt);
            clearInitialPrompt();
        }
    }, [isOpen, initialPrompt]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: AriaCantataMessage = { role: 'user', parts: [{ text }] };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInputValue('');
        setIsLoading(true);

        try {
            const context = { artists, engineers, producers, stoodioz, bookings };
            // Ensure currentUser is typed correctly for the service call
            const response = await askAriaCantata(newHistory, text, currentUser as (Artist | Engineer | Stoodio | Producer | Label | null), context);

            if (response.type !== 'speak' && response.type !== 'error') {
                // It's a command
                await onExecuteCommand(response, onClose);
                
                // Add a system message indicating the action was taken, unless it was a navigation which closes the modal
                if (response.type !== 'navigate' && response.type !== 'showVibeMatchResults') {
                     const modelMessage: AriaCantataMessage = { role: 'model', parts: [{ text: response.text }] };
                     setHistory([...newHistory, modelMessage]);
                }
            } else {
                // It's just text
                const modelMessage: AriaCantataMessage = { role: 'model', parts: [{ text: response.text }] };
                setHistory([...newHistory, modelMessage]);
            }

        } catch (error) {
            console.error("Error asking Aria:", error);
            const errorMessage: AriaCantataMessage = { role: 'model', parts: [{ text: "I'm having trouble connecting right now. Please try again later." }] };
            setHistory([...newHistory, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl h-[80vh] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 p-0.5">
                            <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
                                <MagicWandIcon className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-purple-400" />
                            </div>
                        </div>
                        <div>
                            <h2 className="font-bold text-zinc-100">Aria Cantata</h2>
                            <p className="text-xs text-zinc-400">AI A&R Assistant</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {history.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-4">
                            <MagicWandIcon className="w-12 h-12 opacity-20" />
                            <p>How can I help with your music career today?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm w-full max-w-lg">
                                <button onClick={() => handleSendMessage("Find me a studio in Atlanta")} className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-left">Find a studio in Atlanta</button>
                                <button onClick={() => handleSendMessage("Who is the best engineer for Trap?")} className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-left">Best engineer for Trap?</button>
                                <button onClick={() => handleSendMessage("Help me write a hook about summer")} className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-left">Write a hook about summer</button>
                                <button onClick={() => handleSendMessage("Draft a split sheet agreement")} className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-left">Draft a split sheet</button>
                            </div>
                        </div>
                    )}
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 ${
                                msg.role === 'user' 
                                ? 'bg-orange-600 text-white rounded-tr-sm' 
                                : 'bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700'
                            }`}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.parts[0].text}</p>
                                {/* Handle File Attachments if present in model response (simulated via text parsing or extended type) */}
                                {msg.files && msg.files.map((file, i) => (
                                    <div key={i} className="mt-3 flex items-center gap-3 bg-black/20 p-2 rounded-lg">
                                        <PaperclipIcon className="w-5 h-5 opacity-70"/>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="text-sm font-semibold truncate">{file.name}</p>
                                            <p className="text-xs opacity-70">{file.size}</p>
                                        </div>
                                        {/* Since rawContent is Uint8Array, create blob url for download */}
                                        <a 
                                            href={file.rawContent ? URL.createObjectURL(new Blob([file.rawContent], {type: 'application/pdf'})) : '#'} 
                                            download={file.name}
                                            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                                        >
                                            <DownloadIcon className="w-4 h-4"/>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm p-4 border border-zinc-700">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Aria anything..."
                            className="w-full bg-zinc-800 text-zinc-100 rounded-full py-3 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-zinc-700"
                            disabled={isLoading}
                        />
                        <button 
                            onClick={() => handleSendMessage(inputValue)}
                            disabled={!inputValue.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-all"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AriaCantataAssistant;
