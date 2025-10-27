
import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, PaperAirplaneIcon, MagicWandIcon } from './icons';
import type { Artist, Engineer, Stoodio, Producer, AriaCantataMessage } from '../types';
import { UserRole } from '../types';
import { ARIA_CANTATA_IMAGE_URL } from '../constants';
import { askAriaCantata } from '../services/geminiService';
import { useAppState } from '../contexts/AppContext';

interface AriaAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    onStartConversation: (participant: any) => void;
    onStartGroupConversation: (participants: any[], title: string) => void;
    onUpdateProfile: (updates: any) => void;
    onBookStudio: (bookingDetails: any) => void;
    onShowVibeMatchResults: (results: any) => void;
    onNavigateRequest: (view: any, entityName?: string, tab?: string) => void;
    onSendMessageRequest: (recipientName: string, message: string) => void;
    onGetDirectionsRequest: (entityName: string) => void;
    onSendDocument: (recipient: any, documentContent: string, fileName: string) => void;
    onStartSetupRequest: (role: UserRole) => void;
    history: AriaCantataMessage[];
    setHistory: (history: AriaCantataMessage[]) => void;
    initialPrompt: string | null;
    clearInitialPrompt: () => void;
}

const AriaAssistant: React.FC<AriaAssistantProps> = (props) => {
    const { 
        isOpen, onClose, history, setHistory, initialPrompt, clearInitialPrompt,
        onNavigateRequest, onStartSetupRequest, onSendDocument
    } = props;
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { artists, engineers, producers, stoodioz, currentUser, bookings } = useAppState();

    useEffect(() => {
        if (initialPrompt && isOpen) {
            handleSend(initialPrompt);
            clearInitialPrompt();
        }
    }, [initialPrompt, isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSend = async (messageText?: string) => {
        const textToSend = (messageText || input).trim();
        if (!textToSend || isLoading) return;

        const userMessage: AriaCantataMessage = { role: 'user', parts: [{ text: textToSend }] };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const response = await askAriaCantata(newHistory, textToSend, currentUser, { artists, engineers, producers, stoodioz, bookings });
            
            if (response.type === 'function' && response.action) {
                switch(response.action) {
                    case 'navigateApp':
                        onNavigateRequest(response.payload.view, response.payload.entityName, response.payload.tab);
                        break;
                    case 'assistAccountSetup':
                        onStartSetupRequest(response.payload.role);
                        break;
                    case 'sendDocumentMessage':
                        onSendDocument(response.payload.recipient, response.payload.documentContent, response.payload.fileName);
                        break;
                }
            }

            const modelMessage: AriaCantataMessage = { role: 'model', parts: [{ text: response.text }] };
            setHistory([...newHistory, modelMessage]);
        } catch (error) {
            console.error("Aria Cantata Error:", error);
            const errorMessage: AriaCantataMessage = { role: 'model', parts: [{ text: "I'm having trouble connecting right now, darling. Please try again in a moment." }] };
            setHistory([...newHistory, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-900 w-full max-w-2xl h-[80vh] rounded-2xl border border-zinc-700 shadow-2xl flex flex-col">
                <header className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={ARIA_CANTATA_IMAGE_URL} alt="Aria Cantata" className="w-10 h-10 rounded-full" />
                        <h2 className="text-xl font-bold text-orange-400">Aria Cantata</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="flex-grow overflow-y-auto p-4 space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <img src={ARIA_CANTATA_IMAGE_URL} alt="Aria" className="w-8 h-8 rounded-full" />}
                            <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-br-lg' : 'bg-zinc-800 text-zinc-200 rounded-bl-lg'}`}>
                                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3">
                           <img src={ARIA_CANTATA_IMAGE_URL} alt="Aria" className="w-8 h-8 rounded-full" />
                           <div className="max-w-md p-3 rounded-2xl bg-zinc-800 text-zinc-200 rounded-bl-lg">
                               <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                                   <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                                   <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                               </div>
                           </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t border-zinc-700">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask Aria anything..."
                            className="w-full bg-zinc-800 border-zinc-700 rounded-full py-2 px-4 focus:ring-2 focus:ring-orange-500"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={!input.trim() || isLoading} className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 disabled:bg-zinc-600">
                            <PaperAirplaneIcon className="w-6 h-6" />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default AriaAssistant;
