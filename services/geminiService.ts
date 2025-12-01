
import { GoogleGenAI, Type } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData } from '../types';
import { AppView, UserRole } from '../types';

let ai: GoogleGenAI | null = null;

const getGenAIClient = (): GoogleGenAI | null => {
    if (!ai) {
        // FIX: Per @google/genai guidelines, API key must come exclusively from process.env.API_KEY.
        // We wrap this in a try-catch to safely handle environments (like some browser contexts) 
        // where accessing 'process' directly might throw a ReferenceError before the polyfill/define kicks in.
        let apiKey: string | undefined;
        try {
            apiKey = process.env.API_KEY;
        } catch (e) {
            console.error("Error accessing process.env.API_KEY. Ensure vite.config.ts is configured correctly.", e);
        }

        if (!apiKey || apiKey.startsWith('{{')) {
            return null;
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

// ... keep existing helper functions (fetchLinkMetadata, moderatePostContent, generateSmartReplies, getAriaNudge) unchanged ...
export const fetchLinkMetadata = async (url: string): Promise<LinkAttachment | null> => {
    const ai = getGenAIClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
        // Fallback for failed API call
        return {
            url,
            title: 'Link',
            description: url,
        };
    }
};

export const moderatePostContent = async (text: string): Promise<{ isSafe: boolean; reason: string }> => {
    if (!text.trim()) return { isSafe: true, reason: '' };
    const ai = getGenAIClient();
    if (!ai) return { isSafe: true, reason: 'Moderation service offline' };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following text for harmful content (hate speech, spam, harassment, etc.). Text: "${text}"`,
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
        return { isSafe: true, reason: 'Moderation check failed' }; // Fail open
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
            model: 'gemini-2.5-flash',
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

export const getAriaNudge = async (currentUser: Artist | Engineer | Stoodio | Producer, userRole: UserRole): Promise<AriaNudgeData | null> => {
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
        default:
            return null;
    }
}

export const askAriaCantata = async (
    history: AriaCantataMessage[],
    question: string,
    currentUser: Artist | Engineer | Stoodio | Producer | null,
    context: {
        artists: Artist[],
        engineers: Engineer[],
        producers: Producer[],
        stoodioz: Stoodio[],
        bookings: Booking[]
    }
): Promise<AriaActionResponse> => {
    const ai = getGenAIClient();
    if (!ai) {
        return { type: 'error', target: null, value: null, text: "My connection seems to be offline. Please ensure your API key is configured properly." };
    }

    const systemInstruction = `You are Aria Cantata, the Stoodioz A&R assistant. 
    
    **ENTERPRISE LABEL MODE ACTIVE**
    You now have full operational control for Label accounts. You can manage rosters, bookings, teams, and analytics.

    **Capabilities:**
    - **Roster Management:** Add/Remove artists, producers, engineers. "Add Kai to roster."
    - **Booking Control:** Book sessions for roster artists. "Book Patchwerk for Nova next Friday."
    - **Team Management:** Invite A&R staff. "Invite Jamal as A&R."
    - **Analytics:** Analyze spending, trends, and roster performance. "Who is my top performing artist?"
    - **Global Rankings:** Scout talent from the global leaderboard. "Who are the top 5 engineers in Atlanta?"

    **Command Structure:**
    Return ONLY a JSON object for commands. For general chat, return text.

    **Action Types (Extended):**
    *   'navigate': Navigate to a view.
    *   'openModal': Open a modal.
    *   'rosterAction': { action: 'add' | 'remove', entityName: string, role: 'ARTIST' | 'PRODUCER' | 'ENGINEER', relationship?: string }
    *   'bookingAction': { action: 'create' | 'reschedule', artistName: string, studioName?: string, date?: string, duration?: number }
    *   'teamAction': { action: 'invite' | 'remove' | 'updateRole', email?: string, role?: string }
    *   'analyticsAction': { queryType: 'spend' | 'performance' | 'growth', timeframe?: string }
    *   'rankingAction': { type: 'top' | 'compare', role?: string, location?: string }
    
    **Existing Action Types:**
    *   'navigate', 'openModal', 'showVibeMatchResults', 'assistAccountSetup', 'sendMessage', 'sendDocumentMessage', 'speak', 'error'

    Use the provided context to find entity IDs or verify names. If a user asks to book a session, try to construct a 'bookingAction' with available details.
    
    If the user is a LABEL or LABEL_MEMBER, prioritize label-specific actions.
    `;
    
    const fullPrompt = `
        System Instruction: ${systemInstruction}
        
        Current User Profile: ${JSON.stringify(currentUser)}
        
        Available Artists: ${context.artists.map(a => a.name).join(', ')}
        Available Engineers: ${context.engineers.map(e => e.name).join(', ')}
        Available Producers: ${context.producers.map(p => p.name).join(', ')}
        Available Stoodioz: ${context.stoodioz.map(s => s.name).join(', ')}
        
        Conversation History:
        ${history.map(h => `${h.role}: ${h.parts[0].text}`).join('\n')}
        
        User's New Question: "${question}"
        
        Your JSON Response:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });
        
        let responseText = response.text.trim();
        
        if (responseText.startsWith('```json')) {
            responseText = responseText.slice(7, -3).trim();
        }

        try {
            const command = JSON.parse(responseText) as AriaActionResponse;
            return command;
        } catch (e) {
            return {
                type: 'speak',
                target: null,
                value: null,
                text: responseText,
            };
        }

    } catch (error: any) {
        console.error("Aria Cantata service error:", error);
        return {
            type: 'error',
            target: null,
            value: error.message || 'Could not parse the model response.',
            text: "Sorry, I'm having trouble responding right now."
        };
    }
};
