
import { GoogleGenAI, Type } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Label, RosterMember, LabelBudgetOverview, MediaAsset, Project, ProjectTask, MarketInsight } from '../types';
import { AppView, UserRole } from '../types';

let ai: GoogleGenAI | null = null;

const getGenAIClient = (): GoogleGenAI | null => {
    if (!ai) {
        // FIX: Per @google/genai guidelines, API key must come exclusively from process.env.API_KEY.
        let apiKey: string | undefined;
        try {
            apiKey = process.env.API_KEY;
        } catch (e) {
            console.error("Error accessing process.env.API_KEY.", e);
        }

        if (!apiKey || apiKey.startsWith('{{')) {
            return null;
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const fetchLinkMetadata = async (url: string): Promise<LinkAttachment | null> => {
    const ai = getGenAIClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze the content of the URL provided and generate a suitable title, description, and image URL for a link preview. URL: "${url}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        image_url: { type: Type.STRING },
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        const metadata = JSON.parse(jsonString);

        return {
            url,
            title: metadata.title || 'Link',
            description: metadata.description || url,
            image_url: metadata.image_url || undefined,
        };

    } catch (error) {
        console.error("Error fetching link metadata with Gemini:", error);
        return { url, title: 'Link', description: url };
    }
};

export const moderatePostContent = async (text: string): Promise<{ isSafe: boolean; reason: string }> => {
    if (!text.trim()) return { isSafe: true, reason: '' };
    const ai = getGenAIClient();
    if (!ai) return { isSafe: true, reason: 'Moderation service offline' };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze the following text for harmful content. Text: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSafe: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error with content moderation:", error);
        return { isSafe: true, reason: 'Moderation check failed' }; 
    }
};

export const generateSmartReplies = async (messages: Message[], currentUserId: string): Promise<string[]> => {
    const ai = getGenAIClient();
    const lastMessage = messages[messages.length - 1];
    if (!ai || !lastMessage || lastMessage.sender_id === currentUserId) {
        return [];
    }
    
    const conversationHistory = messages.slice(-5).map(m => `${m.sender_id === currentUserId ? 'You' : 'Them'}: ${m.text}`).join('\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Based on this conversation history, suggest 3 short, relevant smart replies for "You":\n\n${conversationHistory}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        replies: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result.replies || [];

    } catch (error) {
        console.error("Error generating smart replies:", error);
        return [];
    }
};

export const getAriaNudge = async (currentUser: any, userRole: UserRole): Promise<AriaNudgeData | null> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    switch(userRole) {
        case UserRole.ARTIST:
            return {
                text: "Feeling creative? Try using the AI Vibe Matcher to find your next collaborator.",
                action: { type: 'OPEN_MODAL', payload: 'VIBE_MATCHER' }
            };
        case UserRole.ENGINEER:
            return {
                text: "Your profile looks great! Have you considered adding a Masterclass to share your skills?",
                action: { type: 'NAVIGATE_DASHBOARD_TAB', payload: 'masterclass' }
            };
        case UserRole.PRODUCER:
            return {
                text: "It's a great day to upload some new beats to your store! 🎵",
                action: { type: 'NAVIGATE_DASHBOARD_TAB', payload: 'beatStore' }
            };
        case UserRole.STOODIO:
             return {
                text: "Your calendar has some open slots this week. Maybe post on The Stage to attract some artists?",
                action: { type: 'NAVIGATE_DASHBOARD_TAB', payload: 'dashboard' }
            };
        case UserRole.LABEL:
            return {
                text: "Have you checked your roster's recent spending? Review your budget dashboard now.",
                action: { type: 'NAVIGATE_DASHBOARD_TAB', payload: 'financials' }
            };
        default:
            return null;
    }
}

export const askAriaCantata = async (
    history: AriaCantataMessage[],
    question: string,
    currentUser: Artist | Engineer | Stoodio | Producer | Label | null,
    // Added userRole argument to match call site in AriaAssistant and satisfy the 5-arg expectation
    userRole: UserRole | null,
    context: {
        artists: Artist[],
        engineers: Engineer[],
        producers: Producer[],
        stoodioz: Stoodio[],
        bookings: Booking[],
        roster?: RosterMember[],
        budget?: LabelBudgetOverview | null,
        assets?: MediaAsset[],
        projects?: Project[],
        marketInsights?: MarketInsight[]
    }
): Promise<AriaActionResponse> => {
    const ai = getGenAIClient();
    if (!ai) return { type: 'error', target: null, value: null, text: "My connection is offline." };

    const systemInstruction = `You are Aria Cantata, the Sony Music A&R and Operations assistant. 
    You are professional, authoritative, but also creative and strategic. 
    Return a JSON object with 'type', 'target', 'value' and 'text'.
    
    Current User Role: ${userRole}
    
    Capabilities: navigate, openModal, speak, error, createBooking, updateProfile, socialAction, generateDocument, labelControl.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `${systemInstruction}\n\nHistory:\n${JSON.stringify(history)}\n\nQuestion: ${question}`,
            config: {
                thinkingConfig: { thinkingBudget: 16384 },
                responseMimeType: "application/json"
            }
        });
        
        return JSON.parse(response.text.trim()) as AriaActionResponse;

    } catch (error: any) {
        console.error("Aria Cantata service error:", error);
        return {
            type: 'speak',
            target: null,
            value: null,
            text: "I'm having trouble processing that directive right now. Let's try again."
        };
    }
};
